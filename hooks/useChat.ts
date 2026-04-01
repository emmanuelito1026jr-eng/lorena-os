import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client';
import { logActivity } from '../lib/scoring/log-activity';
import { scoreMessage, isHotLead } from '../lib/chat/leadScoring';
import { generateResponse, WELCOME_MESSAGE } from '../lib/chat/chatService';
import { captureLeadFromChat } from '../lib/chat/leadCapture';
import { triggerHotLead } from '../lib/chat/webhookTriggers';

interface VisitorInfo {
  name: string;
  phone?: string;
  email?: string;
}

interface LocalMessage {
  id: string;
  role: 'visitor' | 'bot' | 'agent';
  content: string;
  created_at: string;
}

const VISITOR_ID_KEY = 'chat_visitor_id';
const SESSION_KEY = 'chat_session_data';

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

function saveSessionToStorage(data: {
  sessionId: string;
  messages: LocalMessage[];
  score: number;
  visitorInfo: VisitorInfo | null;
  matchedCategories: string[];
  captureSkippedCount: number;
}) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // Storage full — ignore
  }
}

function loadSessionFromStorage(): {
  sessionId: string;
  messages: LocalMessage[];
  score: number;
  visitorInfo: VisitorInfo | null;
  matchedCategories: string[];
  captureSkippedCount: number;
} | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const [leadScore, setLeadScore] = useState(0);
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const matchedCategories = useRef<Set<string>>(new Set());
  const messageCount = useRef(0);
  const captureSkippedCount = useRef(0);
  const wasHot = useRef(false);
  const initialized = useRef(false);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = loadSessionFromStorage();
    if (saved) {
      setSessionId(saved.sessionId);
      setMessages(saved.messages);
      setLeadScore(saved.score);
      setVisitorInfo(saved.visitorInfo);
      matchedCategories.current = new Set(saved.matchedCategories);
      messageCount.current = saved.messages.filter((m) => m.role === 'visitor').length;
      captureSkippedCount.current = saved.captureSkippedCount;
      wasHot.current = isHotLead(saved.score);
    }
  }, []);

  // Persist to sessionStorage on changes
  useEffect(() => {
    if (sessionId) {
      saveSessionToStorage({
        sessionId,
        messages,
        score: leadScore,
        visitorInfo,
        matchedCategories: Array.from(matchedCategories.current),
        captureSkippedCount: captureSkippedCount.current,
      });
    }
  }, [sessionId, messages, leadScore, visitorInfo]);

  const createSession = useCallback(async (): Promise<string> => {
    const visitorId = getVisitorId();
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        visitor_id: visitorId,
        page_url: window.location.href,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Chat] Session create error:', error.message);
      // Generate a local-only ID so the UI still works
      return `local-${crypto.randomUUID()}`;
    }

    return data.id;
  }, []);

  const insertMessage = useCallback(
    async (sid: string, role: 'visitor' | 'bot', content: string): Promise<LocalMessage> => {
      const localMsg: LocalMessage = {
        id: crypto.randomUUID(),
        role,
        content,
        created_at: new Date().toISOString(),
      };

      // Insert to Supabase (fire-and-forget for speed)
      if (!sid.startsWith('local-')) {
        supabase
          .from('chat_messages')
          .insert({ session_id: sid, role, content })
          .then(({ error }) => {
            if (error) console.error('[Chat] Message insert error:', error.message);
          });
      }

      return localMsg;
    },
    [],
  );

  const toggleChat = useCallback(async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    // Create session and add welcome message if first open
    if (!sessionId) {
      const sid = await createSession();
      setSessionId(sid);

      const welcome = await insertMessage(sid, 'bot', WELCOME_MESSAGE);
      setMessages([welcome]);
    }
  }, [isOpen, sessionId, createSession, insertMessage]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !sessionId) return;

      setIsLoading(true);
      messageCount.current += 1;

      // 1. Add visitor message
      const visitorMsg = await insertMessage(sessionId, 'visitor', content.trim());
      setMessages((prev) => [...prev, visitorMsg]);

      // 2. Score the message
      const { newScore, reasons } = scoreMessage(
        content,
        leadScore,
        matchedCategories.current,
        messageCount.current,
      );

      if (newScore !== leadScore) {
        setLeadScore(newScore);

        // Update session score in Supabase
        if (!sessionId.startsWith('local-')) {
          supabase
            .from('chat_sessions')
            .update({ lead_score: newScore })
            .eq('id', sessionId)
            .then(({ error }) => {
              if (error) console.error('[Chat] Score update error:', error.message);
            });
        }

        // Hot lead webhook (fire once)
        if (isHotLead(newScore) && !wasHot.current) {
          wasHot.current = true;
          triggerHotLead({
            session_id: sessionId,
            score: newScore,
            reasons,
            visitor_name: visitorInfo?.name,
            latest_message: content,
          });
        }
      }

      // 3. Generate bot response (with small delay for natural feel)
      await new Promise((resolve) => setTimeout(resolve, 600));

      const allMessages = [...messages, visitorMsg];
      const { reply, shouldCapture } = generateResponse(
        content,
        allMessages.map((m) => ({ role: m.role, content: m.content })),
        newScore,
        !!visitorInfo,
      );

      const botMsg = await insertMessage(sessionId, 'bot', reply);
      setMessages((prev) => [...prev, botMsg]);

      // 4. Show capture form if needed
      if (shouldCapture && !visitorInfo) {
        if (captureSkippedCount.current < 2) {
          // Show the form (user can dismiss)
          setShowCaptureForm(true);
        }
      }

      setIsLoading(false);
    },
    [sessionId, messages, leadScore, visitorInfo, insertMessage],
  );

  const dismissCaptureForm = useCallback(() => {
    setShowCaptureForm(false);
    captureSkippedCount.current += 1;
  }, []);

  const submitCapture = useCallback(
    async (name: string, phone?: string, email?: string) => {
      if (!sessionId) return;

      setShowCaptureForm(false);
      const info: VisitorInfo = { name, phone, email };
      setVisitorInfo(info);

      // Capture lead
      const messagesSummary = messages
        .filter((m) => m.role === 'visitor')
        .map((m) => m.content)
        .join(' | ')
        .slice(0, 500);

      const { leadId, error } = await captureLeadFromChat({
        sessionId,
        name,
        phone,
        email,
        score: leadScore,
        scoreReasons: Array.from(matchedCategories.current),
        pageUrl: window.location.href,
        messagesSummary,
      });

      // Fire-and-forget behavioral scoring for chatbot lead capture
      if (leadId) {
        logActivity(supabase, {
          leadId,
          action: 'chatbot_complete',
          metadata: { sessionId, pageUrl: window.location.href },
        }).catch((err) => console.error('[Scoring] logActivity error:', err));
      }

      // Add confirmation message
      const confirmMsg = error
        ? "Thanks! There was a small hiccup, but Lorena will still reach out to you soon."
        : `Thanks, ${name.split(' ')[0]}! Lorena will reach out to you shortly. In the meantime, feel free to keep chatting or browse our listings.`;

      const botMsg = await insertMessage(sessionId, 'bot', confirmMsg);
      setMessages((prev) => [...prev, botMsg]);
    },
    [sessionId, messages, leadScore, insertMessage],
  );

  return {
    messages,
    sessionId,
    isOpen,
    isLoading,
    showCaptureForm,
    leadScore,
    visitorInfo,
    sendMessage,
    submitCapture,
    dismissCaptureForm,
    toggleChat,
    closeChat,
  };
}
