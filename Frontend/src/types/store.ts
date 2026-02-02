import type { Socket } from "socket.io-client";
import type {
  Conversation,
  Message,
  MessageGroup,
  Participant,
} from "./chat.ts";
import type { User } from "./user";

export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avtUrl?: string;
  avtId?: string;
  bgUrl?: string;
  bgId?: string;
}
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
  updateProfile: (payload: UpdateProfileRequest) => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export interface FileRequest { type: 'image' | 'video' | 'file', url: string }

export interface ChatState {
  isSearching: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  users: Record<string, User>,
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
  searchedConversations: Conversation[];
  reset: () => void;
  setActiveConversation: (activeConversation: Conversation | null) => void;
  getConversations: () => Promise<void>;
  getMessages: (
    conversationId: string,
    isFetchOldMessage?: boolean
  ) => Promise<boolean>;
  getDefaultGroupName: (participants: Participant[]) => string;
  getGroupMessages: (
    messages: Message[],
    timeThresholdMinutes?: number
  ) => MessageGroup[];
  sendDirectMessage: (
    conversationId: string,
    recipientId: string,
    content: string,
    media?: FileRequest[]
  ) => Promise<void>;
  sendGroupMessage: (conversationId: string, content: string, media: FileRequest[]) => Promise<void>;
  onNewMessage: (data: NewMessageResponse) => void;
  updateConversation: (data: Conversation) => void;
  onSeenMessage: (data: SeenMessageResponse) => void;
  seenMessage: () => void;
  setUser: (user: User) => void;
  searchConversations: (keyword: string) => Promise<void>;
}
interface NewMessageResponse {
  conversation: Pick<
    Conversation,
    "_id" | "lastMessageAt" | "lastMessage" | "unreadCounts"
  >;
  message: Message;
}

interface SeenMessageResponse {
  conversationId: string;
  lastSeenAt: string;
  user: User;
  messageId: string;
  unreadCounts: Record<string, number>;
}

export interface SocketState {
  socket: Socket | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
  onlineUsers: string[];
  onUpdateUser: (user: User) => void;
}
