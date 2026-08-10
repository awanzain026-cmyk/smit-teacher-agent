"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const router = useRouter();
  const { conversationId } = use(params);

  return (
    <ChatView
      conversationId={conversationId}
      onConversationCreated={(id) => {
        if (id && id !== conversationId) router.replace(`/chat/${id}`);
      }}
    />
  );
}
