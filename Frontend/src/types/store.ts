import type { Socket } from "socket.io-client";
import type {
  Conversation,
  Media,
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

export interface MediaRecord {
  items: Media[];
  nextCursor?: {
    _id: string,
    createdAt: string
  };
  prevCursor?: {
    _id: string,
    createdAt: string
  };
  newestMediaId?: string;
}

export interface ChatState {
  isSearching: boolean;
  hiddenConversations: Conversation[];
  hiddenLoading: boolean;
  sidebarTab: 'inbox' | 'hidden';
  setSidebarTab: (tab: 'inbox' | 'hidden') => void;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  replyingTo: Message | null;
  users: Record<string, User>,
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean;
      nextCursor?: string | null;
    }
  >;
  medias: Record<
    string,
    MediaRecord
  >;
  setMedia: (id: string, setFunc: (media: MediaRecord | undefined) => MediaRecord) => void;
  activeConversationId: string | null;
  isFetchOldMessage: boolean;
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
    media?: FileRequest[],
    replyToId?: string
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    media: FileRequest[],
    replyToId?: string
  ) => Promise<void>;
  onNewMessage: (data: NewMessageResponse) => void;
  updateConversation: (data: Conversation) => void;
  onSeenMessage: (data: SeenMessageResponse) => void;
  seenMessage: () => void;
  setUser: (user: User) => void;
  searchConversations: (keyword: string) => Promise<void>;
  getHiddenConversations: () => Promise<void>;
  unhideConversation: (conversationId: string) => Promise<void>;
  updateGroupProfile: (conversationId: string, payload: { name?: string; avtUrl?: string }) => Promise<void>;

  addParticipant: (conversationId: string, participantId: string) => Promise<void>;
  removeParticipant: (conversationId: string, participantId: string) => Promise<void>;
  updateParticipantRole: (conversationId: string, participantId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  hideConversation: (conversationId: string) => Promise<void>;
  clearDirectConversation: (conversationId: string) => Promise<void>;
  deleteGroupConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  onConversationDeleted: (data: { conversationId: string }) => void;
  onParticipantAdded: (data: ParticipantAddedEvent) => void;
  onParticipantRemoved: (data: ParticipantRemovedEvent) => void;
  onParticipantRoleUpdated: (data: ParticipantRoleUpdatedEvent) => void;
  onParticipantLeft: (data: ParticipantLeftEvent) => void;
  onGroupProfileUpdated: (data: GroupProfileUpdatedEvent) => void;
  setReplyingTo: (message: Message | null) => void;
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

interface ParticipantAddedEvent {
  conversationId: string;
  participant: {
    _id: string;
    role: 'ADMIN' | 'MEMBER';
    status: 'ACTIVE' | 'LEFT';
    addedBy?: string;
    joinedAt?: string | Date;
  };
  userInfo?: User;
  systemMessage?: Message;
}

interface ParticipantRemovedEvent {
  conversationId: string;
  participantId: string;
  systemMessage?: Message;
}

interface ParticipantRoleUpdatedEvent {
  conversationId: string;
  participantId: string;
  newRole: 'ADMIN' | 'MEMBER';
  systemMessage?: Message;
}

interface ParticipantLeftEvent {
  conversationId: string;
  participantId: string;
  systemMessage?: Message;
}

interface GroupProfileUpdatedEvent {
  conversationId: string;
  group?: {
    name?: string;
    avtUrl?: string;
  };
  systemMessages?: Message[];
}
