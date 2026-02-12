
import React, { useState, useRef, useEffect } from 'react';
import { EmailInput, EmailMentorResponse, ChatMessage } from './types';
import { analyzeEmail, startChatWithMentor } from './geminiService';

const App: React.FC = () => {
  const [formData, setFormData] = useState<EmailInput>({
    targetGroup: '',
    purpose: '',
    isReadyForAction: false,
    value: '',
    draft: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailMentorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setChatMessages([]);
    try {
      const data = await analyzeEmail(formData);
      setResult(data);
      
      // Initialize chat session with context
      const contextString = JSON.stringify(data);
      chatSessionRef.current = startChatWithMentor(contextString);

      const resultEl = document.getElementById('result-section');
      if (resultEl) {
        window.scrollTo({ top: resultEl.offsetTop - 80, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Der skete en fejl under analysen. Prøv venligst igen.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setChatLoading(true);

    try {
      if (!chatSessionRef.current) {
        // Fallback if session wasn't initialized
        const contextString = result ? JSON.stringify(result) : "";
        chatSessionRef.current = startChatWithMentor(contextString, chatMessages);
      }

      const response = await chatSessionRef.current.sendMessage({ message: userMessage });
      const modelResponse = response.text;
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: modelResponse }] }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: "Beklager, jeg fik en fejl i min hjerne. Prøv at spørge igen!" }] }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">Email Mentor</h1>
              <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">DGI Strategisk Rådgivning</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
             <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-tight">AI Drevet Kommunikation</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          
          {/* Form Section */}
          <section className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">1</span>
                  Din Kampagne
                </h2>
                <p className="text-slate-500 mt-1">Fortæl mig om modtageren og dit budskab.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Målgruppe</label>
                    <input
                      type="text"
                      name="targetGroup"
                      value={formData.targetGroup}
                      onChange={handleChange}
                      placeholder="F.eks. Formænd eller trænere"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Formål</label>
                    <input
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      placeholder="Hvad skal de gøre?"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      name="isReadyForAction"
                      id="isReadyForAction"
                      checked={formData.isReadyForAction}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 rounded-lg border-blue-200 focus:ring-blue-500"
                    />
                  </div>
                  <label htmlFor="isReadyForAction" className="text-sm font-semibold text-blue-900 cursor-pointer select-none">
                    Er de klar til handling nu? (Varm lead)
                    <span className="block text-xs font-normal text-blue-600 mt-0.5">Sæt kryds hvis de allerede kender tilbuddet eller det er en overbygning.</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Hvilken værdi får de?</label>
                  <textarea
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    rows={2}
                    placeholder="F.eks. Spar tid i hverdagen eller få glade instruktører..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all resize-none placeholder:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Dit udkast eller stikord</label>
                  <textarea
                    name="draft"
                    value={formData.draft}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Skriv din tekst her..."
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all resize-none placeholder:text-slate-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-8 rounded-2xl font-black text-lg text-white transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                    loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyserer strategi...
                    </>
                  ) : (
                    'Få mentor-rådgivning'
                  )}
                </button>
              </form>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </section>

          {/* Result Section */}
          <section id="result-section" className="space-y-6">
            {!result && !loading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-400">Klar til at optimere?</h3>
                <p className="text-slate-400 max-w-xs mt-2 text-sm">Udfyld kampagne-info for at få strategisk rådgivning og det skarpe udkast.</p>
              </div>
            )}

            {loading && (
              <div className="space-y-6 animate-pulse">
                <div className="h-40 bg-slate-200 rounded-3xl"></div>
                <div className="h-24 bg-slate-200 rounded-3xl"></div>
                <div className="h-80 bg-slate-200 rounded-3xl"></div>
              </div>
            )}

            {result && (
              <div className="space-y-6 pb-10">
                
                {/* Strategic Advice */}
                <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl shadow-indigo-100 border border-indigo-800">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black flex items-center gap-3">
                       <span className="w-8 h-8 rounded-full bg-white text-indigo-900 flex items-center justify-center text-sm">A</span>
                       Strategisk Rådgivning
                    </h2>
                    <span className="text-[10px] bg-indigo-800 px-2 py-1 rounded font-bold uppercase">Målgruppe & Segmentering</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-indigo-800/50 rounded-2xl border border-indigo-700">
                      <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Permission Tjek (Juridisk)</h3>
                      <p className="text-sm leading-relaxed text-indigo-50 font-medium">{result.strategicAdvice.permissionCheck}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3">Segmenterings-forslag</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.strategicAdvice.segmentationSuggestions.map((item, idx) => (
                          <div key={idx} className="bg-white/10 p-3 rounded-xl border border-white/5 text-sm flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-sm">B</span>
                    Mentor Feedback
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-green-600 uppercase tracking-widest">Det gode:</h3>
                      <ul className="space-y-3">
                        {result.feedback.good.map((item, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-slate-600 font-medium leading-tight">
                            <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">✓</div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest">Løftes her:</h3>
                      <ul className="space-y-3">
                        {result.feedback.improvements.map((item, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-slate-600 font-medium leading-tight">
                            <div className="w-5 h-5 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">→</div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Optimized Draft */}
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">C</span>
                    Det Optimerede Udkast
                  </h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-2">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Emnelinjer (Vælg én)</h3>
                       {result.optimizedDraft.subjectLines.map((line, idx) => (
                         <button 
                           key={idx}
                           onClick={() => navigator.clipboard.writeText(line)}
                           className="text-left p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors flex justify-between items-center group"
                         >
                           {line}
                           <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 uppercase">Kopiér</span>
                         </button>
                       ))}
                    </div>

                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Preheader</h3>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm italic text-slate-600">
                        {result.optimizedDraft.preheader}
                      </div>
                    </div>

                    <div className="relative group">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Indhold</h3>
                      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 text-base text-slate-800 leading-relaxed whitespace-pre-wrap font-serif">
                        {result.optimizedDraft.content}
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(result.optimizedDraft.content)}
                        className="absolute top-8 right-4 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm transition-all"
                      >
                        Kopiér alt
                      </button>
                    </div>

                    <div className="p-4 bg-slate-900 rounded-2xl">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase mb-3 text-center tracking-[0.2em]">Tjekliste før send</h3>
                      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                         {result.feedback.checklist.map((item, idx) => (
                           <div key={idx} className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                             <div className="w-3 h-3 rounded-sm bg-blue-600 flex items-center justify-center text-[8px] text-white">✓</div>
                             {item}
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Section */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100">
                   <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">?</span>
                    Spørg Mentoren
                  </h2>
                  
                  <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {chatMessages.length === 0 && (
                      <p className="text-sm text-slate-400 italic text-center py-4">
                        Har du brug for en uddybning af rådgivningen eller en rettelse til udkastet? Spørg mig herunder.
                      </p>
                    )}
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                          : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                        }`}>
                          {msg.parts[0].text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none border border-slate-200 flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Skriv dit spørgsmål til mentoren her..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all"
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className={`px-6 py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 ${
                        chatLoading || !chatInput.trim() ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-slate-500">Udviklet til DGI's koordinatorer for strategisk kommunikation i øjenhøjde.</p>
          <div className="mt-4 flex justify-center gap-6 opacity-30 grayscale">
            <span className="text-xs font-black uppercase tracking-widest">Modtagerorienteret</span>
            <span className="text-xs font-black uppercase tracking-widest">Konkret</span>
            <span className="text-xs font-black uppercase tracking-widest">Motiverende</span>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
