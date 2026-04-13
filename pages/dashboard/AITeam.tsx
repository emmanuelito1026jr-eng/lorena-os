import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Sparkles, Mail, Users, Calendar, TrendingUp,
  FileText, Zap, ChevronRight, CheckCircle2, Circle,
  Copy, Check, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; }
interface AgentCard { id: string; name: string; icon: React.ElementType; description: string; status: 'active' | 'idle' | 'running'; lastAction: string; }

const AGENTS_BASE: AgentCard[] = [
  { id: 'lead-qualifier', name: 'Lead Qualifier', icon: Users, description: '60-second lead response via SMS', status: 'idle', lastAction: 'Ready to qualify new leads' },
  { id: 'follow-up', name: 'Follow-Up Agent', icon: Zap, description: 'Drip sequences & lead reactivation', status: 'idle', lastAction: 'Monitoring drip sequences' },
  { id: 'email-composer', name: 'Email Composer', icon: Mail, description: 'Professional email drafting', status: 'idle', lastAction: 'Ready to draft emails' },
  { id: 'showing-coordinator', name: 'Showing Coordinator', icon: Calendar, description: 'Scheduling, reminders & feedback', status: 'idle', lastAction: 'No showings today' },
  { id: 'market-analyst', name: 'Market Analyst', icon: TrendingUp, description: 'Daily El Paso market intelligence', status: 'idle', lastAction: 'Monitoring El Paso market' },
  { id: 'cma-agent', name: 'CMA Agent', icon: FileText, description: 'Instant comp analysis reports', status: 'idle', lastAction: 'Ready to generate CMA' },
];

const QUICK_ACTIONS = [
  { label: 'Draft an email', icon: Mail, prompt: '' },
  { label: "Today's briefing", icon: Sparkles, prompt: "Give me today's business briefing — new leads, showings, and my top priority." },
  { label: 'Follow up leads', icon: Users, prompt: 'Which leads need follow-up right now? What should I prioritize?' },
  { label: 'Market update', icon: TrendingUp, prompt: "What's the El Paso real estate market doing right now? Give me a quick summary." },
];

