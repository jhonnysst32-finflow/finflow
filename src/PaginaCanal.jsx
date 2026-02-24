import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (v) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v) => v >= 1_000_000 ? (v/1_000_000).toFixed(1)+"M" : v >= 1000 ? (v/1000).toFixed(1)+"k" : String(v??0);
const tooltipStyle = { background:"#FFF", border:"1px solid #E8E3DB", borderRadius:8, color:"#2D2D2D", boxShadow:"0 4px 16px #00000010" };

// ── localStorage ─────────────────────────────────────────────────────────────
function usePersist(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem("ff_canal_" + key); return s ? JSON.parse(s) : def; } catch { return def; }
  });
  useEffect(() => { try { localStorage.setItem("ff_canal_" + key, JSON.stringify(val)); } catch {} }, [val, key]);
  return [val, setVal];
}

// ── Default data ──────────────────────────────────────────────────────────────
const CANAL_CORES = {
  youtube: "#FF4B4B",
  tiktok:  "#2D9CDB",
  instagram: "#C77DFF",
  default: "#D4894A",
};

const DEFAULT_CANAIS = [
  { id:"yt",  nome:"YouTube",  plataforma:"youtube",  cor:"#FF4B4B", icone:"▶️" },
  { id:"tt",  nome:"TikTok",   plataforma:"tiktok",   cor:"#2D9CDB", icone:"🎵" },
];

const DEFAULT_HISTORICO = {
  yt: [
    { mes:"Set/25", seguidores:3800, views:22000, videos:8,  rpm:7.2, receita:420 },
    { mes:"Out/25", seguidores:4600, views:29000, videos:9,  rpm:7.5, receita:580 },
    { mes:"Nov/25", seguidores:5800, views:36000, videos:10, rpm:7.8, receita:750 },
    { mes:"Dez/25", seguidores:7200, views:46000, videos:11, rpm:8.1, receita:980 },
    { mes:"Jan/26", seguidores:8500, views:55000, videos:10, rpm:8.3, receita:1100 },
    { mes:"Fev/26", seguidores:9800, views:64000, videos:12, rpm:8.5, receita:1380 },
  ],
  tt: [
    { mes:"Set/25", seguidores:6200, views:180000, videos:18, rpm:1.2, receita:100 },
    { mes:"Out/25", seguidores:8100, views:240000, videos:22, rpm:1.3, receita:145 },
    { mes:"Nov/25", seguidores:11000, views:310000, videos:20, rpm:1.4, receita:210 },
    { mes:"Dez/25", seguidores:15000, views:420000, videos:25, rpm:1.5, receita:320 },
    { mes:"Jan/26", seguidores:19000, views:530000, videos:22, rpm:1.6, receita:520 },
    { mes:"Fev/26", seguidores:25000, views:680000, videos:28, rpm:1.7, receita:620 },
  ],
};

// ── Small UI ──────────────────────────────────────────────────────────────────
const Label = ({ children, style }) => (
  <div style={{ fontSize:11, color:"#A09080", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, fontWeight:500, ...style }}>{children}</div>
);

const KpiCard = ({ label, value, sub, color, minW=140 }) => (
  <div style={{ flex:1, minWidth:minW, padding:"14px 16px", background:"#FAF9F6", borderRadius:12, borderLeft:`3px solid ${color}` }}>
    <Label style={{marginBottom:4}}>{label}</Label>
    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color, fontWeight:600 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:"#A09080", marginTop:3 }}>{sub}</div>}
  </div>
);

