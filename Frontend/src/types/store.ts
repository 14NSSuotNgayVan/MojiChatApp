import type { Socket } from "socket.io-client";
import type {
  Conversation,
  Message,
  MessageGroup,
  Participant,
} from "./chat.ts";
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
  activeConversation: Conversation | null;
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean;
      nextCursor?: string | null;
    }
  >;
  activeConversationId: string | null;
  loading: boolean;
  messageLoading: boolean;
  reset: () => void;
  setActiveConversation: (activeConversation: Conversation | null) => void;
  getConversations: () => Promise<void>;
  getMessages: (
    conversationId: string,
    isFetchOldMessage: boolean
  ) => Promise<void>;
  getDefaultGroupName: (participants: Participant[]) => string;
  getGroupMessages: (
    messages: Message[],
    timeThresholdMinutes?: number
  ) => MessageGroup[];
  sendDirectMessage: (
    conversationId: string,
    recipientId: string,
    content: string
  ) => Promise<void>;
  sendGroupMessage: (conversationId: string, content: string) => Promise<void>;
  onNewMessage: (data: NewMessageResponse) => void;
  updateConversation: (data: NewMessageResponse) => void;
}
interface NewMessageResponse {
  conversation: Pick<
    Conversation,
    "_id" | "lastMessageAt" | "lastMessage" | "unreadCounts"
  >;
  message: Message;
}
export interface SocketState {
  socket: Socket | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
  onlineUsers: string[];
}
