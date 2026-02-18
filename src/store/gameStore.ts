// Zustand store for game state
import { create } from 'zustand';

interface GameState {
  currentRoomId: string | null;
  currentUserId: string | null;
  currentUsername: string | null;
  setCurrentRoom: (roomId: string | null) => void;
  setCurrentUser: (userId: string, username: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRoomId: null,
  currentUserId: null,
  currentUsername: null,
  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),
  setCurrentUser: (userId, username) =>
    set({ currentUserId: userId, currentUsername: username }),
  reset: () =>
    set({
      currentRoomId: null,
      currentUserId: null,
      currentUsername: null,
    }),
}));
