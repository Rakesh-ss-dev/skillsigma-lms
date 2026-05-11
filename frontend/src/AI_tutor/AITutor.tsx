import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import ChatHistory from './ChatHistory';

interface Message {
    role: 'user' | 'ai';
    text: string;
}

interface AITutorProps {
    lessonId: string | number;
    authToken: string | null;
}

const AITutor: React.FC<AITutorProps> = ({ lessonId, authToken }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [input, setInput] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [view, setView] = useState<'chat' | 'history'>('chat');

    const socket = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const starterQuestions = [
        "Summarize the key points of this lesson.",
        "What are the most important terms I should know?",
        "Can you give me a real-world example of this?",
        "Quiz me on what we just covered!"
    ];
    useEffect(() => {
        if (!isOpen || !authToken) return;

        const wsUrl = `ws://localhost:8001/ws/tutor/${lessonId}?token=${authToken}`;
        socket.current = new WebSocket(wsUrl);

        socket.current.onopen = () => {
            setIsConnected(true);
        };

        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Handle Dynamic Init (Welcome + Suggestions)
            if (data.type === 'init') {
                setMessages([{ role: 'ai', text: data.text }]);
                setSuggestions(data.suggestions || []);
            }
            // Handle regular AI responses
            else if (data.text) {
                setMessages((prev) => [...prev, { role: 'ai', text: data.text }]);
                setIsTyping(false);
            }
        };

        socket.current.onclose = () => setIsConnected(false);

        return () => socket.current?.close();
    }, [lessonId, authToken, isOpen]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = (textToSend: string) => {
        if (!textToSend.trim() || !isConnected || !socket.current) return;

        setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
        setSuggestions([]); // Clear suggestions once chat starts
        setIsTyping(true);

        socket.current.send(JSON.stringify({ content: textToSend }));
        setInput("");
    };

    return (
        <div className="fixed bottom-6 right-6 z-10000 flex flex-col items-end font-sans">
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 h-[550px] bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all">

                    {/* HEADER */}
                    <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shadow-md">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setView('chat')}
                                className={`text-sm font-bold transition-all ${view === 'chat' ? 'opacity-100 border-b-2 border-white' : 'opacity-60 hover:opacity-100'}`}
                            >
                                Live Chat
                            </button>
                            <button
                                onClick={() => setView('history')}
                                className={`text-sm font-bold transition-all ${view === 'history' ? 'opacity-100 border-b-2 border-white' : 'opacity-60 hover:opacity-100'}`}
                            >
                                History
                            </button>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded-lg">
                            <Minimize2 size={20} />
                        </button>
                    </div>

                    {/* CONTENT BODY */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-900/50">
                        {view === 'chat' ? (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 && isConnected && (
                                        <div className="flex flex-col gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2">
                                            <p className="text-xs text-gray-500 font-medium px-1">Suggested Questions:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {starterQuestions.map((q, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            setInput(q);
                                                            // Directly trigger handleSend logic or just set input
                                                        }}
                                                        className="text-left text-xs bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-xl shadow-sm transition-all active:scale-95"
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${m.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-gray-800 dark:text-gray-200 border dark:border-gray-700 rounded-tl-none'
                                                }`}>
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {m.text}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}

                                    {/* DYNAMIC SUGGESTIONS */}
                                    {suggestions.length > 0 && messages.length <= 1 && (
                                        <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-bottom-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Suggested Questions</p>
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
                                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                                    className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2"
                                >
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={isConnected ? "Ask me anything..." : "Connecting..."}
                                        className="flex-1 bg-gray-100 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                            <ChatHistory lessonId={lessonId} authToken={authToken} />
                        )}
                    </div>
                </div>
            )}

            {/* TRIGGER BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-white text-gray-700 rotate-90' : 'bg-indigo-600 text-white'
                    }`}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
};

export default AITutor;