const Slider = ({ label, min, max, step=1, value, onChange, fmt: fmtFn }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
      <span style={{ color:"#5A5040", fontWeight:500 }}>{label}</span>
      <span style={{ color:"#3D9E7A", fontWeight:600 }}>{fmtFn ? fmtFn(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
      style={{ width:"100%", accentColor:"#3D9E7A", cursor:"pointer" }}/>
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#C0B8A8", marginTop:2 }}>
      <span>{fmtFn ? fmtFn(min) : min}</span><span>{fmtFn ? fmtFn(max) : max}</span>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function PaginaCanal() {
  const [canais,    setCanais]    = usePersist("canais",    DEFAULT_CANAIS);
  const [historico, setHistorico] = usePersist("historico", DEFAULT_HISTORICO);

  const [abaCanal,  setAbaCanal]  = useState(canais[0]?.id || "yt");
  const [abaView,   setAbaView]   = useState("metricas"); // metricas | simulador | projecao
  const [modal,     setModal]     = useState(null); // "canal" | "mes"
  const [editItem,  setEditItem]  = useState(null);

  // Simulator state (per canal stored locally)
  const [simViews,  setSimViews]  = useState(500000);
  const [simRpm,    setSimRpm]    = useState(5);
  const [simPosts,  setSimPosts]  = useState(20);
  const [simPatroc, setSimPatroc] = useState(0);
  const [simAfil,   setSimAfil]   = useState(0);
  const [simMeses,  setSimMeses]  = useState(3);

  // Forms
  const emptyCanal = { nome:"", plataforma:"youtube", cor:"#FF4B4B", icone:"▶️" };
  const emptyMes   = { mes:"", seguidores:"", views:"", videos:"", rpm:"", receita:"" };
  const [formCanal, setFormCanal] = useState(emptyCanal);
  const [formMes,   setFormMes]   = useState(emptyMes);

  const canal = canais.find(c => c.id === abaCanal);
  const hist  = historico[abaCanal] || [];
  const ultimo = hist[hist.length - 1];
  const anterior = hist[hist.length - 2];

  // ── Derived ────────────────────────────────────────────────────────────────
  const delta = (field) => {
    if (!ultimo || !anterior) return null;
    const d = (ultimo[field] || 0) - (anterior[field] || 0);
    return d;
  };

  const totalReceita = hist.reduce((s, m) => s + (m.receita || 0), 0);
  const mediaViews   = hist.length ? Math.round(hist.reduce((s, m) => s + (m.views || 0), 0) / hist.length) : 0;
  const mediaRpm     = hist.length ? (hist.reduce((s, m) => s + (m.rpm || 0), 0) / hist.length) : 0;

  // Comparativo entre canais para radar
  const radarData = useMemo(() => {
    const maxSeg  = Math.max(...canais.map(c => (historico[c.id]||[]).slice(-1)[0]?.seguidores || 1));
    const maxViews = Math.max(...canais.map(c => (historico[c.id]||[]).slice(-1)[0]?.views || 1));
    const maxRec  = Math.max(...canais.map(c => (historico[c.id]||[]).reduce((s,m)=>s+(m.receita||0),0) || 1));
    const maxVid  = Math.max(...canais.map(c => (historico[c.id]||[]).reduce((s,m)=>s+(m.videos||0),0) || 1));

    return [
      { metrica:"Seguidores", ...Object.fromEntries(canais.map(c => [c.nome, Math.round(((historico[c.id]||[]).slice(-1)[0]?.seguidores||0)/maxSeg*100)])) },
      { metrica:"Views",      ...Object.fromEntries(canais.map(c => [c.nome, Math.round(((historico[c.id]||[]).slice(-1)[0]?.views||0)/maxViews*100)])) },
      { metrica:"Receita",    ...Object.fromEntries(canais.map(c => [c.nome, Math.round(((historico[c.id]||[]).reduce((s,m)=>s+(m.receita||0),0))/maxRec*100)])) },
      { metrica:"Vídeos",     ...Object.fromEntries(canais.map(c => [c.nome, Math.round(((historico[c.id]||[]).reduce((s,m)=>s+(m.videos||0),0))/maxVid*100)])) },
      { metrica:"RPM",        ...Object.fromEntries(canais.map(c => [c.nome, Math.round(((historico[c.id]||[]).slice(-1)[0]?.rpm||0)/Math.max(...canais.map(cc=>(historico[cc.id]||[]).slice(-1)[0]?.rpm||1))*100)])) },
    ];
  }, [canais, historico]);

  // Simulador
  const simReceitaAds     = (simViews / 1000) * simRpm;
  const simReceitaMes     = simReceitaAds + simPatroc + simAfil;
  const simReceitaPeriodo = simReceitaMes * simMeses;
  const simCrescimento    = ultimo ? (simReceitaMes - ultimo.receita) : 0;

  // Projeção (regressão linear simples sobre receita)
  const projecao = useMemo(() => {
    if (hist.length < 2) return [];
    const n = hist.length;
    const xs = hist.map((_, i) => i);
    const ys = hist.map(m => m.receita || 0);
    const meanX = xs.reduce((a,b)=>a+b,0)/n;
    const meanY = ys.reduce((a,b)=>a+b,0)/n;
    const slope = xs.reduce((s,x,i)=>s+(x-meanX)*(ys[i]-meanY),0) / xs.reduce((s,x)=>s+(x-meanX)**2,0);
    const intercept = meanY - slope * meanX;

    const resultado = hist.map((m, i) => ({ mes: m.mes, real: m.receita, projetado: null }));
    for (let i = 1; i <= 3; i++) {
      const proj = Math.max(0, Math.round(intercept + slope * (n - 1 + i)));
      const lastMes = hist[n-1].mes;
      const [mesStr, anoStr] = lastMes.split("/");
      const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      const idxMes = MESES.indexOf(mesStr);
      let novoIdx = (idxMes + i) % 12;
      let novoAno = parseInt("20" + anoStr) + Math.floor((idxMes + i) / 12);
      resultado.push({ mes: `${MESES[novoIdx]}/${String(novoAno).slice(2)}`, real: null, projetado: proj });
    }
    return resultado;
  }, [hist]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openModal = (type, item=null) => {
    setModal(type); setEditItem(item);
    if (type==="canal") setFormCanal(item ? {...item} : emptyCanal);
    if (type==="mes")   setFormMes(item ? {...item} : emptyMes);
  };
  const closeModal = () => { setModal(null); setEditItem(null); };

  const saveCanal = () => {
    if (!formCanal.nome) return;
    if (editItem) {
      setCanais(p => p.map(c => c.id===editItem.id ? {...formCanal, id:c.id} : c));
    } else {
      const id = "c" + Date.now();
      setCanais(p => [...p, {...formCanal, id}]);
      setHistorico(p => ({...p, [id]:[]}));
    }
    closeModal();
  };

  const saveMes = () => {
    if (!formMes.mes) return;
    const entry = { ...formMes, seguidores:parseInt(formMes.seguidores)||0, views:parseInt(formMes.views)||0, videos:parseInt(formMes.videos)||0, rpm:parseFloat(formMes.rpm)||0, receita:parseFloat(formMes.receita)||0 };
    setHistorico(p => {
      const atual = p[abaCanal] || [];
      if (editItem) return { ...p, [abaCanal]: atual.map(m => m.mes===editItem.mes ? entry : m) };
      return { ...p, [abaCanal]: [...atual, entry] };
    });
    closeModal();
  };

  const deleteMes = (mes) => setHistorico(p => ({ ...p, [abaCanal]: (p[abaCanal]||[]).filter(m=>m.mes!==mes) }));
  const deleteCanal = (id) => {
    setCanais(p => p.filter(c=>c.id!==id));
    setHistorico(p => { const n={...p}; delete n[id]; return n; });
    if (abaCanal === id) setAbaCanal(canais.find(c=>c.id!==id)?.id || "");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#F7F5F1", fontFamily:"'DM Sans',sans-serif", color:"#2D2D2D" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#F7F5F1}::-webkit-scrollbar-thumb{background:#D5CFC5;border-radius:4px}
        .card{background:#FFF;border:1px solid #E8E3DB;border-radius:16px;padding:20px;transition:border-color .2s,box-shadow .2s}
        .card:hover{border-color:#CFC8BC;box-shadow:0 4px 20px #00000009}
        .btn{cursor:pointer;border:none;border-radius:10px;padding:10px 20px;font-family:inherit;font-size:14px;font-weight:500;transition:all .15s}
        .btn-primary{background:#3D9E7A;color:#fff}.btn-primary:hover{background:#348A6A;transform:translateY(-1px);box-shadow:0 4px 14px #3D9E7A30}
        .btn-secondary{background:#F7F5F1;color:#5A5040;border:1px solid #E8E3DB;cursor:pointer;border-radius:10px;padding:10px 18px;font-family:inherit;font-size:14px;font-weight:500;transition:all .15s}.btn-secondary:hover{background:#EDE9E2}
        .btn-icon{background:none;border:none;cursor:pointer;padding:5px 8px;border-radius:6px;color:#A09080;font-size:14px;font-family:inherit;transition:all .15s}.btn-icon:hover{background:#EDE9E2;color:#5A5040}
        .btn-danger{background:transparent;color:#C0616A;border:1px solid #C0616A30;padding:5px 10px;font-size:12px;border-radius:6px;cursor:pointer;font-family:inherit}.btn-danger:hover{background:#C0616A0D}
        input,select,textarea{background:#FAF9F6;border:1px solid #DDD8CF;border-radius:10px;padding:10px 14px;color:#2D2D2D;font-family:inherit;font-size:14px;width:100%;outline:none;transition:border-color .15s}
        input:focus,select:focus{border-color:#3D9E7A;background:#fff;box-shadow:0 0 0 3px #3D9E7A12}
        input[type=range]{background:transparent;border:none;box-shadow:none;padding:0}
        input[type=range]:focus{box-shadow:none}
        .modal-overlay{position:fixed;inset:0;background:#00000035;backdrop-filter:blur(8px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
        .modal{background:#FFF;border:1px solid #E8E3DB;border-radius:20px;padding:28px;width:100%;max-width:480px;box-shadow:0 24px 64px #00000014}
        .row{display:flex;gap:16px;flex-wrap:wrap}.col{flex:1;min-width:180px}
        .tab-bar{display:flex;background:#FFF;border:1px solid #E8E3DB;border-radius:12px;padding:4px;gap:4px}
        .tab-btn{flex:1;padding:8px 14px;border:none;border-radius:9px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;transition:all .15s;background:transparent;color:#9A9080;white-space:nowrap}
        .tab-btn.active{background:#F7F5F1;color:#2D2D2D;box-shadow:0 1px 4px #00000012}
        .canal-tab{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;cursor:pointer;border:2px solid transparent;transition:all .15s;font-weight:500;font-size:14px;font-family:inherit;background:transparent}
        .canal-tab.active{background:#FFF;box-shadow:0 2px 10px #00000010}
        .sim-result{background:linear-gradient(135deg,#3D9E7A15,#5B8FCC15);border:1px solid #3D9E7A30;border-radius:14px;padding:20px}
        @media(max-width:600px){.col{min-width:100%}}
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom:"1px solid #E8E3DB", background:"#FFF", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 0" }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#FF4B4B,#2D9CDB)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📹</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600 }}>Painel de Canais</span>
          <span style={{ fontSize:11, color:"#A09080", background:"#F7F5F1", padding:"2px 10px", borderRadius:20, border:"1px solid #E8E3DB" }}>💾 Auto-salvo</span>
        </div>
        <button className="btn btn-primary" onClick={()=>openModal("canal")}>+ Novo Canal</button>
      </div>

      <div style={{ padding:"24px", maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

        {/* ── Comparativo geral entre canais ── */}
        <div className="card">
          <Label>📊 Comparativo Geral entre Canais</Label>
          <div className="row" style={{ alignItems:"stretch" }}>
            {/* Radar */}
            <div style={{ flex:1, minWidth:260 }}>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#EDE9E2"/>
                  <PolarAngleAxis dataKey="metrica" tick={{ fill:"#A09080", fontSize:11 }}/>
                  {canais.map(c => (
                    <Radar key={c.id} name={c.nome} dataKey={c.nome} stroke={c.cor} fill={c.cor} fillOpacity={0.15} strokeWidth={2}/>
                  ))}
                  <Legend formatter={v=><span style={{color:"#5A5040",fontSize:12}}>{v}</span>}/>
                  <Tooltip contentStyle={tooltipStyle} formatter={v=>`${v}%`}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Tabela resumo */}
            <div style={{ flex:1, minWidth:260, overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #E8E3DB" }}>
                    <th style={{ padding:"8px 10px", color:"#A09080", fontWeight:500, textAlign:"left" }}>Canal</th>
                    <th style={{ padding:"8px 10px", color:"#A09080", fontWeight:500, textAlign:"right" }}>Seguidores</th>
                    <th style={{ padding:"8px 10px", color:"#A09080", fontWeight:500, textAlign:"right" }}>Views/mês</th>
                    <th style={{ padding:"8px 10px", color:"#A09080", fontWeight:500, textAlign:"right" }}>Receita total</th>
                  </tr>
                </thead>
                <tbody>
                  {canais.map(c => {
                    const h = historico[c.id] || [];
                    const ul = h[h.length-1] || {};
                    const recTotal = h.reduce((s,m)=>s+(m.receita||0),0);
                    return (
                      <tr key={c.id} style={{ borderBottom:"1px solid #F0EDE7", cursor:"pointer", background: abaCanal===c.id?"#FAF9F6":"transparent" }} onClick={()=>setAbaCanal(c.id)}>
                        <td style={{ padding:"10px 10px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:10, height:10, borderRadius:"50%", background:c.cor }}/>
                            <span style={{ fontWeight:500 }}>{c.icone} {c.nome}</span>
                          </div>
                        </td>
                        <td style={{ padding:"10px 10px", textAlign:"right", color:"#5A5040" }}>{fmtN(ul.seguidores||0)}</td>
                        <td style={{ padding:"10px 10px", textAlign:"right", color:"#5A5040" }}>{fmtN(ul.views||0)}</td>
                        <td style={{ padding:"10px 10px", textAlign:"right" }}>
                          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, color:"#3D9E7A", fontWeight:600 }}>{fmt(recTotal)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Seletor de canal ── */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          {canais.map(c => (
            <button key={c.id} className={`canal-tab ${abaCanal===c.id?"active":""}`}
              style={{ borderColor: abaCanal===c.id ? c.cor : "transparent", color: abaCanal===c.id ? c.cor : "#9A9080" }}
              onClick={()=>setAbaCanal(c.id)}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:c.cor, display:"inline-block" }}/>
              {c.icone} {c.nome}
            </button>
          ))}
        </div>

        {canal && (
          <>
            {/* Canal header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:canal.cor+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{canal.icone}</div>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600, color:canal.cor }}>{canal.nome}</div>
                  <div style={{ fontSize:13, color:"#A09080" }}>{hist.length} meses de histórico</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-secondary" onClick={()=>openModal("canal", canal)}>✏️ Editar</button>
                <button className="btn-secondary" onClick={()=>openModal("mes")}>+ Adicionar Mês</button>
                {canais.length > 1 && <button className="btn-danger" onClick={()=>deleteCanal(canal.id)}>🗑️ Remover</button>}
              </div>
            </div>

            {/* KPIs do canal */}
            {ultimo && (
              <div className="row">
                <KpiCard label="Seguidores" value={fmtN(ultimo.seguidores)} color={canal.cor}
                  sub={anterior ? `${delta("seguidores")>=0?"+":""}${fmtN(delta("seguidores"))} vs mês anterior` : "Último mês"} />
                <KpiCard label="Views do mês" value={fmtN(ultimo.views)} color={canal.cor}
                  sub={anterior ? `${delta("views")>=0?"+":""}${fmtN(delta("views"))} vs anterior` : null} />
                <KpiCard label="RPM atual" value={`R$ ${(ultimo.rpm||0).toFixed(2)}`} color="#5B8FCC" sub="por mil visualizações" />
                <KpiCard label="Receita do mês" value={fmt(ultimo.receita)} color="#3D9E7A"
                  sub={anterior ? `${delta("receita")>=0?"↑":"↓"} ${fmt(Math.abs(delta("receita")))} vs anterior` : null} />
                <KpiCard label="Vídeos/Posts" value={String(ultimo.videos||0)} color="#D4894A"
                  sub={`Total: ${hist.reduce((s,m)=>s+(m.videos||0),0)} publicados`} />
                <KpiCard label="Receita Total" value={fmt(totalReceita)} color="#3D9E7A" sub={`média ${fmt(Math.round(totalReceita/(hist.length||1)))}/mês`} />
              </div>
            )}
            {!ultimo && (
              <div className="card" style={{ textAlign:"center", color:"#A09080", padding:40 }}>
                Nenhum dado ainda. Clique em <strong>"+ Adicionar Mês"</strong> para começar.
              </div>
            )}

            {/* Abas: Métricas / Projeção / Simulador */}
            <div className="tab-bar">
              {[["metricas","📈 Métricas"],["projecao","🔮 Projeção"],["simulador","🧮 Simulador"]].map(([k,l])=>(
                <button key={k} className={`tab-btn ${abaView===k?"active":""}`} onClick={()=>setAbaView(k)}>{l}</button>
              ))}
            </div>

            {/* ── MÉTRICAS ── */}
            {abaView==="metricas" && hist.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div className="row">
                  <div className="card col">
                    <Label>Evolução de Seguidores</Label>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={hist}>
                        <XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis hide/><Tooltip formatter={v=>fmtN(v)} contentStyle={tooltipStyle}/>
                        <Line type="monotone" dataKey="seguidores" stroke={canal.cor} strokeWidth={2.5} dot={{r:4,fill:canal.cor}} name="Seguidores"/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card col">
                    <Label>Receita Mensal</Label>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={hist}>
                        <XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis hide/><Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
                        <Bar dataKey="receita" fill={canal.cor} radius={[5,5,0,0]} name="Receita"/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="row">
                  <div className="card col">
                    <Label>Views Mensais</Label>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={hist}>
                        <XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis hide/><Tooltip formatter={v=>fmtN(v)} contentStyle={tooltipStyle}/>
                        <Bar dataKey="views" fill="#5B8FCC" radius={[5,5,0,0]} name="Views" opacity={0.8}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card col">
                    <Label>RPM ao longo do tempo</Label>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={hist}>
                        <XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis hide/><Tooltip formatter={v=>`R$ ${v}`} contentStyle={tooltipStyle}/>
                        <Line type="monotone" dataKey="rpm" stroke="#8B6BB5" strokeWidth={2.5} dot={{r:4,fill:"#8B6BB5"}} name="RPM"/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Tabela */}
                <div className="card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <Label style={{ marginBottom:0 }}>Histórico Detalhado</Label>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #E8E3DB" }}>
                          {["Mês","Seguidores","Views","Vídeos","RPM","Receita",""].map(h=>(
                            <th key={h} style={{ padding:"8px 12px", color:"#A09080", fontWeight:500, textAlign:"left" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hist.map((m, i) => {
                          const prev = hist[i-1];
                          const diffRec = prev ? m.receita - prev.receita : 0;
                          return (
                            <tr key={m.mes} style={{ borderBottom:"1px solid #F0EDE7" }}>
                              <td style={{ padding:"10px 12px", fontWeight:500 }}>{m.mes}</td>
                              <td style={{ padding:"10px 12px", color:canal.cor }}>{fmtN(m.seguidores)}</td>
                              <td style={{ padding:"10px 12px", color:"#5B8FCC" }}>{fmtN(m.views)}</td>
                              <td style={{ padding:"10px 12px", color:"#D4894A" }}>{m.videos}</td>
                              <td style={{ padding:"10px 12px", color:"#8B6BB5" }}>R$ {(m.rpm||0).toFixed(2)}</td>
                              <td style={{ padding:"10px 12px" }}>
                                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:"#3D9E7A" }}>{fmt(m.receita)}</span>
                                {prev && <span style={{ fontSize:11, color:diffRec>=0?"#3D9E7A":"#C0616A", marginLeft:6 }}>{diffRec>=0?"↑":"↓"}{fmt(Math.abs(diffRec))}</span>}
                              </td>
                              <td style={{ padding:"10px 12px" }}>
                                <div style={{ display:"flex", gap:4 }}>
                                  <button className="btn-icon" onClick={()=>openModal("mes",m)}>✏️</button>
                                  <button className="btn-icon" style={{color:"#C0616A"}} onClick={()=>deleteMes(m.mes)}>🗑️</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── PROJEÇÃO ── */}
            {abaView==="projecao" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div className="card" style={{ borderLeft:`3px solid ${canal.cor}`, background:canal.cor+"08" }}>
                  <Label>🔮 Projeção para os próximos 3 meses</Label>
                  <div style={{ fontSize:13, color:"#A09080", marginBottom:16 }}>
                    Baseada na tendência de crescimento dos últimos {hist.length} meses de histórico.
                  </div>
                  {projecao.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={projecao}>
                        <XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis hide/><Tooltip formatter={v=>v?fmt(v):"—"} contentStyle={tooltipStyle}/>
                        <Legend formatter={v=><span style={{color:"#5A5040",fontSize:12}}>{v}</span>}/>
                        <Line type="monotone" dataKey="real" stroke={canal.cor} strokeWidth={2.5} dot={{r:4,fill:canal.cor}} name="Receita real" connectNulls={false}/>
                        <Line type="monotone" dataKey="projetado" stroke="#A09080" strokeWidth={2} strokeDasharray="6 3" dot={{r:4,fill:"#A09080"}} name="Projeção" connectNulls={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ color:"#A09080", textAlign:"center", padding:30 }}>Adicione pelo menos 2 meses de histórico para gerar projeção.</div>
                  )}
                </div>

                {projecao.filter(p=>p.projetado!==null).length > 0 && (
                  <div className="row">
                    {projecao.filter(p=>p.projetado!==null).map((p,i)=>(
                      <div key={p.mes} className="card col" style={{ minWidth:140, borderTop:`3px solid ${canal.cor}`, opacity:1-i*0.1 }}>
                        <Label>{p.mes}</Label>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:canal.cor }}>{fmt(p.projetado)}</div>
                        <div style={{ fontSize:12, color:"#A09080", marginTop:3 }}>Projeção {i===0?"próximo mês":i===1?"em 2 meses":"em 3 meses"}</div>
                      </div>
                    ))}
                    <div className="card col" style={{ minWidth:140, borderTop:"3px solid #3D9E7A" }}>
                      <Label>Total projetado</Label>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:"#3D9E7A" }}>
                        {fmt(projecao.filter(p=>p.projetado!==null).reduce((s,p)=>s+(p.projetado||0),0))}
                      </div>
                      <div style={{ fontSize:12, color:"#A09080", marginTop:3 }}>próximos 3 meses</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SIMULADOR ── */}
            {abaView==="simulador" && (
              <div className="row" style={{ alignItems:"flex-start" }}>
                {/* Sliders */}
                <div className="card col" style={{ minWidth:280 }}>
                  <Label>🧮 Ajuste os parâmetros</Label>
                  <Slider label="Views por mês" min={1000} max={2000000} step={5000} value={simViews} onChange={setSimViews} fmt={fmtN}/>
                  <Slider label="RPM (R$ por mil views)" min={0.5} max={30} step={0.5} value={simRpm} onChange={setSimRpm} fmt={v=>`R$ ${v.toFixed(2)}`}/>
                  <Slider label="Vídeos/Posts no mês" min={1} max={60} value={simPosts} onChange={setSimPosts}/>
                  <Slider label="Patrocínio (R$)" min={0} max={10000} step={100} value={simPatroc} onChange={setSimPatroc} fmt={v=>fmt(v)}/>
                  <Slider label="Afiliados (R$)" min={0} max={5000} step={50} value={simAfil} onChange={setSimAfil} fmt={v=>fmt(v)}/>
                  <Slider label="Projetar por quantos meses?" min={1} max={12} value={simMeses} onChange={setSimMeses} fmt={v=>`${v} ${v===1?"mês":"meses"}`}/>
                </div>

                {/* Resultado */}
                <div className="col" style={{ minWidth:260, display:"flex", flexDirection:"column", gap:14 }}>
                  <div className="sim-result">
                    <Label>Resultado estimado por mês</Label>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {[
                        ["Receita AdSense", simReceitaAds, "#5B8FCC"],
                        ["Patrocínios", simPatroc, "#D4894A"],
                        ["Afiliados", simAfil, "#8B6BB5"],
                      ].map(([l,v,c])=>(
                        <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:14 }}>
                          <span style={{ color:"#5A5040" }}>{l}</span>
                          <span style={{ color:c, fontWeight:600 }}>{fmt(v)}</span>
                        </div>
                      ))}
                      <div style={{ height:1, background:"#3D9E7A30", margin:"4px 0" }}/>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontWeight:600 }}>Total mensal</span>
                        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"#3D9E7A" }}>{fmt(simReceitaMes)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ borderTop:`3px solid ${canal.cor}` }}>
                    <Label>Projeção de {simMeses} {simMeses===1?"mês":"meses"}</Label>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:canal.cor }}>{fmt(simReceitaPeriodo)}</div>
                    {ultimo && (
                      <div style={{ fontSize:13, color: simCrescimento>=0?"#3D9E7A":"#C0616A", marginTop:6 }}>
                        {simCrescimento>=0?"↑":"↓"} {fmt(Math.abs(simCrescimento))} vs receita atual do mês
                      </div>
                    )}
                  </div>

                  {/* Gráfico de evolução simulada */}
                  <div className="card">
                    <Label>Evolução simulada mês a mês</Label>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={Array.from({length:simMeses},(_,i)=>({ mes:`M${i+1}`, receita:simReceitaMes }))}>
                        <XAxis dataKey="mes" tick={{fill:"#A09080",fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis hide/><Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
                        <Bar dataKey="receita" fill={canal.cor} radius={[5,5,0,0]} name="Receita estimada"/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Insight */}
                  <div style={{ background:"#F7F5F1", border:"1px dashed #DDD8CF", borderRadius:12, padding:14, fontSize:13, color:"#5A5040", lineHeight:1.6 }}>
                    💡 <strong>Com {fmtN(simViews)} views/mês e RPM de R$ {simRpm.toFixed(2)}</strong>, sua receita de AdSense seria {fmt(simReceitaAds)}.
                    {simPatroc>0&&<> Somando {fmt(simPatroc)} de patrocínios</>}{simAfil>0&&<> e {fmt(simAfil)} de afiliados</>}, o total mensal chegaria a <strong style={{color:"#3D9E7A"}}>{fmt(simReceitaMes)}</strong>.
                    {mediaRpm>0&&<> Seu RPM médio histórico é R$ {mediaRpm.toFixed(2)}, {simRpm>mediaRpm?"acima":"abaixo"} do simulado.</>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {canais.length === 0 && (
          <div className="card" style={{ textAlign:"center", color:"#A09080", padding:60 }}>
            Nenhum canal cadastrado. Clique em <strong>"+ Novo Canal"</strong> para começar.
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {modal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal()}}>
          <div className="modal">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600 }}>
                {{ canal: editItem?"Editar Canal":"Novo Canal", mes: editItem?"Editar Mês":"Adicionar Mês" }[modal]}
              </div>
              <button onClick={closeModal} style={{ background:"none", border:"none", color:"#A09080", cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
            </div>

            {modal==="canal" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <input placeholder="Nome do canal (ex: Canal do João)" value={formCanal.nome} onChange={e=>setFormCanal({...formCanal,nome:e.target.value})}/>
                <input placeholder="Ícone (emoji)" value={formCanal.icone} onChange={e=>setFormCanal({...formCanal,icone:e.target.value})} style={{fontSize:20}}/>
                <select value={formCanal.plataforma} onChange={e=>setFormCanal({...formCanal,plataforma:e.target.value,cor:CANAL_CORES[e.target.value]||CANAL_CORES.default})}>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="outro">Outro</option>
                </select>
                <div>
                  <div style={{ fontSize:13, color:"#A09080", marginBottom:8 }}>Cor</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {["#FF4B4B","#2D9CDB","#C77DFF","#3D9E7A","#D4894A","#5B8FCC","#FF6B9D","#F5A623"].map(cor=>(
                      <div key={cor} onClick={()=>setFormCanal({...formCanal,cor})} style={{ width:28, height:28, borderRadius:"50%", background:cor, cursor:"pointer", border:formCanal.cor===cor?"3px solid #2D2D2D":"3px solid transparent", transition:"border .15s" }}/>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={saveCanal} style={{ padding:"13px", fontSize:15 }}>Salvar</button>
              </div>
            )}

            {modal==="mes" && (
              <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                <input placeholder="Mês/Ano (ex: Mar/26)" value={formMes.mes} onChange={e=>setFormMes({...formMes,mes:e.target.value})} disabled={!!editItem}/>
                <input type="number" placeholder="Seguidores totais" value={formMes.seguidores} onChange={e=>setFormMes({...formMes,seguidores:e.target.value})} min="0"/>
                <input type="number" placeholder="Views do mês" value={formMes.views} onChange={e=>setFormMes({...formMes,views:e.target.value})} min="0"/>
                <input type="number" placeholder="Vídeos/posts publicados" value={formMes.videos} onChange={e=>setFormMes({...formMes,videos:e.target.value})} min="0"/>
                <input type="number" placeholder="RPM (R$ por mil views)" value={formMes.rpm} onChange={e=>setFormMes({...formMes,rpm:e.target.value})} min="0" step="0.01"/>
                <input type="number" placeholder="Receita total do mês (R$)" value={formMes.receita} onChange={e=>setFormMes({...formMes,receita:e.target.value})} min="0" step="0.01"/>
                <button className="btn btn-primary" onClick={saveMes} style={{ padding:"13px", fontSize:15 }}>Salvar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
