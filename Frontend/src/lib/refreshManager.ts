import { authService } from "../services/authService.ts";
import { useAuthStore } from "../stores/useAuthStore.ts";

class AuthRefreshController {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  async getValidAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const res = await authService.refreshToken();
        const newToken = res.accessToken;

        useAuthStore.getState().setAccessToken(newToken);

        resolve(newToken);
      } catch (err) {
        reject(err);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }
}

export const authRefreshController = new AuthRefreshController();
