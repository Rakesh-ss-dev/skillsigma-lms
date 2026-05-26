import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Minimize2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import ChatHistory from "./ChatHistory";
import { useAuth } from "../context/AuthContext";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  isStreaming?: boolean;
}

interface AITutorProps {
  lessonId: string | number;
}

const AITutor: React.FC<AITutorProps> = ({ lessonId }) => {
  const isConnectingRef = useRef<boolean>(false);
  const { access, refreshAccessToken } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [view, setView] = useState<"chat" | "history">("chat");

  const socket = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const starterQuestions = [
    "Summarize the key points of this lesson.",
    "What are the most important terms I should know?",
    "Can you give me a real-world example of this?",
    "Quiz me on what we just covered!",
  ];

  // 1. Clean connection hook execution wrapper
  const connectWebSocket = useCallback(async () => {
    if (!isOpen) return;
    if (isConnectingRef.current || socket.current) return;

    try {
      isConnectingRef.current = true;
      setStatus("connecting");

      // Silently acquire fresh access token keys without triggering reactive component state chains
      const freshToken = await refreshAccessToken();
      if (!freshToken) {
        setStatus("disconnected");
        isConnectingRef.current = false;
        return;
      }

      const wsUrl = `ws://localhost:8001/ws/tutor/${lessonId}?token=${freshToken}`;
      const ws = new WebSocket(wsUrl);
      socket.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        isConnectingRef.current = false; // Successfully handshaked
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Init message sequence
        if (data.type === "init") {
          setMessages([
            {
              id: crypto.randomUUID(),
              role: "ai",
              text: data.text,
              isStreaming: false,
            },
          ]);
          setSuggestions(data.suggestions || []);
          return;
        }

        // Live stream character delta accumulation loop
        if (data.text) {
          setIsTyping(false);

          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];

            if (
              data.is_stream &&
              lastMsg &&
              lastMsg.role === "ai" &&
              lastMsg.isStreaming
            ) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, text: lastMsg.text + data.text },
              ];
            } else {
              return [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "ai",
                  text: data.text,
                  isStreaming: data.is_stream,
                },
              ];
            }
          });
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        setIsTyping(false);
        isConnectingRef.current = false;
        socket.current = null;
      };

      ws.onerror = () => {
        setStatus("disconnected");
        setIsTyping(false);
        isConnectingRef.current = false;
        socket.current = null;
      };
    } catch (err) {
      console.error("WebSocket bootstrap cycle failed:", err);
      setStatus("disconnected");
      isConnectingRef.current = false;
      socket.current = null;
    }
  }, [lessonId, refreshAccessToken, isOpen]);

  // 2. Clear life-cycle hook management: Mount and dismount triggers exclusively based on opening state
  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      // Safely sever connection channels when user drops widget panels
      socket.current?.close();
      socket.current = null;
      setStatus("disconnected");
      isConnectingRef.current = false;
    }

    return () => {
      if (!isOpen) {
        socket.current?.close();
        socket.current = null;
      }
    };
  }, [isOpen, connectWebSocket]);

  // Pin text viewport layouts downward smoothly
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    let isMounted = true;

    const handleLessonTransition = async () => {
      if (socket.current) {
        console.log("Saving current conversation transcript to backend...");

        // 1. Close the socket cleanly. This signals FastAPI's 'finally' block
        // to POST the transcript to your Django database.
        socket.current.close(1000, "Switching Lesson Context");
        socket.current = null;

        // 2. Give the network/backend a tiny 200ms window to wrap up the save
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // 3. Ensure the user hasn't navigate away entirely before updating state
      if (!isMounted) return;

      // 4. Now safely wipe clean the chat interface for the incoming lesson
      setMessages([]);
      setSuggestions([]);
      setInput("");
      setIsTyping(false);
      setStatus("disconnected");
      isConnectingRef.current = false;

      // 5. If the widget pane is open, instantly spin up the new lesson context
      if (isOpen) {
        connectWebSocket();
      }
    };

    handleLessonTransition();

    return () => {
      isMounted = false;
    };
  }, [lessonId]); // Monitored clean transition loop

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim() || status !== "connected" || !socket.current) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: textToSend },
    ]);
    setSuggestions([]);
    setIsTyping(true);

    socket.current.send(JSON.stringify({ content: textToSend }));
    setInput("");
  };

  const isConnected = status === "connected";

  return (
    <div className="fixed bottom-6 right-6 z-10000 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[550px] bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all">
          {/* HEADER */}
          <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shadow-md">
            <div className="flex gap-4">
              <button
                onClick={() => setView("chat")}
                className={`text-sm font-bold transition-all ${view === "chat" ? "opacity-100 border-b-2 border-white" : "opacity-60 hover:opacity-100"}`}
              >
                Live Chat
              </button>
              <button
                onClick={() => setView("history")}
                className={`text-sm font-bold transition-all ${view === "history" ? "opacity-100 border-b-2 border-white" : "opacity-60 hover:opacity-100"}`}
              >
                History
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "connected"
                    ? "bg-green-400"
                    : status === "connecting"
                      ? "bg-amber-400"
                      : "bg-red-400"
                }`}
                title={`Status: ${status}`}
              />
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-indigo-500 p-1 rounded-lg transition-colors"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>

          {/* CONTENT BODY */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-900/50">
            {view === "chat" ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && isConnected && (
                    <div className="flex flex-col gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-xs text-gray-500 font-medium px-1">
                        Suggested Questions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {starterQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(q)}
                            className="text-left text-xs bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-xl shadow-sm transition-all active:scale-95"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-white dark:bg-gray-800 dark:text-gray-200 border dark:border-gray-700 rounded-tl-none"
                        }`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}

                  {/* DYNAMIC BACKEND SUGGESTIONS */}
                  {suggestions.length > 0 && messages.length <= 1 && (
                    <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                        Suggested Questions
                      </p>
                      {suggestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          className="text-left text-xs bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all shadow-sm"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>

                {/* INPUT AREA */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      status === "connected"
                        ? "Ask me anything..."
                        : status === "connecting"
                          ? "Connecting..."
                          : "Disconnected"
                    }
                    disabled={status !== "connected"}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !input.trim()}
                    className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            ) : (
              <ChatHistory lessonId={lessonId} authToken={access} />
            )}
          </div>
        </div>
      )}

      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? "bg-white text-gray-700 rotate-90" : "bg-indigo-600 text-white"}`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default AITutor;
