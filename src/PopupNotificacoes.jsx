import { useState, useEffect, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const DIAS_ANTECEDENCIA = 3;

const hoje = () => {
  const d = new Date();
  return { dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear(), ts: d };
};

// How many days until a given day-of-month in the current or next month
function diasAte(diaAlvo) {
  const h = hoje();
  let alvo = new Date(h.ano, h.mes - 1, diaAlvo);
  if (alvo < h.ts) alvo = new Date(h.ano, h.mes, diaAlvo); // próximo mês
  const diff = Math.ceil((alvo - h.ts) / (1000 * 60 * 60 * 24));
  return diff;
}

// ── Alert generators ──────────────────────────────────────────────────────────
function gerarAlertas({ contas, transactions, orcamentos, metas }) {
  const alertas = [];
  const h = hoje();

  // 1. Vencimento de fatura do cartão (3 dias)
  contas.filter(c => c.tipo === "credito" && c.diaVencimento).forEach(c => {
    const dias = diasAte(c.diaVencimento);
    if (dias >= 0 && dias <= DIAS_ANTECEDENCIA) {
      // fatura atual = despesas no cartão cujas datas estão na fatura atual
      const faturaTotal = transactions
        .filter(t => t.contaId === c.id && t.tipo === "despesa")
        .reduce((s, t) => s + t.valor, 0);

      const msg = dias === 0
        ? `Fatura do ${c.nome} vence HOJE!`
        : dias === 1
          ? `Fatura do ${c.nome} vence amanhã`
          : `Fatura do ${c.nome} vence em ${dias} dias`;

      alertas.push({
        id:       `venc_${c.id}_${h.mes}_${h.ano}`,
        tipo:     "vencimento",
        icone:    "💳",
        urgencia: dias <= 1 ? "alta" : "media",
        titulo:   msg,
        detalhe:  faturaTotal > 0 ? `Valor estimado: ${fmt(faturaTotal)}` : "Verifique o valor no aplicativo do banco",
        cor:      dias <= 1 ? "#C0616A" : "#D4894A",
      });
    }
  });

  // 2. Parcelas vencendo na semana (próximos 7 dias)
  const fimSemana = new Date(h.ts);
  fimSemana.setDate(fimSemana.getDate() + 7);

  const parcelasProximas = transactions.filter(t => {
    if (t.tipo !== "despesa" || !t.totalParcelas || t.totalParcelas <= 1) return false;
    const dt = new Date(t.data);
    return dt >= h.ts && dt <= fimSemana;
  });

  // Group by grupo
  const gruposVistos = new Set();
  parcelasProximas.forEach(t => {
    const key = t.parcelaGrupoId || t.id;
    if (gruposVistos.has(key)) return;
    gruposVistos.add(key);
    const dt    = new Date(t.data);
    const dias  = Math.ceil((dt - h.ts) / (1000 * 60 * 60 * 24));
    const conta = contas.find(c => c.id === t.contaId);
    alertas.push({
      id:       `parcela_${key}_${h.mes}`,
      tipo:     "parcela",
      icone:    "📦",
      urgencia: dias <= 1 ? "alta" : "media",
      titulo:   dias === 0
        ? `Parcela de "${t.descricao}" vence hoje`
        : dias === 1
          ? `Parcela de "${t.descricao}" vence amanhã`
          : `Parcela de "${t.descricao}" vence em ${dias} dias`,
      detalhe:  `${t.parcelaAtual}/${t.totalParcelas} · ${fmt(t.valor)} · ${conta?.nome || "—"}`,
      cor:      dias <= 1 ? "#C0616A" : "#D4894A",
    });
  });

  // 3. Meta de investimento mensal não realizada
  // Heuristic: if there's no "investimento" tipo transaction this month, warn after day 5
  if (h.dia >= 5) {
    const mesStr = `${h.ano}-${String(h.mes).padStart(2, "0")}`;
    const contasInv = contas.filter(c => c.tipo === "investimento");
    contasInv.forEach(c => {
      const aporteMes = transactions.some(t =>
        t.contaId === c.id &&
        t.data.startsWith(mesStr)
      );
      if (!aporteMes) {
        alertas.push({
          id:       `invest_${c.id}_${mesStr}`,
          tipo:     "investimento",
          icone:    "📈",
          urgencia: "baixa",
          titulo:   `Nenhum aporte em "${c.nome}" este mês`,
          detalhe:  `Você costuma investir mensalmente. Lembre de fazer seu aporte!`,
          cor:      "#5B8FCC",
        });
      }
    });
  }

  // 4. Orçamento próximo do limite (≥ 80%)
  const despPorCat = {};
  transactions.forEach(t => {
    if (t.tipo === "despesa") despPorCat[t.categoria] = (despPorCat[t.categoria] || 0) + t.valor;
  });
  orcamentos.forEach(o => {
    const gasto = despPorCat[o.categoria] || 0;
    const pct   = Math.round((gasto / o.limite) * 100);
    if (pct >= 80) {
      alertas.push({
        id:       `orc_${o.categoria}_${h.mes}_${h.ano}`,
        tipo:     "orcamento",
        icone:    "⚠️",
        urgencia: pct >= 100 ? "alta" : "media",
        titulo:   pct >= 100
          ? `Limite de "${o.categoria}" atingido!`
          : `Orçamento de "${o.categoria}" em ${pct}%`,
        detalhe:  `${fmt(gasto)} gastos de ${fmt(o.limite)} no limite mensal`,
        cor:      pct >= 100 ? "#C0616A" : "#D4894A",
      });
    }
  });

  return alertas;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PopupNotificacoes({ contas, transactions, orcamentos, metas }) {
  const alertas = useMemo(
    () => gerarAlertas({ contas, transactions, orcamentos, metas }),
    [contas, transactions, orcamentos, metas]
  );

  // Load which alert IDs were already dismissed
  const [vistos, setVistos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ff_alertas_vistos") || "{}"); } catch { return {}; }
  });

  // Determine which alerts are "new" (not seen yet or changed)
  const alertasNovos = useMemo(
    () => alertas.filter(a => !vistos[a.id]),
    [alertas, vistos]
  );

  const [aberto, setAberto]       = useState(false);
  const [checks, setChecks]       = useState({});
  const [animSaindo, setAnimSaindo] = useState(false);

  // Open popup only if there are unseen alerts
  useEffect(() => {
    if (alertasNovos.length > 0) {
      setAberto(true);
      setChecks({});
    }
  }, []); // only on mount (post-login)

  const toggleCheck = (id) => setChecks(p => ({ ...p, [id]: !p[id] }));

  const fechar = () => {
    // Persist checked items as "seen"
    const novosVistos = { ...vistos };
    Object.entries(checks).forEach(([id, marcado]) => {
      if (marcado) novosVistos[id] = true;
    });
    localStorage.setItem("ff_alertas_vistos", JSON.stringify(novosVistos));
    setVistos(novosVistos);
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
      position: "fixed", inset: 0,
      background: "#00000040",
      backdropFilter: "blur(6px)",
      zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      animation: animSaindo ? "fadeOut .3s ease forwards" : "fadeIn .3s ease",
    }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.95)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .alerta-item { animation: slideIn .3s ease both; }
        .check-row { display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border-radius:12px; background:#FAF9F6; border:1px solid #EEE9DF; cursor:pointer; transition:background .15s; }
        .check-row:hover { background:#F0EDE7; }
        .check-row.checked { background:#3D9E7A08; border-color:#3D9E7A30; }
        .urgencia-alta  { border-left:3px solid #C0616A !important; }
        .urgencia-media { border-left:3px solid #D4894A !important; }
        .urgencia-baixa { border-left:3px solid #5B8FCC !important; }
      `}</style>

      <div style={{
        background: "#FFF",
        border: "1px solid #E8E3DB",
        borderRadius: 24,
        padding: "32px 28px",
        width: "100%",
        maxWidth: 480,
        maxHeight: "88vh",
        overflowY: "auto",
        boxShadow: "0 24px 64px #00000018",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"#D4894A15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🔔</div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:"#2D2D2D" }}>Avisos Importantes</div>
            <div style={{ fontSize:13, color:"#A09080", marginTop:2 }}>
              {alertasNovos.length} {alertasNovos.length === 1 ? "item requer" : "itens requerem"} sua atenção
            </div>
          </div>
        </div>

        <div style={{ height:1, background:"#F0EDE7", margin:"20px 0" }}/>

        {/* Alert list */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {alertasNovos.map((a, i) => (
            <div
              key={a.id}
              className={`alerta-item check-row urgencia-${a.urgencia} ${checks[a.id] ? "checked" : ""}`}
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => toggleCheck(a.id)}
            >
              {/* Checkbox */}
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                border: checks[a.id] ? "none" : "2px solid #CCC",
                background: checks[a.id] ? "#3D9E7A" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s",
              }}>
                {checks[a.id] && <span style={{ color:"#FFF", fontSize:12, lineHeight:1 }}>✓</span>}
              </div>

              {/* Icon */}
              <div style={{ fontSize:22, flexShrink:0, lineHeight:1, marginTop:1 }}>{a.icone}</div>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 14, color: checks[a.id] ? "#A09080" : "#2D2D2D",
                  textDecoration: checks[a.id] ? "line-through" : "none",
                  transition: "all .15s", lineHeight: 1.4,
                }}>{a.titulo}</div>
                <div style={{ fontSize:12, color:"#A09080", marginTop:4, lineHeight:1.4 }}>{a.detalhe}</div>
              </div>

              {/* Urgency badge */}
              <div style={{
                flexShrink: 0, fontSize:10, fontWeight:600, padding:"3px 8px",
                borderRadius:20, textTransform:"uppercase", letterSpacing:0.5,
                background: a.cor + "18", color: a.cor,
              }}>
                {a.urgencia === "alta" ? "Urgente" : a.urgencia === "media" ? "Atenção" : "Lembrete"}
              </div>
            </div>
          ))}
        </div>

        {/* Instrução */}
        <div style={{ fontSize:12, color:"#C0B8A8", textAlign:"center", margin:"16px 0 4px" }}>
          Marque os itens que você já viu — eles não aparecerão no próximo login
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:8, marginTop:14 }}>
          {!todosChecked && (
            <button onClick={marcarTodos} style={{
              flex:1, padding:"11px", border:"1px solid #E8E3DB", borderRadius:10,
              background:"transparent", color:"#5A5040", fontFamily:"inherit",
              fontSize:13, fontWeight:500, cursor:"pointer", transition:"all .15s",
            }}>Marcar todos</button>
          )}
          <button onClick={fechar} style={{
            flex:2, padding:"11px", border:"none", borderRadius:10,
            background: algumChecked ? "#3D9E7A" : "#F7F5F1",
            color: algumChecked ? "#FFF" : "#9A9080",
            fontFamily:"inherit", fontSize:14, fontWeight:600,
            cursor:"pointer", transition:"all .2s",
            boxShadow: algumChecked ? "0 4px 14px #3D9E7A30" : "none",
          }}>
            {algumChecked ? "Entendido, fechar ✓" : "Fechar por agora"}
          </button>
        </div>
      </div>
    </div>
  );
}
