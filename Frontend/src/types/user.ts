export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avtUrl?: string;
  bgUrl?: string;
  bio?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Profile {
  user: User;
  isFriend?: boolean;
  sentRequest?: string;
  receivedRequest?: string;
}

export interface ReceivedRequest {
  _id: string
  fromUser: User,
  toUser: User,
  createdAt: string
  updatedAt: string
}

export interface SentRequest {
  _id: string
  toUser: User,
  createdAt: string
  updatedAt: string
}