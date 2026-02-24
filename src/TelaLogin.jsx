import { useState } from "react";

const SENHA_CORRETA = "finflow2026"; // 🔑 Troque para sua senha preferida

export default function TelaLogin({ onLogin }) {
  const [senha, setSenha]     = useState("");
  const [erro, setErro]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrar, setMostrar] = useState(false);

  const tentar = () => {
    setLoading(true);
    setTimeout(() => {
      if (senha === SENHA_CORRETA) {
        localStorage.setItem("ff_auth", "1");
        onLogin();
      } else {
        setErro(true);
        setSenha("");
        setLoading(false);
      }
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") tentar();
    if (erro) setErro(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F7F5F1 0%, #EDE9E2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-card {
          background: #FFFFFF;
          border: 1px solid #E8E3DB;
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px #00000012;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }
        .login-input {
          width: 100%;
          background: #FAF9F6;
          border: 1px solid #DDD8CF;
          border-radius: 12px;
          padding: 14px 48px 14px 16px;
          font-family: inherit;
          font-size: 16px;
          color: #2D2D2D;
          outline: none;
          transition: all .2s;
          letter-spacing: 2px;
        }
        .login-input:focus {
          border-color: #3D9E7A;
          background: #FFF;
          box-shadow: 0 0 0 3px #3D9E7A12;
        }
        .login-input.erro {
          border-color: #C0616A;
          background: #FFF8F8;
          box-shadow: 0 0 0 3px #C0616A12;
          animation: shake .3s ease;
        }
        .btn-login {
          width: 100%;
          background: #3D9E7A;
          color: #FFF;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-family: inherit;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
          letter-spacing: 0.5px;
        }
        .btn-login:hover:not(:disabled) {
          background: #348A6A;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px #3D9E7A35;
        }
        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #A09080;
          font-size: 18px;
          padding: 4px;
          line-height: 1;
        }
        .eye-btn:hover { color: #5A5040; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-6px); }
          75%      { transform: translateX(6px); }
        }
        @keyframes fadeIn {
          from { opacity:0; transform: translateY(16px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .login-card { animation: fadeIn .4s ease; }
      `}</style>

      <div className="login-card">
        {/* Logo */}
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, #3D9E7A, #5B8FCC)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, marginBottom: 20,
          boxShadow: "0 8px 24px #3D9E7A30",
        }}>₿</div>

        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>
          FinFlow
        </div>
        <div style={{ fontSize: 14, color: "#A09080", marginBottom: 36, textAlign: "center" }}>
          Controle Financeiro · Canais + Pessoal
        </div>

        {/* Campo de senha */}
        <div style={{ position: "relative", width: "100%", marginBottom: 12 }}>
          <input
            className={`login-input ${erro ? "erro" : ""}`}
            type={mostrar ? "text" : "password"}
            placeholder="Digite sua senha"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErro(false); }}
            onKeyDown={handleKey}
            autoFocus
          />
          <button className="eye-btn" onClick={() => setMostrar(m => !m)} tabIndex={-1}>
            {mostrar ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Erro */}
        <div style={{
          height: 20, marginBottom: 16,
          fontSize: 13, color: "#C0616A", fontWeight: 500,
          opacity: erro ? 1 : 0, transition: "opacity .2s",
        }}>
          ❌ Senha incorreta. Tente novamente.
        </div>

        {/* Botão */}
        <button className="btn-login" onClick={tentar} disabled={loading || !senha}>
          {loading ? "Verificando..." : "Entrar →"}
        </button>

        <div style={{ fontSize: 12, color: "#C0B8A8", marginTop: 24, textAlign: "center" }}>
          🔒 Acesso privado · FinFlow
        </div>
      </div>
    </div>
  );
}
