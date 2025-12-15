export interface Participant {
  _id: string;
  displayName: string;
  avtUrl?: string | null;
  joinedAt: string;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avtUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
  avtUrl: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  senderId: String;
  senderName: string;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imgUrl?: string | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwner?: boolean;
}
