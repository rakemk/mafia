import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { players } from '@/src/integrations/supabase/queries';

interface GamePlayer {
  id: string;
  user_id: string;
  username: string;
  role?: string;
  is_alive: boolean;
  joined_at: string;
}

export function usePlayers(roomId: string) {
  const [playerList, setPlayerList] = useState<GamePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      const { data, error: queryError } = await players.getPlayers(roomId);
      if (queryError) throw queryError;
      setPlayerList(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchPlayers();

    // Setup real-time subscription
    const subscription = supabase
      .channel(`room:${roomId}:players`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, fetchPlayers]);

  return { playerList, loading, error, refetch: fetchPlayers };
}
