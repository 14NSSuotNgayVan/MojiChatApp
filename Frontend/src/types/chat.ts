import type { User } from "./user.ts";

export type MESSAGE_TYPE = 'text' | 'media' | 'mixed' | 'system';
export type MEDIA_TYPE = 'image' | 'video';
export interface Participant {
  _id: string;
  joinedAt: string;
}

export interface SeenBy {
  userId: string;
  lastSeenAt: Date;
  messageId: string;
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
  senderId: string;
  type: MESSAGE_TYPE;
  lastMediaType: MEDIA_TYPE;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenBy[] | [];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
  users: Record<string, User>,
}

export interface Media {
  _id: string;
  type: MEDIA_TYPE;
  url: string;
  isDeleted: boolean;
  createdAt: string;
  senderId: string;
  meta: {
    width?: number,
    height?: number,
    duration?: number,
    size?: number,
    poster?: string
  }
}

export interface Message {
  _id: string;
  type: MESSAGE_TYPE;
  conversationId: string;
  senderId: string;
  content: string | null;
  medias?: Media[];
  updatedAt?: string | null;
  createdAt: string;
  isOwner?: boolean;
}

export interface MessageGroup {
  senderId: string;
  messages: Message[];
  startTime: Date;
  endTime: Date;
  isOwner?: boolean;
}
