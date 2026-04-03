import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, Sparkles, LogOut, Coins, CreditCard, ShieldCheck, BrainCircuit } from "lucide-react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState({ email: localStorage.getItem("email"), credits: localStorage.getItem("credits") || 0 });
  const [authMode, setAuthMode] = useState("login"); // login, register, hidden
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleAuth = async (e, type) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const resp = await fetch(`http://localhost:3000/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      if (type === "login") {
        setToken(data.token);
        setUser({ email: data.email, credits: data.credits });
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
        localStorage.setItem("credits", data.credits);
        setAuthMode("hidden");
      } else {
        alert("Compte cr ! Connectez-vous.");
        setAuthMode("login");
      }
    } catch (err) { alert(err.message); }
  };

  const logout = () => { localStorage.clear(); setToken(null); setAuthMode("login"); };

  const sendMessage = async () => {
    if (!input || !token) return;
    const userMsg = { role: "user", content: input };
    setMessages([...messages, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "ai", gpt: data.gpt, gemini: data.gemini, claude: data.claude, id: Date.now() }]);
      setUser({ ...user, credits: data.remainingCredits });
      localStorage.setItem("credits", data.remainingCredits);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const recharge = async () => {
    const res = await fetch("http://localhost:3000/create-checkout", { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-[#05060f] text-gray-100 flex flex-col font-sans">
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-gray-950/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/40"><Zap size={20} className="text-white fill-current" /></div>
          <h1 className="text-xl font-bold tracking-tight">JARVISSE <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ASSISTANT</span></h1>
        </div>
        <div className="flex items-center gap-4">
          {token ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-yellow-400">
                <Coins size={14} /> {user.credits}
              </div>
              <button onClick={recharge} className="hidden sm:block text-[10px] font-bold uppercase tracking-widest bg-green-600/20 text-green-400 border border-green-500/30 px-4 py-1.5 rounded-full hover:bg-green-600/30 transition-all">Recharger</button>
              <button onClick={logout} className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-500"><LogOut size={18}/></button>
            </div>
          ) : (
            <button onClick={() => setAuthMode("login")} className="px-5 py-2 bg-blue-600 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/40">Connexion</button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-10">
          <AnimatePresence>
            {!token && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <BrainCircuit size={64} className="mx-auto text-blue-500/50 mb-6" />
                <h2 className="text-4xl font-bold mb-4 tracking-tighter">L'Intelligence Artificielle Multi-Core</h2>
                <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">Connectez-vous pour dverrouiller la puissance de GPT-4, Gemini et Claude en simultan.</p>
              </motion.div>
            )}
            {messages.map((m, i) => (
              <motion.div key={m.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                {m.role === "user" ? (
                  <div className="bg-blue-600 px-6 py-3 rounded-2xl rounded-tr-none text-white max-w-[85%] shadow-xl shadow-blue-950/20 text-sm font-medium">{m.content}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {['GPT-4o mini', 'Gemini 1.5 Flash', 'Claude 3.5 Sonnet'].map((name, idx) => (
                      <div key={idx} className="bg-gray-900/40 border border-white/5 backdrop-blur-md p-5 rounded-3xl group hover:border-white/10 transition-colors">
                        <span className={`text-[10px] font-bold tracking-widest uppercase mb-4 block ${idx === 0 ? 'text-blue-400' : idx === 1 ? 'text-purple-400' : 'text-orange-400'}`}>{name}</span>
                        <div className="text-gray-300 text-[13px] leading-relaxed whitespace-pre-wrap">{[m.gpt, m.gemini, m.claude][idx]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="text-center text-xs text-blue-400/50 italic animate-pulse">Synchronisation multi-modale en cours...</div>}
          <div ref={scrollRef} />
        </div>
      </main>

      <footer className="p-4 sm:p-10 z-50">
        <div className="max-w-4xl mx-auto relative group">
          {!token && <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1px] rounded-[28px] cursor-not-allowed" />}
          <div className="bg-gray-900/80 border border-white/10 backdrop-blur-2xl p-2 rounded-[28px] focus-within:border-blue-500/30 transition-all duration-500 shadow-2xl relative">
            <div className="flex items-end gap-2 px-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())} className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-4 px-3 text-gray-100 placeholder-gray-500 text-sm" placeholder={token ? "Comparez 3 IAs maintenant..." : "Veuillez vous connecter..."} rows={1} />
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="p-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-blue-900/30 mb-1.5"><Send size={18} /></button>
            </div>
          </div>
        </div>
      </footer>

      {authMode !== "hidden" && !token && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={(e) => handleAuth(e, authMode)} className="bg-gray-950/80 border border-white/10 p-8 rounded-3xl w-full max-w-md space-y-6 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold tracking-tight text-center">{authMode === "login" ? "Accder au Chat" : "S'enregistrer"}</h3>
            <div className="space-y-4">
              <input name="email" type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" required />
              <input name="password" type="password" placeholder="Mot de passe" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/40">Continuer</button>
            <p onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="text-center text-xs text-gray-500 cursor-pointer hover:text-blue-400">
              {authMode === "login" ? "Pas encore de compte ? S'inscrire" : "Dj inscrit ? Se connecter"}
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
