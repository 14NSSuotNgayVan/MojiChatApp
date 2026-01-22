import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore.ts";
import { authRefreshController } from "../lib/refreshManager.ts";
import { userService } from "../services/userService.ts";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        useChatStore.getState().reset();
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
          get().clearState();
          useChatStore.getState().reset();
          set({ loading: true });
          //logic
          const res = await authService.signIn(username, password);
          set({ accessToken: res?.accessToken, user: res?.user });
          return true;
        } catch (error: any) {
          if (error.response && error.response.status !== 401) {
            console.error(error);
            toast.error("Đăng nhập thất bại. Vui lòng thử lại!");
          }
          return false;
        } finally {
          set({ loading: false });
        }
      },
      signOut: async () => {
        try {
          await authService.signOut();
          get().clearState();
          useChatStore.getState().reset();
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
      updateProfile: async (data) => {
        try {
          await userService.updateProfile(data);

          toast.success("Đăng xuất thành công!");
        } catch (error) {
          console.error(error);
          toast.error("Đăng xuất thất bại. Vui lòng thử lại!");
        }
      },
      refreshToken: async () => {
        try {
          const accessToken = await authRefreshController.getValidAccessToken();
          set({ accessToken: accessToken });
          await get().getProfile();
        } catch (error) {
          console.error(error);
          console.error("Làm mới token thất bại!");
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
