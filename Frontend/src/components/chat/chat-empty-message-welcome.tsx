import { useChatStore } from '@/stores/useChatStore.ts';
import { Button } from '@/components/ui/button.tsx';

const quickActions = [
  { label: 'Xin chào', content: '👋 Xin chào!' },
  { label: 'Vui vẻ', content: '🎉 Vui vẻ!' },
  { label: 'Khỏe không?', content: '❓ Bạn khỏe không?' },
] as const;

type ChatEmptyMessageWelcomeProps = {
  friendName: string;
};

export function ChatEmptyMessageWelcome({ friendName }: ChatEmptyMessageWelcomeProps) {
  const { sendDirectMessage, sendGroupMessage, activeConversationId, activeConversation } =
    useChatStore();

  const handleSendHello = async (content: string) => {
    if (!activeConversationId || !activeConversation) return;
    if (activeConversation.type === 'group') {
      await sendGroupMessage(activeConversationId, content, []);
    } else {
      await sendDirectMessage(
        activeConversationId,
        activeConversation.participants[0]._id,
        content
      );
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center overflow-y-auto h-full px-4">
      <div className="app-empty-chat app-reveal">
        <p className="app-empty-chat__eyebrow">Cuộc trò chuyện mới</p>
        <h2 className="app-empty-chat__title">
          Gửi lời chào <span className="italic font-medium">đầu tiên.</span>
        </h2>
        <p className="app-empty-chat__subtitle">
          Bạn và <span className="font-semibold text-primary">{friendName}</span> chưa có tin nhắn
          nào. Chọn một gợi ý bên dưới hoặc nhập tin nhắn ở ô bên dưới màn hình.
        </p>

        <div className="app-empty-chat__chips app-reveal app-reveal--delay-1">
          {quickActions.map(({ label, content }) => (
            <Button
              key={content}
              variant="outline"
              size="sm"
              className="rounded-full border-primary/30 hover:bg-primary/10"
              onClick={() => handleSendHello(content)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
