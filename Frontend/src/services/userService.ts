import api from "../lib/axios.ts";
import type { UpdateProfileRequest } from "../types/store.ts";

export const userService = {
  async getUser(userId: string) {
    const res = await api.get(`/user/${userId}`);
    return res.data;
  },
  async updateProfile(payload: UpdateProfileRequest) {
    const res = await api.put("/user/profile/update", payload);
    return res.data;
  },
  async getUsersNotFriend(params: { keyword: string }) {
    const res = await api.get(`/user/not-friend`, { params });
    return res.data;
  },
  async getUsers(params: { keyword: string }) {
    const res = await api.get(`/user`, { params });
    return res.data;
  },
};
