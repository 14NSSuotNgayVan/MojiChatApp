import api from "../lib/axios.ts";
import type { UpdateProfileRequest } from "../types/store.ts";

export const userService = {
  async getUser(userId: string) {
    const res = await api.get(`/user/${userId}`);
    return res.data;
  },
  updateProfile: async (payload: UpdateProfileRequest) => {
    const res = await api.put("/user/profile/update", payload);
    return res.data;
  },
};
