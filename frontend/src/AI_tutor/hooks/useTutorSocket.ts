import { useEffect, useRef, useState, useCallback } from "react";
import { Message, WebSocketMessage } from "../types/tutor";
import { useAuth } from "../../context/AuthContext";

export const useTutorSocket = (lessonId: string | undefined) => {
    const { refreshAccessToken } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
    const socketRef = useRef<WebSocket | null>(null);

    const connect = useCallback(async () => {
        if (!lessonId) return;

        setStatus("connecting");
        
        // 1. Force a token refresh check right before opening the socket connection
        const currentToken = await refreshAccessToken();
        if (!currentToken) {
            setStatus("disconnected");
            return;
        }

        // Convert HTTP URL to WS URL dynamically
        const backendBase = import.meta.env.VITE_API_URL.replace(/^http/, "ws");
        const wsUrl = `${backendBase}/ws/tutor/${lessonId}?token=${currentToken}`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            setStatus("connected");
            console.log("🚀 Connected to AI Tutor Socket");
        };

        ws.onmessage = (event) => {
            const data: WebSocketMessage = JSON.parse(event.data);
            
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];

                // If the incoming message is a stream chunk and the last message was also from the AI
                if (data.is_stream && lastMsg && lastMsg.role === "ai" && lastMsg.isStreaming) {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, text: lastMsg.text + data.text } // Append text chunk
                    ];
                } else {
                    // Start a brand new message bubble
                    return [
                        ...prev,
                        {
                            id: crypto.randomUUID(),
                            role: data.role,
                            text: data.text,
                            isStreaming: data.is_stream
                        }
                    ];
                }
            });
        };

        ws.onclose = () => {
            setStatus("disconnected");
            console.log("🔌 Disconnected from AI Tutor Socket");
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
            setStatus("disconnected");
        };
    }, [lessonId, refreshAccessToken]);

    const sendMessage = (text: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            // Optimistically append user message to local state
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "user", text }
            ]);

            socketRef.current.send(JSON.stringify({ content: text }));
        }
    };

    useEffect(() => {
        connect();
        return () => {
            socketRef.current?.close();
        };
    }, [connect]);

    return { messages, status, sendMessage };
};