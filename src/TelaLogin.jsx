import { useState } from "react";
import { supabase } from "./supabase.js";

export default function TelaLogin({ onLogin }) {
  const [modo,    setModo]    = useState("login"); // "login" | "cadastro" | "reset"
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [senha2,  setSenha2]  = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState("");
  const [sucesso, setSucesso] = useState("");

  const limpar = () => { setErro(""); setSucesso(""); };

  const handleLogin = async () => {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setLoading(true); limpar();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro(error.message.includes("Invalid") ? "E-mail ou senha incorretos." : error.message);
      setLoading(false);
    } else {
      onLogin();
    }
  };

  const handleCadastro = async () => {
    if (!email || !senha || !senha2) { setErro("Preencha todos os campos."); return; }
    if (senha !== senha2)            { setErro("As senhas não coincidem."); return; }
    if (senha.length < 6)            { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true); limpar();
    const { error } = await supabase.auth.signUp({ email, password: senha });
    if (error) {
      setErro(error.message.includes("already") ? "Este e-mail já está cadastrado." : error.message);
    } else {
      setSucesso("Conta criada! Verifique seu e-mail para confirmar, depois faça login.");
      setModo("login"); setEmail(""); setSenha(""); setSenha2("");
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) { setErro("Digite seu e-mail para receber o link."); return; }
    setLoading(true); limpar();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setErro(error.message);
    else setSucesso("Link enviado! Verifique sua caixa de entrada.");
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key !== "Enter") return;
    if (modo === "login")    handleLogin();
    if (modo === "cadastro") handleCadastro();
    if (modo === "reset")    handleReset();
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#F7F5F1 0%,#EDE9E2 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .lcard{background:#FFF;border:1px solid #E8E3DB;border-radius:24px;padding:44px 36px;width:100%;max-width:420px;box-shadow:0 20px 60px #00000012;animation:fadeIn .4s ease}
        .lfield{display:flex;flex-direction:column;gap:6px;width:100%}
        .lfield label{font-size:11px;color:#A09080;font-weight:600;letter-spacing:1px;text-transform:uppercase}
        .linput{background:#FAF9F6;border:1px solid #DDD8CF;border-radius:12px;padding:13px 16px;font-family:inherit;font-size:15px;color:#2D2D2D;outline:none;transition:all .2s;width:100%}
        .linput:focus{border-color:#3D9E7A;background:#FFF;box-shadow:0 0 0 3px #3D9E7A12}
        .linput.erro{border-color:#C0616A;background:#FFF8F8}
        .lbtn{width:100%;background:#3D9E7A;color:#FFF;border:none;border-radius:12px;padding:14px;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s}
        .lbtn:hover:not(:disabled){background:#348A6A;transform:translateY(-1px);box-shadow:0 6px 20px #3D9E7A35}
        .lbtn:disabled{opacity:.6;cursor:not-allowed}
        .llink{background:none;border:none;color:#3D9E7A;font-family:inherit;font-size:13px;cursor:pointer;text-decoration:underline;padding:0}
        .llink:hover{color:#2A7A5C}
        .lerro{background:#C0616A12;border:1px solid #C0616A30;color:#9A3E46;border-radius:10px;padding:10px 14px;font-size:13px;line-height:1.5}
        .lsuc{background:#3D9E7A12;border:1px solid #3D9E7A30;color:#2A7A5C;border-radius:10px;padding:10px 14px;font-size:13px;line-height:1.5}
        .ltabs{display:flex;background:#F7F5F1;border-radius:12px;padding:4px;border:1px solid #E8E3DB;width:100%;margin-bottom:22px}
        .ltab{flex:1;padding:9px;border:none;border-radius:9px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;transition:all .15s;background:transparent;color:#9A9080}
        .ltab.active{background:#FFF;color:#2D2D2D;box-shadow:0 1px 4px #00000012}
        .eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#A09080;font-size:18px;padding:4px;line-height:1}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="lcard">
        {/* Logo */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:"linear-gradient(135deg,#3D9E7A,#5B8FCC)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:14, boxShadow:"0 8px 24px #3D9E7A30" }}>₿</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:600 }}>FinFlow</div>
          <div style={{ fontSize:13, color:"#A09080", marginTop:4 }}>
            {{ login:"Acesse sua conta", cadastro:"Crie sua conta", reset:"Recuperar senha" }[modo]}
          </div>
        </div>

        {/* Tabs */}
        {modo !== "reset" && (
          <div className="ltabs">
            <button className={`ltab ${modo==="login"?"active":""}`}    onClick={()=>{setModo("login");   limpar();}}>Entrar</button>
            <button className={`ltab ${modo==="cadastro"?"active":""}`} onClick={()=>{setModo("cadastro");limpar();}}>Criar conta</button>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* E-mail */}
          <div className="lfield">
            <label>E-mail</label>
            <input className={`linput ${erro?"erro":""}`} type="email" placeholder="seu@email.com"
              value={email} onChange={e=>{setEmail(e.target.value);limpar();}} onKeyDown={handleKey} autoFocus/>
          </div>

          {/* Senha */}
          {modo !== "reset" && (
            <div className="lfield">
              <label>Senha</label>
              <div style={{ position:"relative" }}>
                <input className={`linput ${erro?"erro":""}`} type={mostrar?"text":"password"} placeholder="••••••••"
                  value={senha} onChange={e=>{setSenha(e.target.value);limpar();}} onKeyDown={handleKey} style={{ paddingRight:44 }}/>
                <button className="eye" onClick={()=>setMostrar(m=>!m)} tabIndex={-1}>{mostrar?"🙈":"👁️"}</button>
              </div>
            </div>
          )}

          {/* Confirmar senha */}
          {modo === "cadastro" && (
            <div className="lfield">
              <label>Confirmar senha</label>
              <div style={{ position:"relative" }}>
                <input className={`linput ${erro?"erro":""}`} type={mostrar?"text":"password"} placeholder="••••••••"
                  value={senha2} onChange={e=>{setSenha2(e.target.value);limpar();}} onKeyDown={handleKey} style={{ paddingRight:44 }}/>
              </div>
            </div>
          )}

          {/* Mensagens */}
          {erro    && <div className="lerro">❌ {erro}</div>}
          {sucesso && <div className="lsuc">✅ {sucesso}</div>}

          {/* Botão */}
          <button className="lbtn" onClick={modo==="login"?handleLogin:modo==="cadastro"?handleCadastro:handleReset} disabled={loading}>
            {loading ? "Aguarde..." : { login:"Entrar →", cadastro:"Criar conta →", reset:"Enviar link de redefinição" }[modo]}
          </button>

          <div style={{ textAlign:"center" }}>
            {modo === "login"  && <button className="llink" onClick={()=>{setModo("reset");limpar();}}>Esqueci minha senha</button>}
            {modo === "reset"  && <button className="llink" onClick={()=>{setModo("login");limpar();}}>← Voltar ao login</button>}
          </div>
        </div>

        <div style={{ fontSize:12, color:"#C0B8A8", textAlign:"center", marginTop:24 }}>🔒 Dados protegidos e salvos na nuvem</div>
      </div>
    </div>
  );
}
