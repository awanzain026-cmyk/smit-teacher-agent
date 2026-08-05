"use client";

import { useRouter } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";

export default function NewChatPage() {
  const router = useRouter();

  return (
    <ChatView
      onConversationCreated={(id) => {
        if (id) router.replace(`/chat/${id}`);
      }}
    />
  );
}
