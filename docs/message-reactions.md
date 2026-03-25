# Message Reactions Test Checklist

## Direct chat (direct)
1. User A mở cuộc trò chuyện với User B.
2. User B gửi một tin nhắn text.
3. Khi hover vào tin nhắn, User A thấy nút `bày tỏ cảm xúc`.
4. User A bấm `😂`:
   - Tin nhắn hiển thị `😂 x1`.
5. User A bấm lại `😂`:
   - Reaction `😂` biến mất.
6. User A bấm `❤️`:
   - `❤️ x1` hiển thị, `😂` biến mất (rule `single_toggle`).

## Group chat (group)
1. User A (ADMIN hoặc MEMBER ACTIVE) mở nhóm có User C.
2. User C gửi tin nhắn text trong nhóm.
3. User A thả reaction và toggle như checklist direct ở trên.
4. Đảm bảo các thành viên khác trong nhóm nhìn thấy realtime ngay sau khi toggle.

## Realtime sync / Socket
1. Mở 2 tab hoặc 2 user khác nhau cùng một conversation.
2. Toggle reaction ở tab A:
   - Tab B hiển thị reaction update ngay (không cần reload).

## Edge cases
1. Với tin nhắn `system`:
   - Không hiển thị reaction UI.
2. Toggle reaction khi tin nhắn có media:
   - Reaction vẫn hiển thị và toggle hoạt động.
3. Khi đang tìm kiếm tin nhắn trong conversation:
   - Toggle reaction trên message xuất hiện trong kết quả search vẫn cập nhật hiển thị.

## Failure cases
1. Gửi request toggle reaction với `messageId` không thuộc conversation:
   - Backend trả 404/403, UI không crash.

