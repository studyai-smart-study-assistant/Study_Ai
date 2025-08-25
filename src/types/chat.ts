
export interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  type: "user" | "group";
  name: string;
  lastMessage?: string;
  timestamp?: number;
  partnerId?: string;
  messages?: ChatMessage[];
}
