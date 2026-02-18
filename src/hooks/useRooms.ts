import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { rooms } from '@/src/integrations/supabase/queries';

interface GameRoom {
  id: string;
  name: string;
  code: string;
  status: string;
  max_players: number;
  host_id: string;
  created_at: string;
}

export function useRooms() {
  const [roomList, setRoomList] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await rooms.getRooms();
      if (queryError) throw queryError;
      setRoomList(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();

    // Setup real-time subscription
    const subscription = supabase
      .channel('game_rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms' },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRooms]);

  return { roomList, loading, error, refetch: fetchRooms };
}
