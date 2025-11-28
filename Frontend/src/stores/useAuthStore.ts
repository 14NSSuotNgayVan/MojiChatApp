import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,
  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },
  setLoading: (isLoading) => {
    set({ loading: isLoading });
  },
  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  signUp: async (username, email, password, displayName) => {
    try {
      set({ loading: true });
      //logic
      await authService.signUp(username, email, password, displayName);
      toast.success("Đăng ký thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Đăng ký thất bại. Vui lòng thử lại!");
    } finally {
      set({ loading: false });
    }
  },
  signIn: async (username, password) => {
    try {
      set({ loading: true });
      //logic
      const res = await authService.signIn(username, password);
      set({ accessToken: res?.accesssToken, user: res?.user });
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Đăng nhập thất bại. Vui lòng thử lại!");
      return false;
    } finally {
      set({ loading: false });
    }
  },
  signOut: async () => {
    try {
      await authService.signOut();
      get().clearState();
      toast.success("Đăng xuất thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Đăng xuất thất bại. Vui lòng thử lại!");
    }
  },
  refreshToken: async () => {
    try {
      const res = await authService.refreshToken();
      set({ accessToken: res.accesssToken });
    } catch (error) {
      console.error(error);
      toast.error("Làm mới token thất bại!");
    } finally {
      set({ loading: false });
    }
  },
  getProfile: async () => {
    try {
      const res = await authService.getProfile();
      set({ user: res.user });
    } catch (error) {
      console.error(error);
      toast.error("Lấy thông tin người dùng thất bại!");
    } finally {
      set({ loading: false });
    }
  },
}));
