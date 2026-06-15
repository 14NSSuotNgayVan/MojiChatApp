import { useChatStore } from '@/stores/useChatStore.ts';
import { Button } from '@/components/ui/button.tsx';
import { MessageCircleHeart } from 'lucide-react';

const quickActions = [
  { label: '👋 Xin chào!', content: '👋 Xin chào!' },
  { label: '🎉 Vui vẻ!', content: '🎉 Vui vẻ!' },
  { label: '❓ Bạn khỏe không?', content: '❓ Bạn khỏe không?' },
] as const;

export const ChatEmptyMessageWelcome = ({ friendName }: { friendName: string }) => {
  const { sendDirectMessage, activeConversationId, activeConversation } = useChatStore();

  const handleSendHello = async (content: string) => {
    if (!activeConversationId || !activeConversation) return;
    await sendDirectMessage(activeConversationId, activeConversation?.participants[0]._id, content);
  };

  return (
    <div className="flex-1 justify-center overflow-y-auto h-full">
      <div className="text-center max-w-md lg:max-w-lg mx-auto p-8">
        <div className="mb-6 flex justify-center">
          <MessageCircleHeart size="6rem" className="text-primary" />
        </div>

        <h3 className="text-3xl font-bold text-foreground mb-3">Bắt đầu cuộc trò chuyện</h3>

        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          Bạn và <span className="font-semibold text-primary">{friendName}</span> chưa có tin nhắn
          nào. Hãy gửi lời chào đầu tiên!
        </p>

        <div className="space-y-3 mb-8">
          <p className="text-muted-foreground text-sm font-medium">Thao tác nhanh</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickActions.map(({ label, content }) => (
              <Button
                key={content}
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => handleSendHello(content)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px border-b"></div>
          <span className="text-muted-foreground text-sm">hoặc</span>
          <div className="flex-1 h-px border-b"></div>
        </div>

        <p className="text-muted-foreground text-sm">
          Bạn có thể chia sẻ ảnh, emoji, sticker và nhiều nội dung khác. Bắt đầu bằng cách nhập tin
          nhắn bên dưới!
        </p>
      </div>
    </div>
  );
};
