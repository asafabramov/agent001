import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProtectedRoute } from "@/components/providers/auth-provider";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <ChatInterface />
    </ProtectedRoute>
  );
}