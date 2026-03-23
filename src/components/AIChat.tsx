import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const KNOWLEDGE_BASE: Record<string, string | string[]> = {
  greetings: ["Hello! I'm your Smart Campus AI. How can I assist you today?", "Hi there! Need help navigating the campus management system?"],
  login: "Accounts are created by the Campus Administrator. If you need access, please contact the IT department or your HOD.",
  outpass: "Students need an outpass to leave campus. Staff create requests, HODs approve them, and Watchmen verify them at the gate.",
  bus: "You can track bus entries in the 'Bus Entry' section. This is primarily handled by the Watchman role.",
  visitor: "Visitors must be registered at the gate by the Watchman. Look for the 'Visitors' tab in the sidebar.",
  hod: "Head of Departments (HOD) are responsible for approving outpass requests for their specific department.",
  watchman: "Watchmen manage the physical gates, recording bus entries, visitor logs, and verifying student outpasses.",
  late: "If a student returns after their expected time, a 'Late' notification is automatically generated for the HOD.",
  records: "The 'Records' section provides a searchable history of all gate activities for authorized personnel.",
  profile: "You can view your role and institute details in the user card at the bottom of the sidebar.",
  help: "I can help with: Login, Outpasses, Bus Tracking, Visitor Logs, and Role-specific tasks. Just ask!",
};

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Message[]>([
    { role: 'assistant', content: Array.isArray(KNOWLEDGE_BASE.greetings) ? KNOWLEDGE_BASE.greetings[0] : KNOWLEDGE_BASE.greetings as string }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  const getResponse = (input: string): string => {
    const lowInput = input.toLowerCase();
    
    if (lowInput.includes('hello') || lowInput.includes('hi') || lowInput.includes('hey')) 
      return Array.isArray(KNOWLEDGE_BASE.greetings) ? KNOWLEDGE_BASE.greetings[Math.floor(Math.random() * KNOWLEDGE_BASE.greetings.length)] : KNOWLEDGE_BASE.greetings as string;
    
    if (lowInput.includes('login') || lowInput.includes('account') || lowInput.includes('password')) return KNOWLEDGE_BASE.login as string;
    if (lowInput.includes('outpass') || lowInput.includes('leave')) return KNOWLEDGE_BASE.outpass as string;
    if (lowInput.includes('bus')) return KNOWLEDGE_BASE.bus as string;
    if (lowInput.includes('visitor')) return KNOWLEDGE_BASE.visitor as string;
    if (lowInput.includes('hod') || lowInput.includes('approve')) return KNOWLEDGE_BASE.hod as string;
    if (lowInput.includes('watchman') || lowInput.includes('gate')) return KNOWLEDGE_BASE.watchman as string;
    if (lowInput.includes('late')) return KNOWLEDGE_BASE.late as string;
    if (lowInput.includes('record') || lowInput.includes('history')) return KNOWLEDGE_BASE.records as string;
    if (lowInput.includes('profile') || lowInput.includes('who am i')) return KNOWLEDGE_BASE.profile as string;
    
    return "I'm not quite sure about that. Try asking about Outpasses, Bus entries, or how to Login! You can also contact support for more help.";
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = message;
    setMessage('');
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    setTimeout(() => {
      setHistory(prev => [...prev, { role: 'assistant', content: getResponse(userMsg) }]);
    }, 800);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
            className="absolute bottom-20 right-0 w-[350px] h-[500px] rounded-[32px] border border-white/20 bg-card/60 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight">Campus AI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest">Active Now</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-9 w-9 rounded-xl hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
              {history.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`mt-1 h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-primary/20' : 'bg-accent/20'
                    }`}>
                      {msg.role === 'user' ? <User size={12} className="text-primary" /> : <Bot size={12} className="text-accent-foreground" />}
                    </div>
                    <div className={`rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-white/5 border border-white/10 backdrop-blur-md rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-5 border-t border-white/10 bg-white/5 flex gap-3">
              <Input 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..." 
                className="rounded-2xl h-12 bg-white/5 border-white/10 focus-visible:ring-primary/50 text-sm"
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl shrink-0 shadow-lg" style={{ background: 'var(--gradient-primary)' }}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-16 rounded-[22px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:scale-110 active:scale-95 transition-all duration-300 group"
        style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}
      >
        <MessageSquare className={`h-7 w-7 text-white transition-all duration-500 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`} />
        <X className={`absolute h-7 w-7 text-white transition-all duration-500 ${isOpen ? 'rotate-0 scale-100 opacity-100' : 'rotate-[-90deg] scale-0 opacity-0'}`} />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-accent"></span>
        </span>
      </Button>
    </div>
  );
}
