import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { chat } from '@/src/integrations/supabase/queries';

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      const { data, error: queryError } = await chat.getMessages(roomId);
      if (queryError) throw queryError;
      setMessages(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();

    // Setup real-time subscription
    const subscription = supabase
      .channel(`room:${roomId}:chat`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages };
}
