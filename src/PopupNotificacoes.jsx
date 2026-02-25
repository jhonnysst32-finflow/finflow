import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase.js";

const fmt = (v) => (v ?? 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
const DIAS_ANTECEDENCIA = 3;

function diasAte(diaAlvo) {
  const hoje = new Date();
  let alvo = new Date(hoje.getFullYear(), hoje.getMonth(), diaAlvo);
  if (alvo <= hoje) alvo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaAlvo);
  return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24));
}

function gerarAlertas({ contas, transacoes, orcamentos }) {
  const alertas = [];
  const hoje    = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}`;

  // 1. Vencimento de fatura do cartão (3 dias)
  contas.filter(c => c.tipo === "credito" && c.dia_vencimento).forEach(c => {
    const dias = diasAte(c.dia_vencimento);
    if (dias >= 0 && dias <= DIAS_ANTECEDENCIA) {
      const faturaTotal = transacoes
        .filter(t => t.conta_id === c.id && t.tipo === "despesa")
        .reduce((s, t) => s + Number(t.valor), 0);
      alertas.push({
        id:       `venc_${c.id}_${hoje.getMonth()}_${hoje.getFullYear()}`,
        tipo:     "vencimento",
        icone:    "💳",
        urgencia: dias <= 1 ? "alta" : "media",
        titulo:   dias === 0 ? `Fatura do ${c.nome} vence HOJE!`
                : dias === 1 ? `Fatura do ${c.nome} vence amanhã`
                             : `Fatura do ${c.nome} vence em ${dias} dias`,
        detalhe:  faturaTotal > 0 ? `Valor estimado: ${fmt(faturaTotal)}` : "Verifique o valor no app do banco",
        cor:      dias <= 1 ? "#C0616A" : "#D4894A",
      });
    }
  });

  // 2. Parcelas vencendo na semana
  const fimSemana = new Date(hoje);
  fimSemana.setDate(fimSemana.getDate() + 7);
  const gruposVistos = new Set();
  transacoes
    .filter(t => t.tipo === "despesa" && t.total_parcelas > 1)
    .forEach(t => {
      const dt  = new Date(t.data);
      if (dt < hoje || dt > fimSemana) return;
      const key = t.parcela_grupo_id || t.id;
      if (gruposVistos.has(key)) return;
      gruposVistos.add(key);
      const dias  = Math.ceil((dt - hoje) / (1000 * 60 * 60 * 24));
      const conta = contas.find(c => c.id === t.conta_id);
      alertas.push({
        id:       `parcela_${key}_${hoje.getMonth()}`,
        tipo:     "parcela",
        icone:    "📦",
        urgencia: dias <= 1 ? "alta" : "media",
        titulo:   dias === 0 ? `Parcela de "${t.descricao}" vence hoje`
                : dias === 1 ? `Parcela de "${t.descricao}" vence amanhã`
                             : `Parcela de "${t.descricao}" vence em ${dias} dias`,
        detalhe:  `${t.parcela_atual}/${t.total_parcelas} · ${fmt(t.valor)} · ${conta?.nome || "—"}`,
        cor:      dias <= 1 ? "#C0616A" : "#D4894A",
      });
    });

  // 3. Aporte de investimento não feito no mês
  if (hoje.getDate() >= 5) {
    contas.filter(c => c.tipo === "investimento").forEach(c => {
      const temAporte = transacoes.some(t =>
        t.conta_id === c.id && t.data?.startsWith(mesAtual)
      );
      if (!temAporte) {
        alertas.push({
          id:       `invest_${c.id}_${mesAtual}`,
          tipo:     "investimento",
          icone:    "📈",
          urgencia: "baixa",
          titulo:   `Nenhum aporte em "${c.nome}" este mês`,
          detalhe:  "Você ainda não realizou seu investimento mensal.",
          cor:      "#5B8FCC",
        });
      }
    });
  }

  // 4. Orçamento ≥ 80%
  const despPorCat = {};
  transacoes.filter(t => t.tipo === "despesa" && t.data?.startsWith(mesAtual))
    .forEach(t => { despPorCat[t.categoria] = (despPorCat[t.categoria] || 0) + Number(t.valor); });
  orcamentos.forEach(o => {
    const gasto = despPorCat[o.categoria] || 0;
    const pct   = Math.round((gasto / o.limite) * 100);
    if (pct >= 80) {
      alertas.push({
        id:       `orc_${o.categoria}_${mesAtual}`,
        tipo:     "orcamento",
        icone:    "⚠️",
        urgencia: pct >= 100 ? "alta" : "media",
        titulo:   pct >= 100 ? `Limite de "${o.categoria}" atingido!`
                             : `Orçamento de "${o.categoria}" em ${pct}%`,
        detalhe:  `${fmt(gasto)} de ${fmt(o.limite)} no limite mensal`,
        cor:      pct >= 100 ? "#C0616A" : "#D4894A",
      });
    }
  });

  return alertas;
}

export default function PopupNotificacoes({ userId }) {
  const [dados,     setDados]     = useState({ contas:[], transacoes:[], orcamentos:[] });
  const [vistos,    setVistos]    = useState(new Set());
  const [aberto,    setAberto]    = useState(false);
  const [checks,    setChecks]    = useState({});
  const [animSaindo,setAnimSaindo]= useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const carregar = async () => {
      const [{ data: contas }, { data: transacoes }, { data: orcamentos }, { data: alertasVistos }] =
        await Promise.all([
          supabase.from("contas").select("*").eq("user_id", userId),
          supabase.from("transacoes").select("*").eq("user_id", userId),
          supabase.from("orcamentos").select("*").eq("user_id", userId),
          supabase.from("alertas_vistos").select("alerta_id").eq("user_id", userId),
        ]);
      setDados({
        contas:    contas    || [],
        transacoes:transacoes|| [],
        orcamentos:orcamentos|| [],
      });
      setVistos(new Set((alertasVistos || []).map(a => a.alerta_id)));
      setCarregado(true);
    };
    carregar();
  }, [userId]);

  const alertas      = useMemo(() => gerarAlertas(dados), [dados]);
  const alertasNovos = useMemo(() => alertas.filter(a => !vistos.has(a.id)), [alertas, vistos]);

  useEffect(() => {
    if (carregado && alertasNovos.length > 0) {
      setAberto(true);
      setChecks({});
    }
  }, [carregado]);

  const toggleCheck = (id) => setChecks(p => ({ ...p, [id]: !p[id] }));

  const fechar = async () => {
    // Salvar alertas marcados no Supabase
    const marcados = Object.entries(checks).filter(([,v])=>v).map(([id])=>({ user_id: userId, alerta_id: id }));
    if (marcados.length > 0) {
      await supabase.from("alertas_vistos").upsert(marcados, { onConflict: "user_id,alerta_id" });
    }
    setAnimSaindo(true);
    setTimeout(() => setAberto(false), 300);
  };

  const marcarTodos = () => {
    const all = {};
    alertasNovos.forEach(a => { all[a.id] = true; });
    setChecks(all);
  };

  if (!aberto || alertasNovos.length === 0) return null;

  const todosChecked = alertasNovos.every(a => checks[a.id]);
  const algumChecked = alertasNovos.some(a => checks[a.id]);

  return (
    <div style={{
      position:"fixed", inset:0, background:"#00000040",
      backdropFilter:"blur(6px)", zIndex:999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      animation: animSaindo ? "fadeOut .3s ease forwards" : "fadeIn .3s ease",
    }}>
      <style>{`
        @keyframes fadeIn  {from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeOut {from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.95)}}
        @keyframes slideIn {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .aitem{animation:slideIn .3s ease both}
        .arow{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:12px;background:#FAF9F6;border:1px solid #EEE9DF;cursor:pointer;transition:background .15s}
        .arow:hover{background:#F0EDE7}
        .arow.checked{background:#3D9E7A08;border-color:#3D9E7A30}
        .u-alta{border-left:3px solid #C0616A!important}
        .u-media{border-left:3px solid #D4894A!important}
        .u-baixa{border-left:3px solid #5B8FCC!important}
      `}</style>
      <div style={{ background:"#FFF", border:"1px solid #E8E3DB", borderRadius:24, padding:"32px 28px", width:"100%", maxWidth:480, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 64px #00000018", fontFamily:"'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"#D4894A15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🔔</div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600 }}>Avisos Importantes</div>
            <div style={{ fontSize:13, color:"#A09080", marginTop:2 }}>{alertasNovos.length} {alertasNovos.length===1?"item requer":"itens requerem"} sua atenção</div>
          </div>
        </div>

        <div style={{ height:1, background:"#F0EDE7", margin:"20px 0" }}/>

        {/* Lista */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {alertasNovos.map((a, i) => (
            <div key={a.id} className={`aitem arow u-${a.urgencia} ${checks[a.id]?"checked":""}`}
              style={{ animationDelay:`${i*60}ms` }} onClick={()=>toggleCheck(a.id)}>
              {/* Checkbox */}
              <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, marginTop:2, border:checks[a.id]?"none":"2px solid #CCC", background:checks[a.id]?"#3D9E7A":"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                {checks[a.id] && <span style={{ color:"#FFF", fontSize:12, lineHeight:1 }}>✓</span>}
              </div>
              <div style={{ fontSize:22, flexShrink:0, lineHeight:1, marginTop:1 }}>{a.icone}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:14, color:checks[a.id]?"#A09080":"#2D2D2D", textDecoration:checks[a.id]?"line-through":"none", transition:"all .15s", lineHeight:1.4 }}>{a.titulo}</div>
                <div style={{ fontSize:12, color:"#A09080", marginTop:4, lineHeight:1.4 }}>{a.detalhe}</div>
              </div>
              <div style={{ flexShrink:0, fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:0.5, background:a.cor+"18", color:a.cor }}>
                {a.urgencia==="alta"?"Urgente":a.urgencia==="media"?"Atenção":"Lembrete"}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize:12, color:"#C0B8A8", textAlign:"center", margin:"16px 0 4px" }}>
          Marque os itens que você já viu — não aparecerão no próximo login
        </div>

        <div style={{ display:"flex", gap:8, marginTop:14 }}>
          {!todosChecked && (
            <button onClick={marcarTodos} style={{ flex:1, padding:"11px", border:"1px solid #E8E3DB", borderRadius:10, background:"transparent", color:"#5A5040", fontFamily:"inherit", fontSize:13, fontWeight:500, cursor:"pointer" }}>Marcar todos</button>
          )}
          <button onClick={fechar} style={{ flex:2, padding:"11px", border:"none", borderRadius:10, background:algumChecked?"#3D9E7A":"#F7F5F1", color:algumChecked?"#FFF":"#9A9080", fontFamily:"inherit", fontSize:14, fontWeight:600, cursor:"pointer", transition:"all .2s", boxShadow:algumChecked?"0 4px 14px #3D9E7A30":"none" }}>
            {algumChecked ? "Entendido, fechar ✓" : "Fechar por agora"}
          </button>
        </div>
      </div>
    </div>
  );
}
