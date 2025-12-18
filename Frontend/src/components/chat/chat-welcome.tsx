import { Heart, MessageCircle, Users } from "lucide-react";
import { Button } from "../ui/button.tsx";

export const ChatWelcome = () => {
  return (
    <>
      <div className="flex-1 overflow-scroll flex flex-col bg-background">
        {/* Welcome Section */}
        <div className="flex-1 flex items-center justify-center px-8 pb-4">
          <div className="text-center max-w-md">
            {/* Large Emoji */}
            <div className="inline-block text-6xl">
              <svg
                viewBox="0 0 32 32"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                className="w-14 mx-auto my-4 fill-primary"
              >
                <title>slack</title>
                <path d="M19.955 23.108c-1.74 0-3.151-1.411-3.151-3.151s1.411-3.151 3.151-3.151h7.889c1.74 0 3.151 1.411 3.151 3.151s-1.411 3.151-3.151 3.151v0zM19.955 24.693c1.739 0 3.149 1.41 3.149 3.149s-1.41 3.149-3.149 3.149c-1.738 0-3.148-1.408-3.149-3.146v-3.152zM23.108 12.044c0 1.74-1.411 3.151-3.151 3.151s-3.151-1.411-3.151-3.151v0-7.888c0-1.74 1.411-3.151 3.151-3.151s3.151 1.411 3.151 3.151v0zM24.693 12.044c0.001-1.738 1.41-3.147 3.148-3.147s3.148 1.41 3.148 3.149c0 1.738-1.408 3.147-3.145 3.149h-3.152zM12.044 8.893c1.736 0.005 3.142 1.413 3.142 3.15s-1.406 3.146-3.142 3.15h-7.888c-1.736-0.005-3.142-1.413-3.142-3.15s1.406-3.146 3.142-3.15h0zM12.044 7.305c-1.736-0.002-3.143-1.41-3.143-3.147 0-1.738 1.409-3.147 3.147-3.147s3.145 1.408 3.147 3.144v3.149zM8.893 19.955c0.005-1.736 1.413-3.142 3.15-3.142s3.146 1.406 3.15 3.142v7.889c-0.005 1.736-1.413 3.142-3.15 3.142s-3.146-1.406-3.15-3.142v-0zM7.305 19.955c-0.001 1.737-1.41 3.145-3.147 3.145s-3.147-1.409-3.147-3.147c0-1.738 1.408-3.146 3.145-3.147h3.149z"></path>
              </svg>
            </div>

            {/* Welcome Text */}
            <h2 className="text-3xl font-bold mb-4">Chào mừng đến với</h2>
            <p className="text-4xl font-black mb-6 text-primary">MOJI</p>

            {/* Subtitle */}
            <p className="mb-8 leading-relaxed">
              Kết nối, trò chuyện và chia sẻ những khoảnh khắc tuyệt vời với bạn
              bè và gia đình
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgb(138, 121, 171)" }}
                >
                  <MessageCircle size={18} className="text-white" />
                </div>
                <span>Nhắn tin nhanh chóng và an toàn</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgb(138, 121, 171)" }}
                >
                  <Users size={18} className="text-white" />
                </div>
                <span>Tạo nhóm và quản lý bạn bè</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgb(138, 121, 171)" }}
                >
                  <Heart size={18} className="text-white" />
                </div>
                <span>Chia sẻ cảm xúc với emoji</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 items-center justify-center">
              <Button onClick={() => {}} className="w-2xs">
                Bắt đầu trò chuyện
              </Button>
              <Button onClick={() => {}} variant="secondary" className="w-2xs">
                Thêm bạn bè
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-2 text-center text-gray-500 text-sm border-t">
          <p>Hãy chọn một đoạn hội thoại từ danh sách bên trái để bắt đầu</p>
        </div>
      </div>
    </>
  );
};
