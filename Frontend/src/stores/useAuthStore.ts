import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        localStorage.clear();
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
          localStorage.clear();
          set({ loading: true });
          //logic
          const res = await authService.signIn(username, password);
          set({ accessToken: res?.accessToken, user: res?.user });
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
      getProfile: async () => {
        try {
          const res = await authService.getProfile();
          set({ user: res });
        } catch (error) {
          console.error(error);
          toast.error("Lấy thông tin người dùng thất bại!");
        } finally {
          set({ loading: false });
        }
      },
      refreshToken: async () => {
        try {
          const res = await authService.refreshToken();
          set({ accessToken: res.accessToken });
          await get().getProfile();
        } catch (error) {
          console.error(error);
          toast.error("Làm mới token thất bại!");
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
