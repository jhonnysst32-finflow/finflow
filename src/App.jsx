import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import TelaLogin from "./TelaLogin.jsx";
import TelaAdmin from "./TelaAdmin.jsx";
import ControleFinanceiro from "./ControleFinanceiro.jsx";
import PaginaCanal from "./PaginaCanal.jsx";
import PopupNotificacoes from "./PopupNotificacoes.jsx";

const ADMIN_EMAIL = "jhonny.sst32@gmail.com";

export default function App() {
  const [sessao,  setSessao]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [modulo,  setModulo]  = useState("financeiro");
  const [modoAdmin, setModoAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSessao(null);
    setModoAdmin(false);
  };

  const isAdmin = sessao?.user?.email === ADMIN_EMAIL;

  // ── Carregando ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#F7F5F1", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center", color:"#A09080" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>₿</div>
          <div>Carregando FinFlow...</div>
        </div>
      </div>
    );
  }

  // ── Não logado ──────────────────────────────────────────────────────────────
  if (!sessao) return <TelaLogin onLogin={()=>{}} />;

  // ── Admin em modo admin ─────────────────────────────────────────────────────
  if (isAdmin && modoAdmin) {
    return <TelaAdmin adminEmail={sessao.user.email} onSair={()=>setModoAdmin(false)} />;
  }

  // ── App normal ──────────────────────────────────────────────────────────────
  return (
    <div>
      <PopupNotificacoes userId={sessao.user.id} />

      {/* Barra flutuante */}
      <div style={{
        position:"fixed", bottom:24, right:24, zIndex:200,
        display:"flex", gap:8, alignItems:"center",
        background:"#FFF", border:"1px solid #E8E3DB",
        borderRadius:16, padding:"6px 8px",
        boxShadow:"0 4px 24px #00000014",
      }}>
        <button onClick={()=>setModulo("financeiro")} style={{
          border:"none", borderRadius:10, padding:"8px 14px",
          fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500,
          cursor:"pointer", transition:"all .15s",
          background: modulo==="financeiro" ? "#3D9E7A" : "transparent",
          color:       modulo==="financeiro" ? "#FFF"    : "#9A9080",
        }}>💰 Financeiro</button>

        <button onClick={()=>setModulo("canal")} style={{
          border:"none", borderRadius:10, padding:"8px 14px",
          fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500,
          cursor:"pointer", transition:"all .15s",
          background: modulo==="canal" ? "#FF4B4B" : "transparent",
          color:       modulo==="canal" ? "#FFF"    : "#9A9080",
        }}>📹 Canais</button>

        <div style={{ width:1, height:20, background:"#E8E3DB" }}/>

        {/* Botão admin — só visível para o admin */}
        {isAdmin && (
          <button onClick={()=>setModoAdmin(true)} title="Painel Admin" style={{
            border:"none", borderRadius:10, padding:"8px 10px",
            fontFamily:"'DM Sans',sans-serif", fontSize:13,
            cursor:"pointer", background:"transparent", color:"#8B6BB5",
          }}>🛡️</button>
        )}

        <span style={{ fontSize:11, color:"#C0B8A8", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {sessao.user.email}
        </span>

        <button onClick={logout} title="Sair" style={{
          border:"none", borderRadius:10, padding:"8px 10px",
          fontFamily:"'DM Sans',sans-serif", fontSize:13,
          cursor:"pointer", background:"transparent", color:"#C0B8A8",
        }}>🔒</button>
      </div>

      {modulo==="financeiro" && <ControleFinanceiro userId={sessao.user.id} />}
      {modulo==="canal"      && <PaginaCanal       userId={sessao.user.id} />}
    </div>
  );
}
