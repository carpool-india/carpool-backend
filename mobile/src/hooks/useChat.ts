import { useCallback, useEffect, useRef, useState } from "react";
import { Centrifuge } from "centrifuge";
import { bookingGet, bookingPost, serviceUrls } from "../services/api";

export interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string | null;
  senderPhotoUrl: string | null;
  body: string;
  createdAt: string;
}

interface TokenResponse {
  token: string;
  channel: string;
}

export function useChat(tripId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Centrifuge | null>(null);

  useEffect(() => {
    if (!tripId) {
      return;
    }
    let cancelled = false;

    async function start() {
      setLoading(true);
      setError(null);
      try {
        const [{ messages: history }, { token, channel }] = await Promise.all([
          bookingGet<{ messages: ChatMessage[] }>(`/chat/${tripId}/messages`),
          bookingGet<TokenResponse>(`/chat/${tripId}/token`),
        ]);
        if (cancelled) {
          return;
        }
        setMessages(history);

        const client = new Centrifuge(serviceUrls.centrifugoWs, { token });
        client.on("connected", () => setConnected(true));
        client.on("disconnected", () => setConnected(false));
        client.on("publication", (ctx) => {
          if (ctx.channel !== channel) {
            return;
          }
          const message = ctx.data as ChatMessage;
          setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
        });
        client.connect();
        clientRef.current = client;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load chat");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      clientRef.current?.disconnect();
      clientRef.current = null;
      setConnected(false);
    };
  }, [tripId]);

  const send = useCallback(
    async (body: string) => {
      if (!tripId || !body.trim()) {
        return;
      }
      const { message } = await bookingPost<{ message: ChatMessage }>(`/chat/${tripId}/messages`, {
        body: body.trim(),
      });
      setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
    },
    [tripId]
  );

  return { messages, send, connected, loading, error };
}
