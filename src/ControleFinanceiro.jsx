import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart, Area } from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v) => v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v);
const tooltipStyle = { background: "#FFF", border: "1px solid #E8E3DB", borderRadius: 8, color: "#2D2D2D", boxShadow: "0 4px 16px #00000010" };
const MESES_NOMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ── Palette ──────────────────────────────────────────────────────────────────
const CORES = {
  receita: "#3D9E7A", despesa: "#C0616A", canal: "#D4894A", pessoal: "#8B6BB5",
  categorias: ["#3D9E7A","#D4894A","#5B8FCC","#8B6BB5","#C0616A","#6A9EB5","#7EB87E","#B5896A","#C49B4B","#5C8F72"],
};

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_CATS = {
  canal: ["AdSense","Patrocínio","Afiliados","Equipamento","Edição","Música/Licença","Marketing Canal","Outros Canal"],
  pessoal: ["Salário","Freelance","Alimentação","Transporte","Moradia","Saúde","Lazer","Outros Pessoal"],
};
const DEFAULT_CONTAS = [
  { id:"cc1", nome:"Nubank", tipo:"corrente", saldoInicial:2400, cor:"#8B6BB5" },
  { id:"cc2", nome:"Bradesco", tipo:"corrente", saldoInicial:1800, cor:"#5B8FCC" },
  { id:"cr1", nome:"Cartão Nubank", tipo:"credito", saldoInicial:0, limite:5000, cor:"#C0616A" },
  { id:"inv1", nome:"Investimentos", tipo:"investimento", saldoInicial:12000, cor:"#3D9E7A" },
];
const DEFAULT_TX = [
  {id:1,descricao:"AdSense Fevereiro",valor:1200,tipo:"receita",categoria:"AdSense",contaId:"cc1",segmento:"canal",data:"2026-02-10",nota:""},
  {id:2,descricao:"Microfone Blue Yeti",valor:650,tipo:"despesa",categoria:"Equipamento",contaId:"cr1",segmento:"canal",data:"2026-02-08",nota:"Para podcast"},
  {id:3,descricao:"Salário",valor:3500,tipo:"receita",categoria:"Salário",contaId:"cc1",segmento:"pessoal",data:"2026-02-05",nota:""},
  {id:4,descricao:"Aluguel",valor:900,tipo:"despesa",categoria:"Moradia",contaId:"cc1",segmento:"pessoal",data:"2026-02-01",nota:""},
  {id:5,descricao:"Aporte Mensal",valor:500,tipo:"despesa",categoria:"Outros Pessoal",contaId:"inv1",segmento:"pessoal",data:"2026-02-03",nota:"Tesouro Direto"},
  {id:6,descricao:"Patrocínio TikTok",valor:800,tipo:"receita",categoria:"Patrocínio",contaId:"cc1",segmento:"canal",data:"2026-02-15",nota:""},
  {id:7,descricao:"Adobe Premiere",valor:120,tipo:"despesa",categoria:"Edição",contaId:"cr1",segmento:"canal",data:"2026-02-12",nota:""},
  {id:8,descricao:"Mercado",valor:430,tipo:"despesa",categoria:"Alimentação",contaId:"cr1",segmento:"pessoal",data:"2026-02-18",nota:""},
  {id:9,descricao:"AdSense Janeiro",valor:980,tipo:"receita",categoria:"AdSense",contaId:"cc1",segmento:"canal",data:"2026-01-10",nota:""},
  {id:10,descricao:"Salário Jan",valor:3500,tipo:"receita",categoria:"Salário",contaId:"cc1",segmento:"pessoal",data:"2026-01-05",nota:""},
  {id:11,descricao:"Aluguel Jan",valor:900,tipo:"despesa",categoria:"Moradia",contaId:"cc1",segmento:"pessoal",data:"2026-01-01",nota:""},
  {id:12,descricao:"Mercado Jan",valor:380,tipo:"despesa",categoria:"Alimentação",contaId:"cr1",segmento:"pessoal",data:"2026-01-20",nota:""},
  {id:13,descricao:"Patrocínio Jan",valor:600,tipo:"receita",categoria:"Patrocínio",contaId:"cc1",segmento:"canal",data:"2026-01-18",nota:""},
  {id:14,descricao:"Adobe Jan",valor:120,tipo:"despesa",categoria:"Edição",contaId:"cr1",segmento:"canal",data:"2026-01-12",nota:""},
];
const DEFAULT_ORC = [
  {categoria:"Alimentação",limite:500},{categoria:"Equipamento",limite:800},
  {categoria:"Moradia",limite:1000},{categoria:"Edição",limite:150},{categoria:"Lazer",limite:200},
];
const DEFAULT_REC = [
  {id:"r1",descricao:"Adobe Premiere",valor:120,tipo:"despesa",categoria:"Edição",contaId:"cr1",segmento:"canal",diaVencimento:12,ativo:true},
  {id:"r2",descricao:"Spotify",valor:22,tipo:"despesa",categoria:"Lazer",contaId:"cr1",segmento:"pessoal",diaVencimento:5,ativo:true},
];
const DEFAULT_CANAL = [
  {mes:"Set/25",inscritos:4200,views:28000,rpm:6.2,receita:520},
  {mes:"Out/25",inscritos:5100,views:34000,rpm:6.8,receita:680},
  {mes:"Nov/25",inscritos:6400,views:41000,rpm:7.1,receita:820},
  {mes:"Dez/25",inscritos:7800,views:52000,rpm:7.4,receita:1050},
  {mes:"Jan/26",inscritos:9200,views:61000,rpm:7.8,receita:1180},
  {mes:"Fev/26",inscritos:11000,views:74000,rpm:8.0,receita:2000},
];
const DEFAULT_METAS = [
  {id:"m1",nome:"Câmera Sony ZV-E10",valor:3200,acumulado:1400,prazo:"2026-06-30",cor:"#5B8FCC",icone:"📷"},
  {id:"m2",nome:"Reserva de Emergência",valor:10000,acumulado:4500,prazo:"2026-12-31",cor:"#3D9E7A",icone:"🛡️"},
];

// ── localStorage hook ─────────────────────────────────────────────────────────
function usePersist(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem("ff_" + key); return s ? JSON.parse(s) : def; } catch { return def; }
  });
  useEffect(() => { try { localStorage.setItem("ff_" + key, JSON.stringify(val)); } catch {} }, [val, key]);
  return [val, setVal];
}

// ── Small UI ──────────────────────────────────────────────────────────────────
const Label = ({ children, style }) => (
  <div style={{ fontSize:11, color:"#A09080", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, fontWeight:500, ...style }}>{children}</div>
);
const Badge = ({ type }) => {
  const m = { corrente:{bg:"#5B8FCC18",c:"#3A6EB0",l:"Corrente"}, credito:{bg:"#C0616A18",c:"#9A3E46",l:"Crédito"}, investimento:{bg:"#3D9E7A18",c:"#2A7A5C",l:"Invest."} };
  const s = m[type] || m.corrente;
  return <span style={{background:s.bg,color:s.c,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:500}}>{s.l}</span>;
};

