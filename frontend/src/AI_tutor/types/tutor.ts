export interface Message {
    id: string;
    role: "user" | "ai";
    text: string;
    isStreaming?: boolean;
}

export interface WebSocketMessage {
    role: "ai" | "user";
    text: string;
    is_stream?: boolean;
}