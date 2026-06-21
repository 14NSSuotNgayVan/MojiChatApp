import { create } from 'zustand';
import { friendService } from '@/services/friendService';

interface FriendState {
  friendsCount: number;
  pendingRequestsCount: number;
  loading: boolean;
  refreshFriends: () => Promise<void>;
}

export const useFriendStore = create<FriendState>((set) => ({
  friendsCount: 0,
  pendingRequestsCount: 0,
  loading: false,
  refreshFriends: async () => {
    try {
      set({ loading: true });
      const [friendsRes, requestsRes] = await Promise.all([
        friendService.getFriends({ keyword: '' }),
        friendService.getFriendRequests({ keyword: '' }),
      ]);
      set({
        friendsCount: friendsRes?.friends?.length ?? 0,
        pendingRequestsCount: requestsRes?.received?.length ?? 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },
}));