// ═════════════════════════════════════════════════════════════════════════════
export default function ControleFinanceiro() {
  // ── Persisted state ────────────────────────────────────────────────────────
  const [transactions, setTransactions] = usePersist("tx", DEFAULT_TX);
  const [contas, setContas]             = usePersist("contas", DEFAULT_CONTAS);
  const [orcamentos, setOrcamentos]     = usePersist("orc", DEFAULT_ORC);
  const [recorrentes, setRecorrentes]   = usePersist("rec", DEFAULT_REC);
  const [canalData, setCanalData]       = usePersist("canal", DEFAULT_CANAL);
  const [metas, setMetas]               = usePersist("metas", DEFAULT_METAS);
  const [customCats, setCustomCats]     = usePersist("cats", { canal:[], pessoal:[] });

  // ── UI state ───────────────────────────────────────────────────────────────
  const [page, setPage]       = useState("dashboard");
  const [modal, setModal]     = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [filtroSeg, setFiltroSeg]   = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busca, setBusca]           = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState({ ativo:false, ano:"2026", mes:"" });
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat]   = useState(false);

  // Forms
  const emptyTx    = { descricao:"",valor:"",tipo:"despesa",categoria:"",contaId:contas[0]?.id||"",segmento:"pessoal",data:new Date().toISOString().slice(0,10),nota:"" };
  const emptyConta = { nome:"",tipo:"corrente",saldoInicial:"",limite:"",cor:"#5B8FCC" };
  const emptyRec   = { descricao:"",valor:"",tipo:"despesa",categoria:"",contaId:contas[0]?.id||"",segmento:"pessoal",diaVencimento:"1",ativo:true };
  const emptyOrc   = { categoria:"",limite:"" };
  const emptyCanal = { mes:"",inscritos:"",views:"",rpm:"",receita:"" };
  const emptyMeta  = { nome:"",valor:"",acumulado:"",prazo:"",cor:"#5B8FCC",icone:"🎯" };

  const [formTx,    setFormTx]    = useState(emptyTx);
  const [formConta, setFormConta] = useState(emptyConta);
  const [formRec,   setFormRec]   = useState(emptyRec);
  const [formOrc,   setFormOrc]   = useState(emptyOrc);
  const [formCanal, setFormCanal] = useState(emptyCanal);
  const [formMeta,  setFormMeta]  = useState(emptyMeta);

  // ── Categories (built-in + custom) ────────────────────────────────────────
  const allCats = {
    canal:   [...DEFAULT_CATS.canal,   ...(customCats.canal   || [])],
    pessoal: [...DEFAULT_CATS.pessoal, ...(customCats.pessoal || [])],
  };

  const addCustomCat = (seg) => {
    const n = newCatInput.trim();
    if (!n || allCats[seg].includes(n)) return;
    setCustomCats(p => ({ ...p, [seg]: [...(p[seg]||[]), n] }));
    setFormTx(f => ({ ...f, categoria: n }));
    setNewCatInput("");
    setShowNewCat(false);
  };

  // ── Period filter ──────────────────────────────────────────────────────────
  const txFiltradas = useMemo(() => {
    let list = transactions;
    if (filtroPeriodo.ativo) {
      list = list.filter(t => {
        const [y, m] = t.data.split("-");
        if (filtroPeriodo.ano && y !== filtroPeriodo.ano) return false;
        if (filtroPeriodo.mes && m !== filtroPeriodo.mes) return false;
        return true;
      });
    }
    return list;
  }, [transactions, filtroPeriodo]);

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totalReceitas = txFiltradas.filter(t=>t.tipo==="receita").reduce((s,t)=>s+t.valor,0);
  const totalDespesas = txFiltradas.filter(t=>t.tipo==="despesa").reduce((s,t)=>s+t.valor,0);
  const saldo = totalReceitas - totalDespesas;
  const receitaCanal = txFiltradas.filter(t=>t.tipo==="receita"&&t.segmento==="canal").reduce((s,t)=>s+t.valor,0);
  const despesaCanal = txFiltradas.filter(t=>t.tipo==="despesa"&&t.segmento==="canal").reduce((s,t)=>s+t.valor,0);

  const saldoPorConta = useMemo(() => contas.map(c => {
    const rec  = txFiltradas.filter(t=>t.contaId===c.id&&t.tipo==="receita").reduce((s,t)=>s+t.valor,0);
    const desp = txFiltradas.filter(t=>t.contaId===c.id&&t.tipo==="despesa").reduce((s,t)=>s+t.valor,0);
    return { ...c, saldo: (c.saldoInicial||0) + rec - desp };
  }), [contas, txFiltradas]);

  const despPorCat = useMemo(() => {
    const m = {};
    txFiltradas.filter(t=>t.tipo==="despesa").forEach(t=>{m[t.categoria]=(m[t.categoria]||0)+t.valor;});
    return m;
  }, [txFiltradas]);

  const catData = Object.entries(despPorCat).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);

  const alertasOrc = useMemo(() => orcamentos.map(o => ({
    ...o, gasto:despPorCat[o.categoria]||0,
    pct: Math.min(100, Math.round(((despPorCat[o.categoria]||0)/o.limite)*100)),
  })), [orcamentos, despPorCat]);

  // ── Monthly comparison data ────────────────────────────────────────────────
  const comparativoMensal = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const [y, m] = t.data.split("-");
      const key = `${y}-${m}`;
      if (!map[key]) map[key] = { key, label: `${MESES_NOMES[parseInt(m)-1]}/${y.slice(2)}`, receitas:0, despesas:0 };
      if (t.tipo==="receita") map[key].receitas += t.valor;
      else map[key].despesas += t.valor;
    });
    return Object.values(map).sort((a,b)=>a.key.localeCompare(b.key)).map(d=>({...d, saldo:d.receitas-d.despesas}));
  }, [transactions]);

  // ── Filtered list for "Lançamentos" page ──────────────────────────────────
  const filtered = useMemo(() => txFiltradas.filter(t =>
    (filtroSeg==="todos"||t.segmento===filtroSeg) &&
    (filtroTipo==="todos"||t.tipo===filtroTipo) &&
    (!busca || t.descricao.toLowerCase().includes(busca.toLowerCase()) || t.categoria.toLowerCase().includes(busca.toLowerCase()))
  ), [txFiltradas, filtroSeg, filtroTipo, busca]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = (type, item=null) => {
    setModal(type); setEditItem(item); setShowNewCat(false); setNewCatInput("");
    if (type==="tx")         setFormTx(item?{...item}:emptyTx);
    if (type==="conta")      setFormConta(item?{...item}:emptyConta);
    if (type==="recorrente") setFormRec(item?{...item}:emptyRec);
    if (type==="orcamento")  setFormOrc(item?{...item}:emptyOrc);
    if (type==="canal")      setFormCanal(item?{...item}:emptyCanal);
    if (type==="meta")       setFormMeta(item?{...item}:emptyMeta);
  };
  const closeModal = () => { setModal(null); setEditItem(null); setShowNewCat(false); setNewCatInput(""); };

  // ── Save handlers ──────────────────────────────────────────────────────────
  const saveTx = () => {
    if (!formTx.descricao||!formTx.valor||!formTx.categoria) return;
    const tx = {...formTx, valor:parseFloat(formTx.valor)};
    if (editItem) setTransactions(p=>p.map(t=>t.id===editItem.id?{...tx,id:t.id}:t));
    else setTransactions(p=>[...p,{...tx,id:Date.now()}]);
    closeModal();
  };
  const saveConta = () => {
    if (!formConta.nome) return;
    const c = {...formConta,saldoInicial:parseFloat(formConta.saldoInicial)||0,limite:parseFloat(formConta.limite)||0};
    if (editItem) setContas(p=>p.map(x=>x.id===editItem.id?{...c,id:x.id}:x));
    else setContas(p=>[...p,{...c,id:"c"+Date.now()}]);
    closeModal();
  };
  const saveRec = () => {
    if (!formRec.descricao||!formRec.valor) return;
    const r = {...formRec,valor:parseFloat(formRec.valor),diaVencimento:parseInt(formRec.diaVencimento)};
    if (editItem) setRecorrentes(p=>p.map(x=>x.id===editItem.id?{...r,id:x.id}:x));
    else setRecorrentes(p=>[...p,{...r,id:"r"+Date.now()}]);
    closeModal();
  };
  const saveOrc = () => {
    if (!formOrc.categoria||!formOrc.limite) return;
    const o = {...formOrc,limite:parseFloat(formOrc.limite)};
    if (editItem) setOrcamentos(p=>p.map(x=>x.categoria===editItem.categoria?o:x));
    else setOrcamentos(p=>[...p,o]);
    closeModal();
  };
  const saveCanal = () => {
    if (!formCanal.mes) return;
    const c = {...formCanal,inscritos:parseInt(formCanal.inscritos)||0,views:parseInt(formCanal.views)||0,rpm:parseFloat(formCanal.rpm)||0,receita:parseFloat(formCanal.receita)||0};
    if (editItem) setCanalData(p=>p.map(x=>x.mes===editItem.mes?c:x));
    else setCanalData(p=>[...p,c]);
    closeModal();
  };
  const saveMeta = () => {
    if (!formMeta.nome||!formMeta.valor) return;
    const m = {...formMeta,valor:parseFloat(formMeta.valor),acumulado:parseFloat(formMeta.acumulado)||0};
    if (editItem) setMetas(p=>p.map(x=>x.id===editItem.id?{...m,id:x.id}:x));
    else setMetas(p=>[...p,{...m,id:"m"+Date.now()}]);
    closeModal();
  };

  const aplicarRecorrentes = () => {
    const hoje = new Date();
    const novos = recorrentes.filter(r=>r.ativo).map(r=>({
      ...r, id:Date.now()+Math.random(), nota:"🔄 Recorrente",
      data:`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(r.diaVencimento).padStart(2,"0")}`
    }));
    setTransactions(p=>[...p,...novos]);
  };

  const exportPDF = () => {
    const w = window.open("","_blank");
    const rows = [...transactions].sort((a,b)=>b.data.localeCompare(a.data)).map(t=>{
      const conta = contas.find(c=>c.id===t.contaId);
      return `<tr><td>${t.data}</td><td>${t.descricao}</td><td>${t.categoria}</td><td>${conta?.nome||"—"}</td><td>${t.tipo}</td><td style="color:${t.tipo==="receita"?"#2A7A5C":"#9A3E46"};font-weight:600">${t.tipo==="receita"?"+":"-"}${fmt(t.valor)}</td></tr>`;
    }).join("");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório FinFlow</title><style>body{font-family:'Segoe UI',sans-serif;color:#2D2D2D;padding:32px;max-width:900px;margin:0 auto}h1{color:#3D9E7A;font-size:28px}h2{font-size:16px;margin:24px 0 10px;color:#5A5040}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}.card{background:#F7F5F1;border-radius:12px;padding:16px;border-top:3px solid #ddd}.val{font-size:22px;font-weight:700;margin:4px 0}.lbl{font-size:11px;color:#A09080;text-transform:uppercase;letter-spacing:1px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:8px 10px;color:#A09080;font-weight:500;border-bottom:2px solid #E8E3DB}td{padding:8px 10px;border-bottom:1px solid #F0EDE7}</style></head><body>
    <h1>FinFlow — Relatório</h1><p style="color:#A09080">${new Date().toLocaleString("pt-BR")}</p>
    <div class="grid">
      <div class="card" style="border-color:${saldo>=0?"#3D9E7A":"#C0616A"}"><div class="lbl">Saldo</div><div class="val" style="color:${saldo>=0?"#3D9E7A":"#C0616A"}">${fmt(saldo)}</div></div>
      <div class="card" style="border-color:#3D9E7A"><div class="lbl">Receitas</div><div class="val" style="color:#3D9E7A">${fmt(totalReceitas)}</div></div>
      <div class="card" style="border-color:#C0616A"><div class="lbl">Despesas</div><div class="val" style="color:#C0616A">${fmt(totalDespesas)}</div></div>
    </div>
    <h2>Extrato</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
    w.document.close(); setTimeout(()=>w.print(),400);
  };

  // ── Period label ───────────────────────────────────────────────────────────
  const periodoLabel = filtroPeriodo.ativo
    ? filtroPeriodo.mes
      ? `${MESES_NOMES[parseInt(filtroPeriodo.mes)-1]}/${filtroPeriodo.ano}`
      : `Ano ${filtroPeriodo.ano}`
    : "Todos os períodos";

  // ── Anos disponíveis nos dados ─────────────────────────────────────────────
  const anosDisponiveis = [...new Set(transactions.map(t=>t.data.slice(0,4)))].sort();

  const cats = allCats[formTx.segmento] || [];
  const catsRec = allCats[formRec.segmento] || [];

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:"100vh",background:"#F7F5F1",fontFamily:"'DM Sans',sans-serif",color:"#2D2D2D"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#F7F5F1}::-webkit-scrollbar-thumb{background:#D5CFC5;border-radius:4px}
        .card{background:#FFF;border:1px solid #E8E3DB;border-radius:16px;padding:20px;transition:border-color .2s,box-shadow .2s}
        .card:hover{border-color:#CFC8BC;box-shadow:0 4px 20px #00000009}
        .btn{cursor:pointer;border:none;border-radius:10px;padding:10px 20px;font-family:inherit;font-size:14px;font-weight:500;transition:all .15s}
        .btn-primary{background:#3D9E7A;color:#fff}.btn-primary:hover{background:#348A6A;transform:translateY(-1px);box-shadow:0 4px 14px #3D9E7A30}
        .btn-secondary{background:#F7F5F1;color:#5A5040;border:1px solid #E8E3DB}.btn-secondary:hover{background:#EDE9E2}
        .btn-ghost{background:none;border:1px solid #E8E3DB;color:#5A5040;cursor:pointer;border-radius:8px;padding:6px 12px;font-family:inherit;font-size:13px;transition:all .15s}.btn-ghost:hover{background:#EDE9E2}
        .btn-danger{background:transparent;color:#C0616A;border:1px solid #C0616A30;padding:5px 10px;font-size:12px;border-radius:6px;cursor:pointer;font-family:inherit}
        .btn-danger:hover{background:#C0616A0D}
        .btn-icon{background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;color:#A09080;font-size:14px;font-family:inherit}
        .btn-icon:hover{background:#EDE9E2;color:#5A5040}
        .nav-btn{background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;padding:9px 13px;border-radius:10px;transition:all .15s;color:#9A9080;white-space:nowrap}
        .nav-btn.active{color:#3D9E7A;background:#3D9E7A12}.nav-btn:hover:not(.active){color:#2D2D2D;background:#EDE9E2}
        input,select,textarea{background:#FAF9F6;border:1px solid #DDD8CF;border-radius:10px;padding:10px 14px;color:#2D2D2D;font-family:inherit;font-size:14px;width:100%;outline:none;transition:border-color .15s}
        input:focus,select:focus,textarea:focus{border-color:#3D9E7A;background:#fff;box-shadow:0 0 0 3px #3D9E7A12}
        textarea{resize:vertical;min-height:60px}select option{background:#fff}
        .tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500}
        .tag-canal{background:#D4894A18;color:#A8622A}.tag-pessoal{background:#8B6BB518;color:#6A4E9A}
        .tag-receita{background:#3D9E7A18;color:#2A7A5C}.tag-despesa{background:#C0616A18;color:#9A3E46}
        .pill{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:20px;font-size:13px;cursor:pointer;border:1px solid transparent;transition:all .15s;background:transparent;font-family:inherit;color:#9A9080}
        .pill.active{background:#3D9E7A12;color:#3D9E7A;border-color:#3D9E7A30}.pill:hover:not(.active){background:#EDE9E2;color:#2D2D2D}
        .modal-overlay{position:fixed;inset:0;background:#00000038;backdrop-filter:blur(8px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
        .modal{background:#FFF;border:1px solid #E8E3DB;border-radius:20px;padding:28px;width:100%;max-width:500px;box-shadow:0 24px 64px #00000014;max-height:90vh;overflow-y:auto}
        .stat-num{font-family:'Playfair Display',serif}
        .row{display:flex;gap:16px;flex-wrap:wrap}.col{flex:1;min-width:200px}
        .bar-bg{height:8px;background:#EDE9E2;border-radius:4px;overflow:hidden}
        .bar{height:8px;border-radius:4px;transition:width .6s}
        .search-box{background:#FFF;border:1px solid #E8E3DB;border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px}
        .search-box input{border:none;background:transparent;box-shadow:none;padding:0;font-size:14px}
        .search-box input:focus{box-shadow:none;border:none}
        .periodo-bar{background:#FFF;border:1px solid #E8E3DB;border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .conta-card{background:#FFF;border:1px solid #E8E3DB;border-radius:14px;padding:16px;transition:all .2s}
        .conta-card:hover{box-shadow:0 4px 16px #00000010;border-color:#CFC8BC}
        .saved-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#2A7A5C;background:#3D9E7A12;padding:3px 10px;border-radius:20px}
        @media(max-width:600px){.col{min-width:100%}}
      `}</style>

      {/* ── Header ── */}
      <div style={{borderBottom:"1px solid #E8E3DB",background:"#FFF",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 0"}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#3D9E7A,#5B8FCC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>₿</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:600}}>FinFlow</span>
          <span className="saved-badge">💾 Auto-salvo</span>
        </div>
        <nav style={{display:"flex",gap:2,flexWrap:"wrap"}}>
          {[["dashboard","📊"],["lancamentos","💸"],["contas","🏦"],["metas","🎯"],["canal","📹"],["recorrentes","🔄"],["orcamentos","⚠️"],["relatorios","📈"]].map(([k,icon])=>(
            <button key={k} className={`nav-btn ${page===k?"active":""}`} onClick={()=>setPage(k)} title={k}>
              {icon} <span style={{textTransform:"capitalize"}}>{k}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Period filter bar (global) ── */}
      <div style={{background:"#FFF",borderBottom:"1px solid #F0EDE7",padding:"8px 20px"}}>
        <div className="periodo-bar" style={{maxWidth:1100,margin:"0 auto"}}>
          <span style={{fontSize:13,color:"#A09080",fontWeight:500}}>📅 Período:</span>
          <button className={`pill ${!filtroPeriodo.ativo?"active":""}`} onClick={()=>setFiltroPeriodo({ativo:false,ano:"2026",mes:""})}>Todos</button>
          {anosDisponiveis.map(a=>(
            <button key={a} className={`pill ${filtroPeriodo.ativo&&filtroPeriodo.ano===a&&!filtroPeriodo.mes?"active":""}`}
              onClick={()=>setFiltroPeriodo({ativo:true,ano:a,mes:""})}>
              {a}
            </button>
          ))}
          <div style={{display:"flex",gap:6,alignItems:"center",marginLeft:4}}>
            <select style={{width:"auto",padding:"5px 10px",fontSize:12,borderRadius:8}}
              value={filtroPeriodo.mes}
              onChange={e=>setFiltroPeriodo(p=>({...p,ativo:true,mes:e.target.value}))}>
              <option value="">Todos os meses</option>
              {MESES_NOMES.map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
            </select>
          </div>
          <span style={{fontSize:12,color:"#A09080",marginLeft:"auto"}}>Exibindo: <strong style={{color:"#5A5040"}}>{periodoLabel}</strong></span>
        </div>
      </div>

      <div style={{padding:"24px",maxWidth:1100,margin:"0 auto"}}>

        {/* ══════════ DASHBOARD ══════════ */}
        {page==="dashboard" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>Visão Geral</div>
                <div style={{color:"#A09080",fontSize:13,marginTop:2}}>{periodoLabel}</div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button className="btn btn-secondary" onClick={exportPDF}>📄 PDF</button>
                <button className="btn btn-primary" onClick={()=>openModal("tx")}>+ Lançamento</button>
              </div>
            </div>

            {/* KPIs */}
            <div className="row">
              {[
                {label:"SALDO",value:saldo,color:saldo>=0?CORES.receita:CORES.despesa,sub:"receitas − despesas"},
                {label:"RECEITAS",value:totalReceitas,color:CORES.receita,sub:`${txFiltradas.filter(t=>t.tipo==="receita").length} lançamentos`},
                {label:"DESPESAS",value:totalDespesas,color:CORES.despesa,sub:`${txFiltradas.filter(t=>t.tipo==="despesa").length} lançamentos`},
              ].map(c=>(
                <div key={c.label} className="card col" style={{borderTop:`3px solid ${c.color}`}}>
                  <Label>{c.label}</Label>
                  <div className="stat-num" style={{fontSize:28,color:c.color}}>{fmt(c.value)}</div>
                  <div style={{fontSize:12,color:"#A09080",marginTop:4}}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Saldo por conta */}
            <div className="card">
              <Label>Saldo por Conta</Label>
              <div className="row">
                {saldoPorConta.map(c=>(
                  <div key={c.id} style={{flex:1,minWidth:130,padding:"10px 14px",background:"#FAF9F6",borderRadius:10,borderLeft:`3px solid ${c.cor}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:500}}>{c.nome}</span><Badge type={c.tipo}/>
                    </div>
                    <div className="stat-num" style={{fontSize:20,color:c.saldo>=0?CORES.receita:CORES.despesa}}>{fmt(c.saldo)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparativo Mensal */}
            <div className="card">
              <Label>📊 Comparativo Mensal</Label>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={comparativoMensal}>
                  <XAxis dataKey="label" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
                  <Legend formatter={v=><span style={{color:"#5A5040",fontSize:13}}>{v}</span>}/>
                  <Bar dataKey="receitas" fill={CORES.receita} radius={[4,4,0,0]} name="Receitas" opacity={0.85}/>
                  <Bar dataKey="despesas" fill={CORES.despesa} radius={[4,4,0,0]} name="Despesas" opacity={0.85}/>
                  <Line type="monotone" dataKey="saldo" stroke="#5B8FCC" strokeWidth={2} dot={{r:3,fill:"#5B8FCC"}} name="Saldo"/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Canal + alertas */}
            <div className="row">
              <div className="card col" style={{borderLeft:`3px solid ${CORES.canal}`,background:"#FFFCF8",minWidth:220}}>
                <Label>📹 Canais</Label>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[["Receita",receitaCanal,CORES.canal],["Custos",despesaCanal,CORES.despesa],["Lucro",receitaCanal-despesaCanal,receitaCanal-despesaCanal>=0?CORES.receita:CORES.despesa]].map(([l,v,c])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,color:"#A09080"}}>{l}</span>
                      <span className="stat-num" style={{fontSize:18,color:c}}>{fmt(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {alertasOrc.some(a=>a.pct>=70) && (
                <div className="card col" style={{borderLeft:"3px solid #D4894A",background:"#FFFBF5",minWidth:220}}>
                  <Label>⚠️ Alertas</Label>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {alertasOrc.filter(a=>a.pct>=70).map(a=>(
                      <div key={a.categoria}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                          <span>{a.categoria}</span>
                          <span style={{color:a.pct>=100?CORES.despesa:CORES.canal,fontWeight:600}}>{a.pct}%</span>
                        </div>
                        <div className="bar-bg"><div className="bar" style={{width:`${a.pct}%`,background:a.pct>=100?CORES.despesa:a.pct>=90?"#C0616A":CORES.canal}}/></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gráficos pizza + barras */}
            <div className="row">
              <div className="card col" style={{minWidth:240}}>
                <Label>Receitas vs Despesas</Label>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={[{name:"Receitas",value:totalReceitas},{name:"Despesas",value:totalDespesas}]} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={4} dataKey="value">
                      {[CORES.receita,CORES.despesa].map((c,i)=><Cell key={i} fill={c}/>)}
                    </Pie>
                    <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
                    <Legend formatter={v=><span style={{color:"#5A5040",fontSize:12}}>{v}</span>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card col" style={{minWidth:240}}>
                <Label>Top Despesas</Label>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={catData.slice(0,5)} layout="vertical" margin={{left:10}}>
                    <XAxis type="number" hide/><YAxis type="category" dataKey="name" width={88} tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
                    <Bar dataKey="value" radius={[0,6,6,0]}>{catData.slice(0,5).map((_,i)=><Cell key={i} fill={CORES.categorias[i%CORES.categorias.length]}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Últimos */}
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <Label style={{marginBottom:0}}>Últimos Lançamentos</Label>
                <button className="btn-icon" onClick={()=>setPage("lancamentos")}>Ver todos →</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[...txFiltradas].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,5).map(t=>{
                  const conta=contas.find(c=>c.id===t.contaId);
                  return (
                    <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#FAF9F6",borderRadius:10,flexWrap:"wrap",gap:8,border:"1px solid #EEE9DF"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:150}}>
                        <div style={{width:34,height:34,borderRadius:8,background:t.tipo==="receita"?"#3D9E7A15":"#C0616A15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{t.tipo==="receita"?"↑":"↓"}</div>
                        <div>
                          <div style={{fontSize:14,fontWeight:500}}>{t.descricao}</div>
                          <div style={{fontSize:12,color:"#A09080"}}>{t.categoria} · {conta?.nome||"—"}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span className={`tag tag-${t.segmento}`}>{t.segmento}</span>
                        <div className="stat-num" style={{fontSize:17,color:t.tipo==="receita"?CORES.receita:CORES.despesa}}>{t.tipo==="receita"?"+":"-"}{fmt(t.valor)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ LANÇAMENTOS ══════════ */}
        {page==="lancamentos" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>Lançamentos</div>
                <div style={{color:"#A09080",fontSize:13,marginTop:2}}>{filtered.length} registros</div>
              </div>
              <button className="btn btn-primary" onClick={()=>openModal("tx")}>+ Novo</button>
            </div>

            {/* Search */}
            <div className="search-box">
              <span style={{color:"#A09080",fontSize:16}}>🔍</span>
              <input placeholder="Buscar por descrição ou categoria..." value={busca} onChange={e=>setBusca(e.target.value)} style={{flex:1}}/>
              {busca && <button className="btn-icon" onClick={()=>setBusca("")} style={{padding:"2px 6px"}}>✕</button>}
            </div>

            {/* Filters */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {[["todos","Todos"],["canal","📹 Canal"],["pessoal","👤 Pessoal"]].map(([v,l])=>(
                <button key={v} className={`pill ${filtroSeg===v?"active":""}`} onClick={()=>setFiltroSeg(v)}>{l}</button>
              ))}
              <div style={{width:1,height:20,background:"#E8E3DB",margin:"0 4px"}}/>
              {[["todos","Todos"],["receita","Receitas"],["despesa","Despesas"]].map(([v,l])=>(
                <button key={v} className={`pill ${filtroTipo===v?"active":""}`} onClick={()=>setFiltroTipo(v)}>{l}</button>
              ))}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filtered.length===0 && <div className="card" style={{textAlign:"center",color:"#A09080",padding:40}}>Nenhum lançamento encontrado.</div>}
              {[...filtered].sort((a,b)=>b.data.localeCompare(a.data)).map(t=>{
                const conta=contas.find(c=>c.id===t.contaId);
                return (
                  <div key={t.id} className="card" style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                    <div style={{width:38,height:38,borderRadius:10,background:t.tipo==="receita"?"#3D9E7A15":"#C0616A15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{t.tipo==="receita"?"📥":"📤"}</div>
                    <div style={{flex:1,minWidth:130}}>
                      <div style={{fontWeight:500,marginBottom:2}}>{t.descricao}</div>
                      <div style={{fontSize:12,color:"#A09080",display:"flex",gap:6,flexWrap:"wrap"}}>
                        <span>{t.data}</span><span>·</span><span>{conta?.nome||"—"}</span><span>·</span><span>{t.categoria}</span>
                        {t.nota&&<><span>·</span><span style={{fontStyle:"italic"}}>📝 {t.nota}</span></>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span className={`tag tag-${t.segmento}`}>{t.segmento}</span>
                      <span className={`tag tag-${t.tipo}`}>{t.tipo}</span>
                      <div className="stat-num" style={{fontSize:17,color:t.tipo==="receita"?CORES.receita:CORES.despesa,minWidth:105,textAlign:"right"}}>{t.tipo==="receita"?"+":"-"}{fmt(t.valor)}</div>
                      <button className="btn-icon" onClick={()=>openModal("tx",t)}>✏️</button>
                      <button className="btn-danger" onClick={()=>setTransactions(p=>p.filter(x=>x.id!==t.id))}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ CONTAS ══════════ */}
        {page==="contas" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>Contas</div>
                <div style={{color:"#A09080",fontSize:13,marginTop:2}}>{contas.length} contas</div>
              </div>
              <button className="btn btn-primary" onClick={()=>openModal("conta")}>+ Nova Conta</button>
            </div>
            <div className="row">
              {saldoPorConta.map(c=>(
                <div key={c.id} className="conta-card col" style={{minWidth:190,borderTop:`4px solid ${c.cor}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div><div style={{fontWeight:600,fontSize:15}}>{c.nome}</div><Badge type={c.tipo}/></div>
                    <div style={{display:"flex",gap:2}}>
                      <button className="btn-icon" onClick={()=>openModal("conta",c)}>✏️</button>
                      <button className="btn-icon" style={{color:"#C0616A"}} onClick={()=>setContas(p=>p.filter(x=>x.id!==c.id))}>🗑️</button>
                    </div>
                  </div>
                  <Label>Saldo Atual</Label>
                  <div className="stat-num" style={{fontSize:24,color:c.saldo>=0?CORES.receita:CORES.despesa}}>{fmt(c.saldo)}</div>
                  {c.tipo==="credito"&&c.limite>0&&(
                    <div style={{marginTop:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#A09080",marginBottom:4}}>
                        <span>Limite</span><span>{fmt(Math.abs(Math.min(0,c.saldo)))} / {fmt(c.limite)}</span>
                      </div>
                      <div className="bar-bg"><div className="bar" style={{width:`${Math.min(100,Math.round(Math.abs(Math.min(0,c.saldo))/c.limite*100))}%`,background:c.cor}}/></div>
                    </div>
                  )}
                  <div style={{marginTop:8,display:"flex",gap:12,fontSize:12}}>
                    <span style={{color:CORES.receita}}>+{fmt(txFiltradas.filter(t=>t.contaId===c.id&&t.tipo==="receita").reduce((s,t)=>s+t.valor,0))}</span>
                    <span style={{color:CORES.despesa}}>-{fmt(txFiltradas.filter(t=>t.contaId===c.id&&t.tipo==="despesa").reduce((s,t)=>s+t.valor,0))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ METAS ══════════ */}
        {page==="metas" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>Metas Financeiras</div>
                <div style={{color:"#A09080",fontSize:13,marginTop:2}}>Acompanhe seus objetivos</div>
              </div>
              <button className="btn btn-primary" onClick={()=>openModal("meta")}>+ Nova Meta</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {metas.map(m=>{
                const pct = Math.min(100, Math.round((m.acumulado/m.valor)*100));
                const faltam = m.valor - m.acumulado;
                const hoje = new Date(); const prazo = new Date(m.prazo);
                const diasRestantes = Math.max(0, Math.ceil((prazo-hoje)/(1000*60*60*24)));
                const concluida = pct >= 100;
                return (
                  <div key={m.id} className="card" style={{borderLeft:`4px solid ${concluida?"#3D9E7A":m.cor}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:28}}>{m.icone}</span>
                        <div>
                          <div style={{fontWeight:600,fontSize:16}}>{m.nome}</div>
                          <div style={{fontSize:12,color:"#A09080",marginTop:2}}>
                            Prazo: {new Date(m.prazo).toLocaleDateString("pt-BR")} · {concluida?"✅ Concluída":diasRestantes===0?"⚠️ Vence hoje":`${diasRestantes} dias restantes`}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {/* Adicionar valor */}
                        <button className="btn-ghost" onClick={()=>{
                          const v=prompt("Quanto adicionar à meta? (R$)");
                          if(v&&!isNaN(parseFloat(v))) setMetas(p=>p.map(x=>x.id===m.id?{...x,acumulado:Math.min(x.valor,x.acumulado+parseFloat(v))}:x));
                        }}>+ Aportar</button>
                        <button className="btn-icon" onClick={()=>openModal("meta",m)}>✏️</button>
                        <button className="btn-icon" style={{color:"#C0616A"}} onClick={()=>setMetas(p=>p.filter(x=>x.id!==m.id))}>🗑️</button>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8}}>
                      <div>
                        <span className="stat-num" style={{fontSize:22,color:concluida?"#3D9E7A":m.cor}}>{fmt(m.acumulado)}</span>
                        <span style={{fontSize:14,color:"#A09080"}}> de {fmt(m.valor)}</span>
                      </div>
                      <span className="stat-num" style={{fontSize:22,color:concluida?"#3D9E7A":m.cor}}>{pct}%</span>
                    </div>
                    <div className="bar-bg" style={{height:10}}>
                      <div className="bar" style={{width:`${pct}%`,height:10,background:concluida?"#3D9E7A":m.cor}}/>
                    </div>
                    {!concluida && <div style={{fontSize:12,color:"#A09080",marginTop:6}}>Faltam {fmt(faltam)} para a meta</div>}
                  </div>
                );
              })}
              {metas.length===0 && <div className="card" style={{textAlign:"center",color:"#A09080",padding:40}}>Nenhuma meta cadastrada ainda.</div>}
            </div>
          </div>
        )}

        {/* ══════════ CANAL ══════════ */}
        {page==="canal" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>Crescimento do Canal</div>
                <div style={{color:"#A09080",fontSize:13,marginTop:2}}>YouTube + TikTok</div>
              </div>
              <button className="btn btn-primary" onClick={()=>openModal("canal")}>+ Mês</button>
            </div>
            {canalData.length>0&&(()=>{
              const ul=canalData[canalData.length-1]; const ant=canalData[canalData.length-2];
              return (
                <div className="row">
                  {[{label:"INSCRITOS",value:fmtN(ul.inscritos),color:"#5B8FCC",sub:ant?`${ul.inscritos-ant.inscritos>=0?"+":""}${fmtN(ul.inscritos-ant.inscritos)} vs anterior`:null},
                    {label:"VIEWS",value:fmtN(ul.views),color:CORES.canal,sub:ant?`${ul.views-ant.views>=0?"+":""}${fmtN(ul.views-ant.views)} vs anterior`:null},
                    {label:"RPM",value:`R$ ${ul.rpm.toFixed(2)}`,color:CORES.pessoal,sub:"por mil views"},
                    {label:"RECEITA",value:fmt(ul.receita),color:CORES.receita,sub:ul.mes},
                  ].map(c=>(
                    <div key={c.label} className="card col" style={{minWidth:130,borderTop:`3px solid ${c.color}`}}>
                      <Label>{c.label}</Label>
                      <div className="stat-num" style={{fontSize:22,color:c.color}}>{c.value}</div>
                      {c.sub&&<div style={{fontSize:12,color:"#A09080",marginTop:3}}>{c.sub}</div>}
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="card">
              <Label>Evolução de Inscritos</Label>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={canalData}>
                  <XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis hide/><Tooltip formatter={v=>fmtN(v)} contentStyle={tooltipStyle}/>
                  <Line type="monotone" dataKey="inscritos" stroke="#5B8FCC" strokeWidth={2.5} dot={{r:4,fill:"#5B8FCC"}} name="Inscritos"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="row">
              <div className="card col"><Label>Views Mensais</Label>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={canalData}><XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/>
                    <Tooltip formatter={v=>fmtN(v)} contentStyle={tooltipStyle}/>
                    <Bar dataKey="views" fill={CORES.canal} radius={[5,5,0,0]} name="Views"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card col"><Label>Receita Mensal</Label>
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={canalData}><XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/>
                    <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
                    <Line type="monotone" dataKey="receita" stroke={CORES.receita} strokeWidth={2.5} dot={{r:4,fill:CORES.receita}} name="Receita"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ RECORRENTES ══════════ */}
        {page==="recorrentes" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>Recorrentes</div>
                <div style={{color:"#A09080",fontSize:13,marginTop:2}}>Despesas e receitas fixas mensais</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-secondary" onClick={aplicarRecorrentes}>🔄 Aplicar este mês</button>
                <button className="btn btn-primary" onClick={()=>openModal("recorrente")}>+ Novo</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {recorrentes.map(r=>{
                const conta=contas.find(c=>c.id===r.contaId);
                return (
                  <div key={r.id} className="card" style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",opacity:r.ativo?1:0.5}}>
                    <div style={{width:38,height:38,borderRadius:10,background:r.tipo==="receita"?"#3D9E7A15":"#C0616A15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{r.tipo==="receita"?"📥":"📤"}</div>
                    <div style={{flex:1,minWidth:130}}>
                      <div style={{fontWeight:500}}>{r.descricao}</div>
                      <div style={{fontSize:12,color:"#A09080"}}>Todo dia {r.diaVencimento} · {conta?.nome||"—"} · {r.categoria}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span className={`tag tag-${r.segmento}`}>{r.segmento}</span>
                      <div className="stat-num" style={{fontSize:17,color:r.tipo==="receita"?CORES.receita:CORES.despesa}}>{r.tipo==="receita"?"+":"-"}{fmt(r.valor)}</div>
                      <button className="btn-icon" onClick={()=>setRecorrentes(p=>p.map(x=>x.id===r.id?{...x,ativo:!x.ativo}:x))}>{r.ativo?"⏸":"▶️"}</button>
                      <button className="btn-icon" onClick={()=>openModal("recorrente",r)}>✏️</button>
                      <button className="btn-danger" onClick={()=>setRecorrentes(p=>p.filter(x=>x.id!==r.id))}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ ORÇAMENTOS ══════════ */}
        {page==="orcamentos" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>Orçamentos</div>
                <div style={{color:"#A09080",fontSize:13,marginTop:2}}>Limite de gastos por categoria</div>
              </div>
              <button className="btn btn-primary" onClick={()=>openModal("orcamento")}>+ Novo Limite</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {alertasOrc.map(a=>(
                <div key={a.categoria} className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{fontWeight:500,fontSize:15}}>{a.categoria}</div>
                      <div style={{fontSize:12,color:"#A09080",marginTop:2}}>
                        {fmt(a.gasto)} de {fmt(a.limite)}
                        {a.pct>=100&&<span style={{color:CORES.despesa,fontWeight:600,marginLeft:8}}>⚠️ Limite atingido!</span>}
                        {a.pct>=90&&a.pct<100&&<span style={{color:"#C0616A",fontWeight:600,marginLeft:8}}>🔴 Acima de 90%</span>}
                        {a.pct>=70&&a.pct<90&&<span style={{color:CORES.canal,fontWeight:600,marginLeft:8}}>🟡 Atenção</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span className="stat-num" style={{fontSize:22,color:a.pct>=100?CORES.despesa:a.pct>=70?CORES.canal:CORES.receita}}>{a.pct}%</span>
                      <button className="btn-icon" onClick={()=>openModal("orcamento",a)}>✏️</button>
                      <button className="btn-danger" onClick={()=>setOrcamentos(p=>p.filter(x=>x.categoria!==a.categoria))}>✕</button>
                    </div>
                  </div>
                  <div className="bar-bg"><div className="bar" style={{width:`${a.pct}%`,background:a.pct>=100?CORES.despesa:a.pct>=70?CORES.canal:CORES.receita}}/></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ RELATÓRIOS ══════════ */}
        {page==="relatorios" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>Relatórios</div>
                <div style={{color:"#A09080",fontSize:13,marginTop:2}}>{periodoLabel}</div>
              </div>
              <button className="btn btn-primary" onClick={exportPDF}>📄 Exportar PDF</button>
            </div>

            {/* Comparativo mensal */}
            <div className="card">
              <Label>📊 Comparativo Mensal — Receitas, Despesas e Saldo</Label>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={comparativoMensal}>
                  <XAxis dataKey="label" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis hide/><Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
                  <Legend formatter={v=><span style={{color:"#5A5040",fontSize:12}}>{v}</span>}/>
                  <Bar dataKey="receitas" fill={CORES.receita} radius={[4,4,0,0]} name="Receitas" opacity={0.85}/>
                  <Bar dataKey="despesas" fill={CORES.despesa} radius={[4,4,0,0]} name="Despesas" opacity={0.85}/>
                  <Line type="monotone" dataKey="saldo" stroke="#5B8FCC" strokeWidth={2} dot={{r:3,fill:"#5B8FCC"}} name="Saldo"/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="row">
              {["canal","pessoal"].map(seg=>{
                const rec=txFiltradas.filter(t=>t.segmento===seg&&t.tipo==="receita").reduce((s,t)=>s+t.valor,0);
                const desp=txFiltradas.filter(t=>t.segmento===seg&&t.tipo==="despesa").reduce((s,t)=>s+t.valor,0);
                return (
                  <div key={seg} className="card col" style={{borderTop:`3px solid ${seg==="canal"?CORES.canal:CORES.pessoal}`}}>
                    <Label>{seg==="canal"?"📹 Canais":"👤 Pessoal"}</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {[["Receitas",rec,CORES.receita],["Despesas",desp,CORES.despesa]].map(([l,v,c])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:14}}>
                          <span style={{color:"#A09080"}}>{l}</span><span style={{color:c,fontWeight:600}}>{fmt(v)}</span>
                        </div>
                      ))}
                      <div style={{height:1,background:"#E8E3DB"}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:14,color:"#A09080"}}>Resultado</span>
                        <span className="stat-num" style={{fontSize:20,color:rec-desp>=0?CORES.receita:CORES.despesa}}>{fmt(rec-desp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card">
              <Label>Despesas por Categoria</Label>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {catData.map((c,i)=>{
                  const pct=totalDespesas>0?Math.round((c.value/totalDespesas)*100):0;
                  return (
                    <div key={c.name}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}>
                        <span style={{color:"#5A5040"}}>{c.name}</span>
                        <span style={{color:CORES.categorias[i%CORES.categorias.length],fontWeight:600}}>{fmt(c.value)} <span style={{color:"#A09080",fontWeight:400}}>({pct}%)</span></span>
                      </div>
                      <div className="bar-bg"><div className="bar" style={{width:`${pct}%`,background:CORES.categorias[i%CORES.categorias.length],opacity:.8}}/></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <Label>Extrato</Label>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{borderBottom:"1px solid #E8E3DB"}}>
                    {["Data","Descrição","Categoria","Conta","Seg.","Tipo","Valor"].map(h=>(
                      <th key={h} style={{padding:"8px 12px",color:"#A09080",fontWeight:500,textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...txFiltradas].sort((a,b)=>b.data.localeCompare(a.data)).map(t=>{
                      const conta=contas.find(c=>c.id===t.contaId);
                      return (
                        <tr key={t.id} style={{borderBottom:"1px solid #F0EDE7"}}>
                          <td style={{padding:"9px 12px",color:"#A09080"}}>{t.data}</td>
                          <td style={{padding:"9px 12px"}}>{t.descricao}</td>
                          <td style={{padding:"9px 12px",color:"#A09080"}}>{t.categoria}</td>
                          <td style={{padding:"9px 12px",color:"#A09080"}}>{conta?.nome||"—"}</td>
                          <td style={{padding:"9px 12px"}}><span className={`tag tag-${t.segmento}`}>{t.segmento}</span></td>
                          <td style={{padding:"9px 12px"}}><span className={`tag tag-${t.tipo}`}>{t.tipo}</span></td>
                          <td style={{padding:"9px 12px"}}><span className="stat-num" style={{fontSize:15,color:t.tipo==="receita"?CORES.receita:CORES.despesa}}>{t.tipo==="receita"?"+":"-"}{fmt(t.valor)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}
      {modal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal()}}>
          <div className="modal">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:600}}>
                {{tx:editItem?"Editar Lançamento":"Novo Lançamento",conta:editItem?"Editar Conta":"Nova Conta",recorrente:editItem?"Editar Recorrente":"Novo Recorrente",orcamento:editItem?"Editar Orçamento":"Novo Orçamento",canal:editItem?"Editar Mês":"Dados do Canal",meta:editItem?"Editar Meta":"Nova Meta"}[modal]}
              </div>
              <button onClick={closeModal} style={{background:"none",border:"none",color:"#A09080",cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
            </div>

            {/* ── TX ── */}
            {modal==="tx" && (
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <div style={{display:"flex",gap:8}}>
                  {[["receita","📥 Receita"],["despesa","📤 Despesa"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setFormTx({...formTx,tipo:v})} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${formTx.tipo===v?(v==="receita"?CORES.receita:CORES.despesa):"#DDD8CF"}`,background:formTx.tipo===v?(v==="receita"?"#3D9E7A12":"#C0616A12"):"transparent",color:formTx.tipo===v?(v==="receita"?CORES.receita:CORES.despesa):"#A09080",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:500,transition:"all .15s"}}>{l}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  {[["pessoal","👤 Pessoal"],["canal","📹 Canal"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setFormTx({...formTx,segmento:v,categoria:""})} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${formTx.segmento===v?(v==="canal"?CORES.canal:CORES.pessoal):"#DDD8CF"}`,background:formTx.segmento===v?(v==="canal"?"#D4894A12":"#8B6BB512"):"transparent",color:formTx.segmento===v?(v==="canal"?CORES.canal:CORES.pessoal):"#A09080",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:500,transition:"all .15s"}}>{l}</button>
                  ))}
                </div>
                <input placeholder="Descrição" value={formTx.descricao} onChange={e=>setFormTx({...formTx,descricao:e.target.value})}/>
                <input type="number" placeholder="Valor (R$)" value={formTx.valor} onChange={e=>setFormTx({...formTx,valor:e.target.value})} min="0" step="0.01"/>

                {/* Categoria + criar nova */}
                <div>
                  <select value={formTx.categoria} onChange={e=>{ if(e.target.value==="__new__"){setShowNewCat(true);}else{setFormTx({...formTx,categoria:e.target.value});setShowNewCat(false);}}}>
                    <option value="">Selecione a categoria</option>
                    {cats.map(c=><option key={c} value={c}>{c}</option>)}
                    <option value="__new__">➕ Criar nova categoria…</option>
                  </select>
                  {showNewCat && (
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <input placeholder="Nome da nova categoria" value={newCatInput} onChange={e=>setNewCatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustomCat(formTx.segmento)} style={{flex:1}}/>
                      <button className="btn btn-primary" onClick={()=>addCustomCat(formTx.segmento)} style={{whiteSpace:"nowrap",padding:"10px 14px"}}>Criar</button>
                    </div>
                  )}
                </div>

                <select value={formTx.contaId} onChange={e=>setFormTx({...formTx,contaId:e.target.value})}>
                  {contas.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <input type="date" value={formTx.data} onChange={e=>setFormTx({...formTx,data:e.target.value})}/>
                <textarea placeholder="Nota (opcional)" value={formTx.nota} onChange={e=>setFormTx({...formTx,nota:e.target.value})}/>
                <button className="btn btn-primary" onClick={saveTx} style={{marginTop:2,padding:"13px",fontSize:15}}>Salvar</button>
              </div>
            )}

            {/* ── CONTA ── */}
            {modal==="conta" && (
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <input placeholder="Nome (ex: Nubank, Bradesco)" value={formConta.nome} onChange={e=>setFormConta({...formConta,nome:e.target.value})}/>
                <select value={formConta.tipo} onChange={e=>setFormConta({...formConta,tipo:e.target.value})}>
                  <option value="corrente">Conta Corrente</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="investimento">Investimentos</option>
                </select>
                {formConta.tipo!=="credito"&&<input type="number" placeholder="Saldo inicial (R$)" value={formConta.saldoInicial} onChange={e=>setFormConta({...formConta,saldoInicial:e.target.value})} min="0" step="0.01"/>}
                {formConta.tipo==="credito"&&<input type="number" placeholder="Limite do cartão (R$)" value={formConta.limite} onChange={e=>setFormConta({...formConta,limite:e.target.value})} min="0" step="0.01"/>}
                <div>
                  <div style={{fontSize:13,color:"#A09080",marginBottom:8}}>Cor</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {["#3D9E7A","#5B8FCC","#8B6BB5","#C0616A","#D4894A","#6A9EB5","#7EB87E","#B5896A"].map(cor=>(
                      <div key={cor} onClick={()=>setFormConta({...formConta,cor})} style={{width:28,height:28,borderRadius:"50%",background:cor,cursor:"pointer",border:formConta.cor===cor?"3px solid #2D2D2D":"3px solid transparent",transition:"border .15s"}}/>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={saveConta} style={{marginTop:2,padding:"13px",fontSize:15}}>Salvar</button>
              </div>
            )}

            {/* ── RECORRENTE ── */}
            {modal==="recorrente" && (
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <div style={{display:"flex",gap:8}}>
                  {[["despesa","📤 Despesa"],["receita","📥 Receita"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setFormRec({...formRec,tipo:v})} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${formRec.tipo===v?(v==="receita"?CORES.receita:CORES.despesa):"#DDD8CF"}`,background:formRec.tipo===v?(v==="receita"?"#3D9E7A12":"#C0616A12"):"transparent",color:formRec.tipo===v?(v==="receita"?CORES.receita:CORES.despesa):"#A09080",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:500}}>{l}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  {[["pessoal","👤 Pessoal"],["canal","📹 Canal"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setFormRec({...formRec,segmento:v,categoria:""})} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${formRec.segmento===v?(v==="canal"?CORES.canal:CORES.pessoal):"#DDD8CF"}`,background:formRec.segmento===v?(v==="canal"?"#D4894A12":"#8B6BB512"):"transparent",color:formRec.segmento===v?(v==="canal"?CORES.canal:CORES.pessoal):"#A09080",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:500}}>{l}</button>
                  ))}
                </div>
                <input placeholder="Descrição" value={formRec.descricao} onChange={e=>setFormRec({...formRec,descricao:e.target.value})}/>
                <input type="number" placeholder="Valor (R$)" value={formRec.valor} onChange={e=>setFormRec({...formRec,valor:e.target.value})} min="0" step="0.01"/>
                <select value={formRec.categoria} onChange={e=>setFormRec({...formRec,categoria:e.target.value})}>
                  <option value="">Selecione a categoria</option>
                  {catsRec.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={formRec.contaId} onChange={e=>setFormRec({...formRec,contaId:e.target.value})}>
                  {contas.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <input type="number" placeholder="Dia do vencimento (1–31)" value={formRec.diaVencimento} onChange={e=>setFormRec({...formRec,diaVencimento:e.target.value})} min="1" max="31"/>
                <button className="btn btn-primary" onClick={saveRec} style={{marginTop:2,padding:"13px",fontSize:15}}>Salvar</button>
              </div>
            )}

            {/* ── ORÇAMENTO ── */}
            {modal==="orcamento" && (
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <select value={formOrc.categoria} onChange={e=>setFormOrc({...formOrc,categoria:e.target.value})} disabled={!!editItem}>
                  <option value="">Selecione a categoria</option>
                  {[...allCats.canal,...allCats.pessoal].filter((v,i,a)=>a.indexOf(v)===i).map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" placeholder="Limite mensal (R$)" value={formOrc.limite} onChange={e=>setFormOrc({...formOrc,limite:e.target.value})} min="0" step="0.01"/>
                <button className="btn btn-primary" onClick={saveOrc} style={{marginTop:2,padding:"13px",fontSize:15}}>Salvar</button>
              </div>
            )}

            {/* ── CANAL ── */}
            {modal==="canal" && (
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <input placeholder="Mês/Ano (ex: Mar/26)" value={formCanal.mes} onChange={e=>setFormCanal({...formCanal,mes:e.target.value})} disabled={!!editItem}/>
                <input type="number" placeholder="Inscritos totais" value={formCanal.inscritos} onChange={e=>setFormCanal({...formCanal,inscritos:e.target.value})} min="0"/>
                <input type="number" placeholder="Views do mês" value={formCanal.views} onChange={e=>setFormCanal({...formCanal,views:e.target.value})} min="0"/>
                <input type="number" placeholder="RPM (R$ por mil views)" value={formCanal.rpm} onChange={e=>setFormCanal({...formCanal,rpm:e.target.value})} min="0" step="0.01"/>
                <input type="number" placeholder="Receita total do mês (R$)" value={formCanal.receita} onChange={e=>setFormCanal({...formCanal,receita:e.target.value})} min="0" step="0.01"/>
                <button className="btn btn-primary" onClick={saveCanal} style={{marginTop:2,padding:"13px",fontSize:15}}>Salvar</button>
              </div>
            )}

            {/* ── META ── */}
            {modal==="meta" && (
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <input placeholder="Nome da meta (ex: Câmera Sony)" value={formMeta.nome} onChange={e=>setFormMeta({...formMeta,nome:e.target.value})}/>
                <input placeholder="Ícone (emoji)" value={formMeta.icone} onChange={e=>setFormMeta({...formMeta,icone:e.target.value})} style={{fontSize:20}}/>
                <input type="number" placeholder="Valor total da meta (R$)" value={formMeta.valor} onChange={e=>setFormMeta({...formMeta,valor:e.target.value})} min="0" step="0.01"/>
                <input type="number" placeholder="Já acumulado (R$)" value={formMeta.acumulado} onChange={e=>setFormMeta({...formMeta,acumulado:e.target.value})} min="0" step="0.01"/>
                <div>
                  <div style={{fontSize:13,color:"#A09080",marginBottom:6}}>Prazo</div>
                  <input type="date" value={formMeta.prazo} onChange={e=>setFormMeta({...formMeta,prazo:e.target.value})}/>
                </div>
                <div>
                  <div style={{fontSize:13,color:"#A09080",marginBottom:8}}>Cor</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {["#3D9E7A","#5B8FCC","#8B6BB5","#C0616A","#D4894A","#6A9EB5","#7EB87E","#B5896A"].map(cor=>(
                      <div key={cor} onClick={()=>setFormMeta({...formMeta,cor})} style={{width:28,height:28,borderRadius:"50%",background:cor,cursor:"pointer",border:formMeta.cor===cor?"3px solid #2D2D2D":"3px solid transparent",transition:"border .15s"}}/>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={saveMeta} style={{marginTop:2,padding:"13px",fontSize:15}}>Salvar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
