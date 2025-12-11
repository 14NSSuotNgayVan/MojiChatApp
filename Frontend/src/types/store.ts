import type { Conversation, Message } from "./chat.ts";
import type { User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  setLoading: (isLoading: boolean) => void;
  signUp: (
    username: string,
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;

  signIn: (username: string, password: string) => Promise<boolean>;
  clearState: () => void;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getProfile: () => Promise<void>;
  setAccessToken: (accessToken: string) => void;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean;
      nestCursor?: string | null;
    }
  >;
  activeConversationId: string | null;
  loading: boolean;
  reset: () => void;
  setActiveConversation: (id: string | null) => void;
  getConversations: () => Promise<void>;
}
