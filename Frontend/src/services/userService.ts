import api from "../lib/axios.ts";

export const userService = {
  async getUser(userId: string) {
    const res = await api.get(`/user/${userId}`);
    return res.data;
  },
};