function generateId(): string { return Math.random().toString(36).slice(2, 9); }
function formatTime(date: Date): string { return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
function getGreeting(): string { const h = new Date().getHours(); if (h < 12) return 'morning'; if (h < 18) return 'afternoon'; return 'evening'; }

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';
  const copy = () => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dashboard-gold/20 border border-dashboard-gold/30 flex items-center justify-center"><Bot size={16} className="text-dashboard-gold" /></div>}
      <div className={`group max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm font-lato leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-dashboard-gold text-white rounded-tr-sm' : 'bg-white border border-[#E5E5E0] text-dashboard-dark rounded-tl-sm'}`}>{msg.content}</div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-dashboard-secondary font-lato">{formatTime(msg.timestamp)}</span>
          <button onClick={copy} className="p-1 rounded hover:bg-black/5 transition-colors">{copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-dashboard-secondary" />}</button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dashboard-gold/20 border border-dashboard-gold/30 flex items-center justify-center"><Bot size={16} className="text-dashboard-gold" /></div>
      <div className="bg-white border border-[#E5E5E0] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-dashboard-gold/60 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-dashboard-gold/60 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-dashboard-gold/60 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function AgentStatusCard({ agent, onClick }: { agent: AgentCard; onClick: (a: AgentCard) => void }) {
  const Icon = agent.icon;
  return (
    <button onClick={() => onClick(agent)} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E5E5E0] hover:border-dashboard-gold/40 hover:bg-[#FAFAF5] transition-all group text-left w-full">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-dashboard-gold/10 flex items-center justify-center group-hover:bg-dashboard-gold/20 transition-colors"><Icon size={16} className="text-dashboard-gold" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-lato text-xs font-semibold text-dashboard-dark truncate">{agent.name}</span>
          <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-green-400' : agent.status === 'running' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'}`} />
        </div>
        <p className="font-lato text-[10px] text-dashboard-secondary mt-0.5 truncate">{agent.lastAction}</p>
      </div>
    </button>
  );
}

export default function AITeam() {
  usePageTitle('AI Staff');
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([{ id: generateId(), role: 'assistant', content: `Good ${getGreeting()}, ${profile?.full_name?.split(' ')[0] ?? 'there'} 👋\n\nI'm your AI Chief of Staff. Your team is ready:\n\n• Lead Qualifier — texts any new lead within 60 seconds\n• Follow-Up Agent — running your active drip sequences\n• Email Composer — ready to draft any email you need\n• Showing Coordinator — managing your calendar\n• Market Analyst — monitoring El Paso market daily\n• CMA Agent — instant comp analysis on any address\n\nWhat do you need today?`, timestamp: new Date() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailContext, setEmailContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Pull real stats for agent status cards
  const { data: agentStats } = useQuery({
    queryKey: ['ai-team-stats'],
    queryFn: async () => {
      const [enrollments, hotLeads, cmaCounts, showings] = await Promise.all([
        supabase.from('drip_enrollments').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('leads').select('id', { count: 'exact' }).gte('score', 80),
        supabase.from('cma_reports').select('id', { count: 'exact' }),
        supabase.from('showings').select('id', { count: 'exact' }).gte('showing_date', new Date().toISOString().slice(0, 10)),
      ]);
      return {
        activeEnrollments: enrollments.count ?? 0,
        hotLeads: hotLeads.count ?? 0,
        cmaCount: cmaCounts.count ?? 0,
        upcomingShowings: showings.count ?? 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Build dynamic agents with real data
  const AGENTS: AgentCard[] = [
    { ...AGENTS_BASE[0], status: (agentStats?.hotLeads ?? 0) > 0 ? 'active' : 'idle', lastAction: agentStats?.hotLeads ? `${agentStats.hotLeads} hot leads ready to qualify` : 'Watching for new leads' },
    { ...AGENTS_BASE[1], status: (agentStats?.activeEnrollments ?? 0) > 0 ? 'active' : 'idle', lastAction: agentStats?.activeEnrollments ? `${agentStats.activeEnrollments.toLocaleString()} leads in active sequences` : 'No active sequences' },
    { ...AGENTS_BASE[2], status: 'idle', lastAction: 'Ready to draft professional emails' },
    { ...AGENTS_BASE[3], status: (agentStats?.upcomingShowings ?? 0) > 0 ? 'active' : 'idle', lastAction: agentStats?.upcomingShowings ? `${agentStats.upcomingShowings} upcoming showings` : 'No showings scheduled' },
    { ...AGENTS_BASE[4], status: 'active', lastAction: 'Monitoring El Paso market daily' },
    { ...AGENTS_BASE[5], status: (agentStats?.cmaCount ?? 0) > 0 ? 'idle' : 'idle', lastAction: agentStats?.cmaCount ? `${agentStats.cmaCount} CMA reports generated` : 'Ready to generate CMAs' },
  ];

  const buildContext = (): string => {
    const lines: string[] = [];
    if (profile?.full_name) lines.push(`Realtor: ${profile.full_name}`);
    lines.push('Market: El Paso, TX (bilingual EN/ES)');
    lines.push('Platform: InnoClose by Manorev');
    return lines.join('\n');
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    const userMsg: Message = { id: generateId(), role: 'user', content: content.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = [...messages, userMsg].slice(-12).map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('ai-staff', { body: { messages: history, agent: 'ceo', context: buildContext() } });
      if (error) throw error;
      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: (data as { text?: string })?.text ?? 'Sorry, try again.', timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: "I'm having trouble connecting. Make sure the ai-staff Edge Function is deployed.", timestamp: new Date() }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(input); } };
  const handleAgentClick = (agent: AgentCard) => { if (agent.id === 'email-composer') { setEmailModal(true); } else { void sendMessage(`Tell me about the ${agent.name} — what's it doing and what should I know?`); } };
  const handleEmailDraft = () => { if (!emailContext.trim()) return; setEmailModal(false); void sendMessage(`Please draft a professional email. Context:\n\n${emailContext}`); setEmailContext(''); };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col bg-[#FAFAF5] rounded-2xl border border-[#E5E5E0] overflow-hidden min-w-0">
        <div className="px-5 py-4 border-b border-[#E5E5E0] bg-white flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-dashboard-gold flex items-center justify-center"><Bot size={18} className="text-white" /></div>
          <div><h2 className="font-playfair text-sm font-bold text-dashboard-dark">AI Chief of Staff</h2><p className="font-lato text-[11px] text-dashboard-secondary">InnoClose AI · Powered by Claude</p></div>
          <div className="ml-auto flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /><span className="font-lato text-[11px] text-dashboard-secondary">Online</span></div>
        </div>
        <div className="px-4 py-3 border-b border-[#E5E5E0] bg-white flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_ACTIONS.map(action => { const Icon = action.icon; return (
              <button key={action.label} onClick={() => { if (action.label === 'Draft an email') { setEmailModal(true); } else { void sendMessage(action.prompt); } }} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F0] hover:bg-dashboard-gold/10 border border-[#E5E5E0] hover:border-dashboard-gold/30 transition-colors">
                <Icon size={12} className="text-dashboard-gold" /><span className="font-lato text-[11px] text-dashboard-dark whitespace-nowrap">{action.label}</span>
              </button>
            ); })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        <div className="px-4 pb-4 pt-2 bg-white border-t border-[#E5E5E0] flex-shrink-0">
          <div className="flex items-end gap-2 bg-[#F5F5F0] rounded-xl border border-[#E5E5E0] px-3 py-2 focus-within:border-dashboard-gold/40 transition-colors">
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything or say 'draft an email to John about his offer'..." rows={1} className="flex-1 bg-transparent resize-none outline-none font-lato text-sm text-dashboard-dark placeholder:text-dashboard-secondary leading-5 max-h-32 overflow-y-auto" />
            <button onClick={() => void sendMessage(input)} disabled={!input.trim() || loading} className="flex-shrink-0 w-7 h-7 rounded-lg bg-dashboard-gold flex items-center justify-center hover:bg-dashboard-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><Send size={13} className="text-white" /></button>
          </div>
          <p className="font-lato text-[10px] text-dashboard-secondary mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
      <div className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-[#E5E5E0] p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="font-playfair text-sm font-bold text-dashboard-dark">Your AI Team</h3><span className="font-lato text-[10px] text-dashboard-secondary bg-[#F5F5F0] px-2 py-0.5 rounded-full">6 agents</span></div>
          <div className="space-y-2">{AGENTS_BASE.map(agent => <AgentStatusCard key={agent.id} agent={agent} onClick={handleAgentClick} />)}</div>
        </div>
        <button onClick={() => setEmailModal(true)} className="w-full bg-dashboard-gold text-white rounded-2xl p-4 hover:bg-dashboard-gold/90 transition-colors text-left">
          <div className="flex items-center gap-2 mb-2"><Mail size={16} /><span className="font-playfair text-sm font-bold">Email Composer</span></div>
          <p className="font-lato text-[11px] text-white/80">Describe the email you need and get a polished draft instantly.</p>
          <div className="flex items-center gap-1 mt-3 text-white/80"><span className="font-lato text-[11px]">Draft email now</span><ChevronRight size={12} /></div>
        </button>
        <div className="bg-white rounded-2xl border border-[#E5E5E0] p-4">
          <h3 className="font-playfair text-xs font-bold text-dashboard-dark mb-3">System Status</h3>
          <div className="space-y-2">
            {[{ label: 'AI Engine', ok: true }, { label: 'Lead Scoring', ok: true }, { label: 'SMS (Twilio)', ok: false }, { label: 'Email (SendGrid)', ok: false }].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="font-lato text-[11px] text-dashboard-secondary">{item.label}</span>
                {item.ok ? <div className="flex items-center gap-1"><CheckCircle2 size={11} className="text-green-400" /><span className="font-lato text-[10px] text-green-600">Active</span></div> : <div className="flex items-center gap-1"><Circle size={11} className="text-gray-300" /><span className="font-lato text-[10px] text-gray-400">Pending</span></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-dashboard-gold flex items-center justify-center"><Mail size={15} className="text-white" /></div><div><h3 className="font-playfair text-sm font-bold text-dashboard-dark">Email Composer</h3><p className="font-lato text-[10px] text-dashboard-secondary">AI-powered · Bilingual EN/ES</p></div></div>
              <button onClick={() => { setEmailModal(false); setEmailContext(''); }} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"><X size={14} className="text-dashboard-secondary" /></button>
            </div>
            <div className="mb-4">
              <label className="block font-lato text-xs font-semibold text-dashboard-dark mb-2">Describe the email you need</label>
              <textarea value={emailContext} onChange={e => setEmailContext(e.target.value)} placeholder="Examples:\n• Thank John for the showing at 123 Mesa Hills\n• Follow up with Maria who hasn't responded in 2 weeks\n• Price reduction notice to interested buyers" rows={5} className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E0] focus:border-dashboard-gold outline-none font-lato text-sm text-dashboard-dark placeholder:text-gray-300 leading-relaxed resize-none transition-colors" autoFocus onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleEmailDraft(); }} />
              <p className="font-lato text-[10px] text-dashboard-secondary mt-1">Cmd+Enter to draft</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEmailModal(false); setEmailContext(''); }} className="flex-1 py-2.5 rounded-xl border border-[#E5E5E0] font-lato text-sm text-dashboard-secondary hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleEmailDraft} disabled={!emailContext.trim()} className="flex-1 py-2.5 rounded-xl bg-dashboard-gold text-white font-lato text-sm font-semibold hover:bg-dashboard-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"><Sparkles size={14} />Draft Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}