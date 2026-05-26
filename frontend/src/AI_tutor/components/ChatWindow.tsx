import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTutorSocket } from "../hooks/useTutorSocket";
import { useAuth } from "../../context/AuthContext";

export const ChatWindow: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const { user } = useAuth();
    const { messages, status, sendMessage } = useTutorSocket(lessonId);
    const [input, setInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Dynamic Multi-Tenant Theme Layout Engine
    const isTSE = user?.role === "admin" || window.location.hostname.includes("tse");
    const themeColor = isTSE ? "bg-slate-900 border-indigo-500" : "bg-sky-50 border-emerald-500";
    const primaryButton = isTSE ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700";

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput("");
    };

    return (
        <div className={`flex flex-col h-[600px] w-full max-w-2xl border rounded-xl shadow-lg ${themeColor}`}>
            {/* Header displaying connection status */}
            <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
                <div>
                    <h3 className="font-bold text-gray-800">
                        {isTSE ? "TSE Technical Architect AI" : "SkillSigma Academic Mentor"}
                    </h3>
                    <p className="text-xs text-gray-500">Currently studying this lesson</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                        status === "connected" ? "bg-green-500" : status === "connecting" ? "bg-amber-500" : "bg-red-500"
                    }`} />
                    <span className="text-xs font-medium text-gray-600 capitalize">{status}</span>
                </div>
            </div>

            {/* Scrollable Message Box */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-12 text-sm">
                        Ask any questions about this lesson's content or video timeline!
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm ${
                            msg.role === "user" 
                                ? "bg-blue-600 text-white rounded-br-none" 
                                : "bg-white text-gray-800 border rounded-bl-none"
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input Form Box */}
            <form onSubmit={handleSend} className="p-3 border-t bg-white rounded-b-xl flex space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={status !== "connected"}
                    placeholder={status === "connected" ? "Ask your AI tutor..." : "Connecting to brain..."}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                    type="submit"
                    disabled={status !== "connected" || !input.trim()}
                    className={`text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${primaryButton}`}
                >
                    Send
                </button>
            </form>
        </div>
    );
};