import api from "../lib/axios.ts";

export const friendService = {
  async unFriend(userId: string) {
    const res = await api.delete(`/friend/${userId}`);
    return res.data;
  },
  async addFriend(userId: string) {
    const res = await api.post("/friend/request", { toUserId: userId });
    return res.data;
  },
  async acceptFriendRequest(requestId: string) {
    const res = await api.post(`/friend/request/${requestId}/accept`);
    return res.data;
  },
  async declineFriendRequest(requestId: string) {
    const res = await api.post(`/friend/request/${requestId}/decline`);
    return res.data;
  },
  async getFriends(params: { keyword: string }) {
    const res = await api.get("/friend", { params });
    return res.data;
  },
  async getFriendRequests(params: { keyword: string }) {
    const res = await api.get("/friend/request", { params });
    return res.data;
  },
};
