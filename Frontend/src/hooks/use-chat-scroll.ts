import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Message } from "../types/chat";

export function useChatScroll(
  items: Message[],
  loadMore: () => Promise<boolean>,
  activeConversationId: string | null
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    scrollToBottom();
    prevScrollHeightRef.current = 0;
  }, [activeConversationId]);

  // Lắng nghe sự kiện scroll
  useEffect(() => {
    const scrollDiv = scrollRef.current;
    if (!scrollDiv) return;

    const handleScroll = () => {
      const nearTop = scrollDiv.scrollTop < 20;
      const nearBottom =
        scrollDiv.scrollHeight - scrollDiv.scrollTop - scrollDiv.clientHeight <
        50;

      if (nearTop && !isLoadingMore) onLoadMore();

      setIsAtBottom(nearBottom);
    };

    scrollDiv.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollDiv.removeEventListener("scroll", handleScroll);
    };
  }, [isLoadingMore]);

  // Scroll xuống cuối đoạn chat
  useLayoutEffect(() => {
    if (!items?.length) return;

    const scrollDiv = scrollRef.current;
    if (!scrollDiv) return;

    const lastMessage = items[items.length - 1];

    const shouldScroll = isAtBottom || lastMessage.isOwner;

    if (!shouldScroll) return;

    scrollDiv.scrollTop = scrollDiv.scrollHeight;

    if (lastMessage.isOwner && !isAtBottom) {
      setIsAtBottom(true);
    }
  }, [activeConversationId, items?.length]);

  //Gọi API getmessages
  const onLoadMore = async () => {
    const el = scrollRef.current;
    if (!el || isLoadingMore) return;

    setIsLoadingMore(true);
    prevScrollHeightRef.current = el.scrollHeight;
    await loadMore();
  };

  useLayoutEffect(() => {
    if (!isLoadingMore) return;

    const el = scrollRef.current;
    if (!el) return;

    const newScrollHeight = el.scrollHeight;
    const diff = newScrollHeight - prevScrollHeightRef.current;

    el.scrollTop = diff;
    setIsLoadingMore(false);
  }, [activeConversationId, items?.length]);

  const scrollToBottom = () => {
    const scrollDiv = scrollRef.current;
    if (!scrollDiv) return;

    scrollDiv.scrollTop = scrollDiv.scrollHeight;
    setIsAtBottom(true);
  };

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
  };
}
