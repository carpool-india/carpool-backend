import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useAuthStore } from "../store/authStore";
import { PrimaryButton } from "./ui";

export function ChatPanel({ tripId }: { tripId: string }) {
  const { messages, send, connected, loading, error } = useChat(tripId);
  const userId = useAuthStore((state) => state.user?.id);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function submit() {
    const body = draft.trim();
    if (!body || sending) {
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await send(body);
      setDraft("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Message didn't send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="font-display text-sm font-extrabold text-ink">Chat</p>
        <span className={`text-[11px] font-bold ${connected ? "text-emerald-600" : "text-ink-faint"}`}>
          {connected ? "Live" : "Connecting…"}
        </span>
      </div>

      <div ref={listRef} className="max-h-72 space-y-2 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-sm text-ink-faint">Loading messages…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-faint">No messages yet. Say hello.</p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === userId;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-paper text-ink"}`}>
                  {!mine ? <p className="mb-0.5 text-[11px] font-bold opacity-70">{message.senderName ?? "Rider"}</p> : null}
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="border-t border-line px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message your driver or passenger…"
            maxLength={1000}
            className="flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm outline-none focus:border-brand"
          />
          <PrimaryButton type="submit" disabled={!draft.trim() || sending} className="px-4 py-2 text-xs">
            {sending ? "Sending…" : "Send"}
          </PrimaryButton>
        </div>
        {sendError ? <p className="mt-1.5 text-xs font-semibold text-red-600">{sendError}</p> : null}
      </form>
    </div>
  );
}
