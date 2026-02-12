import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Message } from "../types/chat";

export function useChatScroll(
  items: Message[],
  loadMore: () => Promise<boolean>,
  activeConversationId: string | null
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollContentRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isLoadingMoreRef = useRef<boolean>(false)
  const isAtBottomRef = useRef<boolean>(false)
  const prevScrollHeightRef = useRef(0);

  const scrollToBottom = () => {
    const scrollDiv = scrollRef.current;
    if (!scrollDiv) return;

    scrollDiv.scrollTop = scrollDiv.scrollHeight;
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  };

  //Gọi API getmessages
  const onLoadMore = async () => {
    const el = scrollRef.current;
    if (!el || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    prevScrollHeightRef.current = el.scrollHeight;
    await loadMore();
  };

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

      if (nearTop && !isLoadingMoreRef.current) onLoadMore();

      setIsAtBottom(nearBottom);
      isAtBottomRef.current = nearBottom;
    };

    scrollDiv.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollDiv.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Scroll xuống cuối đoạn chat

  const scrollToBottomIfNeeded = useCallback(() => {
    if (!items?.length) return;

    const scrollDiv = scrollRef.current;
    if (!scrollDiv) return;

    const lastMessage = items[items.length - 1];

    const shouldScroll = isAtBottomRef.current || lastMessage.isOwner;

    if (!shouldScroll) return;

    scrollDiv.scrollTop = scrollDiv.scrollHeight;

    if (lastMessage.isOwner && !isAtBottomRef.current) {
      setIsAtBottom(true);
      isAtBottomRef.current = true;
    }
  }, [items])

  useEffect(() => {

    const scrollContentDiv = scrollContentRef.current
    if (!scrollContentDiv) return

    const observer = new ResizeObserver(scrollToBottomIfNeeded)
    observer.observe(scrollContentDiv)

    return () => observer.disconnect()
  }, [activeConversationId, scrollToBottomIfNeeded])

  useLayoutEffect(() => {
    if (!isLoadingMoreRef.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const newScrollHeight = el.scrollHeight;
    const diff = newScrollHeight - prevScrollHeightRef.current;

    el.scrollTop = diff;
    isLoadingMoreRef.current = false;
  }, [activeConversationId, items?.length]);

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    scrollContentRef
  };
}
