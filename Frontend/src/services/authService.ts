import api from "@/lib/axios";

export const authService = {
  signUp: async (
    username: string,
    email: string,
    password: string,
    displayName: string
  ) => {
    const res = await api.post(
      "auth/signup",
      {
        username,
        email,
        password,
        displayName,
      },
      { withCredentials: true, skipAuth: true } as any
    );
    return res.data;
  },
  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "auth/signin",
      {
        username,
        password,
      },
      { withCredentials: true, skipAuth: true } as any
    );
    return res.data;
  },
  signOut: async () => {
    await api.post("auth/signout", {}, { withCredentials: true });
  },
  refreshToken: async () => {
    const res = await api.post("auth/refresh-token", {}, {
      withCredentials: true,
      skipAuth: true,
    } as any);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get("/user/profile");
    return res.data;
  }
};
