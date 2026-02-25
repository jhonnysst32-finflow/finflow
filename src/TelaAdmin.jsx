import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const fmt = (v) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ADMIN_EMAIL = "jhonny.sst32@gmail.com";

// ── Helpers ───────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div style={{ fontSize:11, color:"#A09080", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, fontWeight:600 }}>{children}</div>
);

const KpiCard = ({ label, value, color="#3D9E7A", sub }) => (
  <div style={{ background:"#FFF", border:"1px solid #E8E3DB", borderRadius:14, padding:"16px 20px", borderTop:`3px solid ${color}`, flex:1, minWidth:140 }}>
    <Label>{label}</Label>
    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color, fontWeight:600 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:"#A09080", marginTop:3 }}>{sub}</div>}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function TelaAdmin({ adminEmail, onSair }) {
  const [aba,         setAba]         = useState("visao"); // visao | usuarios | dados
  const [usuarios,    setUsuarios]    = useState([]);
  const [userSelecionado, setUserSelecionado] = useState(null);
  const [dadosUser,   setDadosUser]   = useState({});
  const [loading,     setLoading]     = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [busca,       setBusca]       = useState("");
  const [stats,       setStats]       = useState({ totalUsers:0, totalTx:0, totalReceitas:0, totalDespesas:0, totalMetas:0 });

  // ── Carregar lista de usuários via admin API ──────────────────────────────
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar todos os dados das tabelas (RLS desabilitado para admin via service role não disponível no client)
      // Usamos a abordagem de buscar agregados públicos via tabelas
      const [
        { data: transacoes },
        { data: metas },
        { data: contas },
        { data: orcamentos },
      ] = await Promise.all([
        supabase.from("transacoes").select("user_id, tipo, valor, data"),
        supabase.from("metas").select("user_id, valor, acumulado"),
        supabase.from("contas").select("user_id, nome, tipo"),
        supabase.from("orcamentos").select("user_id, categoria, limite"),
      ]);

      // Agrupar por user_id para montar lista de usuários
      const userMap = {};
      const processar = (lista, tabela) => {
        (lista || []).forEach(item => {
          if (!userMap[item.user_id]) userMap[item.user_id] = { id: item.user_id, transacoes:[], metas:[], contas:[], orcamentos:[] };
          userMap[item.user_id][tabela].push(item);
        });
      };
      processar(transacoes,  "transacoes");
      processar(metas,       "metas");
      processar(contas,      "contas");
      processar(orcamentos,  "orcamentos");

      const lista = Object.values(userMap).map(u => ({
        ...u,
        totalReceitas: u.transacoes.filter(t=>t.tipo==="receita").reduce((s,t)=>s+Number(t.valor),0),
        totalDespesas: u.transacoes.filter(t=>t.tipo==="despesa").reduce((s,t)=>s+Number(t.valor),0),
        ultimaAtividade: u.transacoes.sort((a,b)=>b.data?.localeCompare(a.data))[0]?.data || "—",
      }));

      setUsuarios(lista);
      setStats({
        totalUsers:    lista.length,
        totalTx:       (transacoes||[]).length,
        totalReceitas: (transacoes||[]).filter(t=>t.tipo==="receita").reduce((s,t)=>s+Number(t.valor),0),
        totalDespesas: (transacoes||[]).filter(t=>t.tipo==="despesa").reduce((s,t)=>s+Number(t.valor),0),
        totalMetas:    (metas||[]).length,
      });
    } catch (e) {
      console.error("Erro ao carregar dados admin:", e);
    }
    setLoading(false);
  };

  // ── Carregar dados detalhados de um usuário ───────────────────────────────
  const verUsuario = async (user) => {
    setUserSelecionado(user);
    setLoadingUser(true);
    setAba("dados");

    const [
      { data: transacoes },
      { data: metas },
      { data: contas },
      { data: orcamentos },
      { data: recorrentes },
      { data: canal },
    ] = await Promise.all([
      supabase.from("transacoes").select("*").eq("user_id", user.id).order("data", { ascending:false }),
      supabase.from("metas").select("*").eq("user_id", user.id),
      supabase.from("contas").select("*").eq("user_id", user.id),
      supabase.from("orcamentos").select("*").eq("user_id", user.id),
      supabase.from("recorrentes").select("*").eq("user_id", user.id),
      supabase.from("canal_historico").select("*").eq("user_id", user.id).order("mes"),
    ]);

    setDadosUser({ transacoes, metas, contas, orcamentos, recorrentes, canal });
    setLoadingUser(false);
  };

  const usuariosFiltrados = usuarios.filter(u =>
    !busca || u.id.toLowerCase().includes(busca.toLowerCase())
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#0F0F13", fontFamily:"'DM Sans',sans-serif", color:"#E8E3DB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#1A1A22}::-webkit-scrollbar-thumb{background:#3A3A48;border-radius:4px}
        .acard{background:#1A1A22;border:1px solid #2A2A36;border-radius:14px;padding:20px;transition:border-color .2s}
        .acard:hover{border-color:#3A3A50}
        .abtn{cursor:pointer;border:none;border-radius:8px;padding:8px 16px;font-family:inherit;font-size:13px;font-weight:500;transition:all .15s}
        .abtn-primary{background:#3D9E7A;color:#fff}.abtn-primary:hover{background:#348A6A}
        .abtn-ghost{background:transparent;border:1px solid #2A2A36;color:#A09080;cursor:pointer;border-radius:8px;padding:7px 14px;font-family:inherit;font-size:13px;transition:all .15s}.abtn-ghost:hover{background:#2A2A36;color:#E8E3DB}
        .anav{background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;padding:8px 14px;border-radius:8px;transition:all .15s;color:#6A6A80;white-space:nowrap}
        .anav.active{color:#3D9E7A;background:#3D9E7A15}
        .anav:hover:not(.active){color:#E8E3DB;background:#2A2A36}
        .user-row{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;background:#1A1A22;border:1px solid #2A2A36;cursor:pointer;transition:all .15s;flex-wrap:wrap}
        .user-row:hover{border-color:#3D9E7A50;background:#1E2828}
        .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
        .tx-row{padding:10px 14px;border-bottom:1px solid #1E1E28;font-size:13px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .tx-row:last-child{border-bottom:none}
        input{background:#1A1A22;border:1px solid #2A2A36;border-radius:8px;padding:9px 14px;color:#E8E3DB;font-family:inherit;font-size:13px;width:100%;outline:none;transition:border-color .15s}
        input:focus{border-color:#3D9E7A}
        .stat-n{font-family:'Playfair Display',serif}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #2A2A36", background:"#0F0F13", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#C0616A,#8B6BB5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🛡️</div>
          <div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600 }}>FinFlow Admin</span>
            <span style={{ fontSize:11, color:"#6A6A80", marginLeft:10, background:"#2A2A36", padding:"2px 10px", borderRadius:20 }}>Painel Administrativo</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:12, color:"#6A6A80" }}>{adminEmail}</span>
          <button className="abtn-ghost" onClick={onSair}>← Voltar ao FinFlow</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:"#0F0F13", borderBottom:"1px solid #2A2A36", padding:"8px 24px", display:"flex", gap:4 }}>
        {[["visao","📊 Visão Geral"],["usuarios","👥 Usuários"],["dados","📋 Dados do Usuário"]].map(([k,l])=>(
          <button key={k} className={`anav ${aba===k?"active":""}`} onClick={()=>setAba(k)}>{l}</button>
        ))}
        <button className="abtn-ghost" style={{ marginLeft:"auto", fontSize:12 }} onClick={carregarDados}>🔄 Atualizar</button>
      </div>

      <div style={{ padding:"24px", maxWidth:1100, margin:"0 auto" }}>
        {loading && (
          <div style={{ textAlign:"center", color:"#6A6A80", padding:60 }}>Carregando dados...</div>
        )}

        {/* ══ VISÃO GERAL ══ */}
        {!loading && aba === "visao" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:600 }}>Visão Geral da Plataforma</div>

            {/* KPIs */}
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              <KpiCard label="Usuários" value={stats.totalUsers} color="#8B6BB5" sub="contas ativas"/>
              <KpiCard label="Transações" value={stats.totalTx} color="#5B8FCC" sub="total registradas"/>
              <KpiCard label="Receitas (total)" value={fmt(stats.totalReceitas)} color="#3D9E7A" sub="todos os usuários"/>
              <KpiCard label="Despesas (total)" value={fmt(stats.totalDespesas)} color="#C0616A" sub="todos os usuários"/>
              <KpiCard label="Metas" value={stats.totalMetas} color="#D4894A" sub="cadastradas"/>
            </div>

            {/* Resumo por usuário */}
            <div className="acard">
              <Label>Resumo por usuário</Label>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:10 }}>
                {usuarios.map((u, i) => (
                  <div key={u.id} className="user-row" onClick={()=>verUsuario(u)}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`hsl(${(i*67)%360},40%,30%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:600, flexShrink:0 }}>
                      {i+1}
                    </div>
                    <div style={{ flex:1, minWidth:120 }}>
                      <div style={{ fontSize:12, color:"#6A6A80", fontFamily:"monospace" }}>{u.id.slice(0,20)}...</div>
                      <div style={{ fontSize:11, color:"#4A4A5A", marginTop:2 }}>Última atividade: {u.ultimaAtividade}</div>
                    </div>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:13, color:"#3D9E7A" }}>+{fmt(u.totalReceitas)}</span>
                      <span style={{ fontSize:13, color:"#C0616A" }}>-{fmt(u.totalDespesas)}</span>
                      <span className="badge" style={{ background:"#2A2A36", color:"#A09080" }}>{u.transacoes.length} tx</span>
                      <span className="badge" style={{ background:"#2A2A36", color:"#A09080" }}>{u.contas.length} contas</span>
                      <span className="badge" style={{ background:"#2A2A36", color:"#A09080" }}>{u.metas.length} metas</span>
                    </div>
                    <span style={{ fontSize:12, color:"#3D9E7A" }}>Ver detalhes →</span>
                  </div>
                ))}
                {usuarios.length === 0 && (
                  <div style={{ textAlign:"center", color:"#6A6A80", padding:30 }}>Nenhum usuário com dados ainda.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ LISTA DE USUÁRIOS ══ */}
        {!loading && aba === "usuarios" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:600 }}>Usuários ({usuarios.length})</div>
            </div>
            <input placeholder="Buscar por ID..." value={busca} onChange={e=>setBusca(e.target.value)}/>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {usuariosFiltrados.map((u, i) => (
                <div key={u.id} className="acard" style={{ cursor:"pointer" }} onClick={()=>verUsuario(u)}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                    {/* Avatar */}
                    <div style={{ width:44, height:44, borderRadius:12, background:`hsl(${(i*67)%360},40%,25%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>👤</div>
                    <div style={{ flex:1, minWidth:150 }}>
                      <div style={{ fontWeight:500, fontSize:14, marginBottom:2 }}>Usuário #{i+1}</div>
                      <div style={{ fontSize:11, color:"#4A4A5A", fontFamily:"monospace" }}>{u.id}</div>
                    </div>
                    {/* Stats */}
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                      {[
                        [u.transacoes.length + " tx",    "#5B8FCC"],
                        [u.contas.length + " contas",    "#8B6BB5"],
                        [u.metas.length + " metas",      "#D4894A"],
                        [u.orcamentos.length + " orç.",  "#6A9EB5"],
                      ].map(([l,c])=>(
                        <span key={l} className="badge" style={{ background:c+"18", color:c }}>{l}</span>
                      ))}
                    </div>
                    <div style={{ textAlign:"right", minWidth:100 }}>
                      <div style={{ fontSize:13, color:"#3D9E7A", fontWeight:600 }}>+{fmt(u.totalReceitas)}</div>
                      <div style={{ fontSize:13, color:"#C0616A" }}>-{fmt(u.totalDespesas)}</div>
                    </div>
                    <button className="abtn abtn-primary" style={{ fontSize:12, padding:"7px 14px" }}>Ver dados</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ DADOS DO USUÁRIO ══ */}
        {aba === "dados" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <button className="abtn-ghost" onClick={()=>setAba("usuarios")}>← Voltar</button>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600 }}>
                Dados do Usuário
              </div>
              {userSelecionado && (
                <span style={{ fontSize:11, color:"#4A4A5A", fontFamily:"monospace", background:"#1A1A22", padding:"4px 10px", borderRadius:8, border:"1px solid #2A2A36" }}>
                  {userSelecionado.id}
                </span>
              )}
            </div>

            {loadingUser && <div style={{ textAlign:"center", color:"#6A6A80", padding:40 }}>Carregando...</div>}

            {!loadingUser && userSelecionado && (
              <>
                {/* KPIs do usuário */}
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <KpiCard label="Receitas" value={fmt(userSelecionado.totalReceitas)} color="#3D9E7A"/>
                  <KpiCard label="Despesas" value={fmt(userSelecionado.totalDespesas)} color="#C0616A"/>
                  <KpiCard label="Saldo" value={fmt(userSelecionado.totalReceitas - userSelecionado.totalDespesas)} color={userSelecionado.totalReceitas >= userSelecionado.totalDespesas ? "#3D9E7A" : "#C0616A"}/>
                  <KpiCard label="Transações" value={dadosUser.transacoes?.length || 0} color="#5B8FCC"/>
                  <KpiCard label="Metas" value={dadosUser.metas?.length || 0} color="#D4894A"/>
                </div>

                {/* Contas */}
                {dadosUser.contas?.length > 0 && (
                  <div className="acard">
                    <Label>Contas ({dadosUser.contas.length})</Label>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:10 }}>
                      {dadosUser.contas.map(c=>(
                        <div key={c.id} style={{ background:"#0F0F13", border:"1px solid #2A2A36", borderRadius:10, padding:"10px 14px", borderLeft:`3px solid ${c.cor||"#5B8FCC"}`, minWidth:150 }}>
                          <div style={{ fontWeight:500, fontSize:14 }}>{c.nome}</div>
                          <div style={{ fontSize:11, color:"#6A6A80", marginTop:3 }}>{c.tipo}{c.limite>0?` · Limite: ${fmt(c.limite)}`:""}</div>
                          {c.tipo==="credito"&&(c.dia_vencimento||c.dia_fechamento)&&(
                            <div style={{ fontSize:11, color:"#4A4A5A", marginTop:3 }}>
                              {c.dia_fechamento&&`Fecha dia ${c.dia_fechamento}`}{c.dia_vencimento&&` · Vence dia ${c.dia_vencimento}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metas */}
                {dadosUser.metas?.length > 0 && (
                  <div className="acard">
                    <Label>Metas ({dadosUser.metas.length})</Label>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:10 }}>
                      {dadosUser.metas.map(m=>{
                        const pct = Math.min(100, Math.round((m.acumulado/m.valor)*100));
                        return (
                          <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                            <span style={{ fontSize:20 }}>{m.icone}</span>
                            <span style={{ fontSize:14, flex:1, minWidth:100 }}>{m.nome}</span>
                            <span style={{ fontSize:13, color:"#3D9E7A" }}>{fmt(m.acumulado)} / {fmt(m.valor)}</span>
                            <span className="badge" style={{ background:m.cor+"18", color:m.cor }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Últimas transações */}
                {dadosUser.transacoes?.length > 0 && (
                  <div className="acard">
                    <Label>Últimas transações ({dadosUser.transacoes.length} total)</Label>
                    <div style={{ marginTop:10, background:"#0F0F13", borderRadius:10, border:"1px solid #2A2A36", overflow:"hidden" }}>
                      {dadosUser.transacoes.slice(0, 30).map(t=>(
                        <div key={t.id} className="tx-row">
                          <span style={{ color:"#6A6A80", minWidth:85, fontSize:12 }}>{t.data}</span>
                          <span style={{ flex:1, minWidth:100 }}>{t.descricao}{t.total_parcelas>1&&<span style={{ fontSize:10, color:"#5B8FCC", marginLeft:6 }}>{t.parcela_atual}/{t.total_parcelas}</span>}</span>
                          <span style={{ color:"#6A6A80", fontSize:12 }}>{t.categoria}</span>
                          <span className="badge" style={{ background:t.segmento==="canal"?"#D4894A18":"#8B6BB518", color:t.segmento==="canal"?"#D4894A":"#8B6BB5" }}>{t.segmento}</span>
                          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, color:t.tipo==="receita"?"#3D9E7A":"#C0616A", minWidth:100, textAlign:"right" }}>
                            {t.tipo==="receita"?"+":"-"}{fmt(t.valor)}
                          </span>
                        </div>
                      ))}
                      {dadosUser.transacoes.length > 30 && (
                        <div style={{ padding:"10px 14px", fontSize:12, color:"#6A6A80", textAlign:"center" }}>
                          + {dadosUser.transacoes.length - 30} transações anteriores
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Canal */}
                {dadosUser.canal?.length > 0 && (
                  <div className="acard">
                    <Label>Histórico do Canal ({dadosUser.canal.length} meses)</Label>
                    <div style={{ overflowX:"auto", marginTop:10 }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                        <thead>
                          <tr style={{ borderBottom:"1px solid #2A2A36" }}>
                            {["Mês","Inscritos","Views","RPM","Receita"].map(h=>(
                              <th key={h} style={{ padding:"8px 12px", color:"#6A6A80", fontWeight:500, textAlign:"left" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dadosUser.canal.map(c=>(
                            <tr key={c.id} style={{ borderBottom:"1px solid #1A1A22" }}>
                              <td style={{ padding:"8px 12px", fontWeight:500 }}>{c.mes}</td>
                              <td style={{ padding:"8px 12px", color:"#5B8FCC" }}>{c.inscritos?.toLocaleString()}</td>
                              <td style={{ padding:"8px 12px", color:"#D4894A" }}>{c.views?.toLocaleString()}</td>
                              <td style={{ padding:"8px 12px", color:"#8B6BB5" }}>R$ {Number(c.rpm).toFixed(2)}</td>
                              <td style={{ padding:"8px 12px", color:"#3D9E7A", fontFamily:"'Playfair Display',serif" }}>{fmt(c.receita)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Orçamentos */}
                {dadosUser.orcamentos?.length > 0 && (
                  <div className="acard">
                    <Label>Orçamentos ({dadosUser.orcamentos.length})</Label>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:10 }}>
                      {dadosUser.orcamentos.map(o=>(
                        <div key={o.id} style={{ background:"#0F0F13", border:"1px solid #2A2A36", borderRadius:10, padding:"10px 14px", minWidth:150 }}>
                          <div style={{ fontWeight:500, fontSize:14 }}>{o.categoria}</div>
                          <div style={{ fontSize:13, color:"#3D9E7A", marginTop:4 }}>Limite: {fmt(o.limite)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recorrentes */}
                {dadosUser.recorrentes?.length > 0 && (
                  <div className="acard">
                    <Label>Recorrentes ({dadosUser.recorrentes.length})</Label>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:10 }}>
                      {dadosUser.recorrentes.map(r=>(
                        <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", padding:"8px 0", borderBottom:"1px solid #1A1A22" }}>
                          <span style={{ fontSize:16 }}>{r.tipo==="receita"?"📥":"📤"}</span>
                          <span style={{ flex:1, fontSize:14 }}>{r.descricao}</span>
                          <span style={{ fontSize:12, color:"#6A6A80" }}>Dia {r.dia_vencimento}</span>
                          <span className="badge" style={{ background:r.ativo?"#3D9E7A18":"#2A2A36", color:r.ativo?"#3D9E7A":"#6A6A80" }}>{r.ativo?"Ativo":"Inativo"}</span>
                          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, color:r.tipo==="receita"?"#3D9E7A":"#C0616A" }}>
                            {r.tipo==="receita"?"+":"-"}{fmt(r.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
