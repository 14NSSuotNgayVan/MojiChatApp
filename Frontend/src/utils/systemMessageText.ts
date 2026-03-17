import type { LastMessage, Message, SYSTEM_TYPE } from '../types/chat.ts';
import type { User } from '../types/user.ts';

type UserMap = Record<string, User>;

/**
 * Resolve display name from the users map.
 * Falls back to a generic Vietnamese placeholder if the user is not found.
 */
const resolveName = (userId: string | undefined, users: UserMap): string => {
  if (!userId) return 'Ai đó';
  return users[userId]?.displayName ?? 'Ai đó';
};

/**
 * Build a Vietnamese display string for a system message.
 * Falls back to message.content for backward compatibility with
 * old messages that do not yet have systemType set.
 */
export const renderSystemMessage = (
  message: Pick<Message, 'systemType' | 'meta' | 'content'>,
  users: UserMap
): string => {
  const actor = resolveName(message.meta?.actorId, users);
  const target = resolveName(message.meta?.targetUserId, users);

  switch (message.systemType as SYSTEM_TYPE | undefined) {
    case 'USER_ADDED':
      return `${actor} đã thêm ${target} vào nhóm.`;
    case 'USER_LEFT':
      return `${actor} đã rời khỏi nhóm.`;
    case 'USER_REMOVED':
      return `${actor} đã xóa ${target} khỏi nhóm.`;
    case 'GROUP_CREATED':
      return `${actor} đã tạo nhóm.`;
    case 'GROUP_NAME_CHANGED':
      return `${actor} đã đổi tên nhóm thành "${message.meta?.newValue ?? ''}".`;
    case 'GROUP_AVATAR_CHANGED':
      return `${actor} đã thay đổi ảnh đại diện nhóm.`;
    case 'ADMIN_PROMOTED':
      return `${actor} đã trao quyền quản trị viên cho ${target}.`;
    case 'ADMIN_REMOVED':
      return `${actor} đã xóa quyền quản trị viên của ${target}.`;
    default:
      // Backward compatibility: old messages store plain text in content
      return message.content ?? '';
  }
};

/**
 * Shorter variant used in the conversation list sidebar preview.
 * Uses LastMessage shape which only carries systemType (no full meta IDs).
 * For the sidebar we use the same logic but with LastMessage type.
 */
export const renderLastMessagePreview = (
  lastMessage: Pick<LastMessage, 'type' | 'systemType' | 'content' | 'senderId' | 'lastMediaType'>,
  userId: string | undefined,
  users: UserMap
): string => {
  if (lastMessage.type === 'system') {
    // lastMessage does not embed full meta ObjectIds — fall back to content
    // which was kept during migration, or produce a generic label.
    return lastMessage.content || renderSystemMessageFromType(lastMessage.systemType);
  }

  const isOwn = lastMessage.senderId === userId;
  const senderName = isOwn ? 'Bạn' : users[lastMessage.senderId]?.displayName ?? '';

  if (lastMessage.type === 'text') {
    return `${senderName}: ${lastMessage.content}`;
  }

  return `${senderName} đã gửi 1 ${lastMessage.lastMediaType === 'image' ? 'ảnh' : 'video'}`;
};

/**
 * Produce a generic label for a systemType when no names are available.
 */
const renderSystemMessageFromType = (systemType: SYSTEM_TYPE | undefined): string => {
  switch (systemType) {
    case 'USER_ADDED':         return 'Đã thêm thành viên vào nhóm.';
    case 'USER_LEFT':          return 'Một thành viên đã rời nhóm.';
    case 'USER_REMOVED':       return 'Đã xóa thành viên khỏi nhóm.';
    case 'GROUP_CREATED':      return 'Nhóm đã được tạo.';
    case 'GROUP_NAME_CHANGED': return 'Tên nhóm đã được thay đổi.';
    case 'GROUP_AVATAR_CHANGED': return 'Ảnh đại diện nhóm đã được thay đổi.';
    case 'ADMIN_PROMOTED':     return 'Đã trao quyền quản trị viên.';
    case 'ADMIN_REMOVED':      return 'Đã xóa quyền quản trị viên.';
    default:                   return 'Sự kiện nhóm.';
  }
};
