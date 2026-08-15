import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Copy, RefreshCw, Send, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { AiAvatar, TypingDots } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CHAT_SUGGESTIONS, QUICK_ACTIONS } from "@/lib/health-data";

export function textOf(message: UIMessage) {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

export function ChatPanel({
  sessionId,
  initialMessages = [],
  persist = false,
  userId,
  onFirstMessage,
}: {
  sessionId: string;
  initialMessages?: UIMessage[];
  persist?: boolean;
  userId?: string | undefined;
  onFirstMessage?: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport,
    onError: () => toast.error("Sorry, MediSage AI is temporarily unavailable. Please try again."),
    onFinish: ({ message }) => {
      if (persist && userId) {
        void supabase.from("chat_messages").insert({
          session_id: sessionId,
          user_id: userId,
          role: "assistant",
          content: textOf(message),
        });
      }
      inputRef.current?.focus();
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    if (persist && userId) {
      void supabase
        .from("chat_messages")
        .insert({ session_id: sessionId, user_id: userId, role: "user", content: value });
      void supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (messages.length === 0) onFirstMessage?.(value);
    }
    await sendMessage({ text: value });
    inputRef.current?.focus();
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[520px] flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <AiAvatar />
          <div>
            <p className="text-sm font-semibold">MediSage AI</p>
            <p className="text-xs text-muted-foreground">
              {busy ? "Typing…" : "Your personal healthcare assistant"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMessages([]);
            toast.info("Conversation cleared on screen.");
          }}
        >
          Clear conversation
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-primary-soft p-4 text-sm">
              Hi! I'm MediSage AI. Tell me how you're feeling, or pick a question below. I share
              health information and never a definitive diagnosis.
            </div>
            <div className="flex flex-wrap gap-2">
              {CHAT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => {
          const content = textOf(m);
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
              {isUser ? (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" aria-hidden="true" />
                </span>
              ) : (
                <AiAvatar />
              )}
              <div className={`max-w-[85%] space-y-2 ${isUser ? "text-right" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none [&_li]:my-0.5 [&_p]:my-1.5">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {!isUser && m.id === lastAssistant?.id && !busy ? (
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => void send(a.prompt)}
                        className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-primary"
                      >
                        {a.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(content);
                        toast.success("Response copied.");
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:border-primary"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const lastUser = [...messages].reverse().find((x) => x.role === "user");
                        if (lastUser) void send(textOf(lastUser));
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:border-primary"
                    >
                      <RefreshCw className="h-3 w-3" /> Regenerate
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {status === "submitted" ? (
          <div className="flex items-center gap-3">
            <AiAvatar />
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
              <TypingDots />
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Message MediSage AI
        </label>
        <Textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder="Describe how you feel or ask a health question…"
          className="max-h-40 min-h-11 resize-none"
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
