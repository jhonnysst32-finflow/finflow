import { useState } from "react";
import TelaLogin from "./TelaLogin.jsx";
import ControleFinanceiro from "./ControleFinanceiro.jsx";
import PaginaCanal from "./PaginaCanal.jsx";

export default function App() {
  const [logado, setLogado] = useState(() => {
    try { return localStorage.getItem("ff_auth") === "1"; } catch { return false; }
  });

  const [modulo, setModulo] = useState("financeiro");

  const logout = () => {
    localStorage.removeItem("ff_auth");
    setLogado(false);
  };

  if (!logado) {
    return <TelaLogin onLogin={() => setLogado(true)} />;
  }

  return (
    <div>
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 200,
        display: "flex", gap: 8, alignItems: "center",
        background: "#FFF", border: "1px solid #E8E3DB",
        borderRadius: 16, padding: "6px 8px",
        boxShadow: "0 4px 24px #00000014",
      }}>
        <button onClick={() => setModulo("financeiro")} style={{
          border: "none", borderRadius: 10, padding: "8px 14px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          cursor: "pointer", transition: "all .15s",
          background: modulo === "financeiro" ? "#3D9E7A" : "transparent",
          color: modulo === "financeiro" ? "#FFF" : "#9A9080",
        }}>💰 Financeiro</button>
        <button onClick={() => setModulo("canal")} style={{
          border: "none", borderRadius: 10, padding: "8px 14px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          cursor: "pointer", transition: "all .15s",
          background: modulo === "canal" ? "#FF4B4B" : "transparent",
          color: modulo === "canal" ? "#FFF" : "#9A9080",
        }}>📹 Canais</button>
        <div style={{ width: 1, height: 20, background: "#E8E3DB" }} />
        <button onClick={logout} title="Sair" style={{
          border: "none", borderRadius: 10, padding: "8px 10px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          cursor: "pointer", background: "transparent", color: "#C0B8A8",
        }}>🔒</button>
      </div>

      {modulo === "financeiro" && <ControleFinanceiro />}
      {modulo === "canal"      && <PaginaCanal />}
    </div>
  );
}
