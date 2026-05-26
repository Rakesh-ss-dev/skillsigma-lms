import React, { useState, useEffect } from 'react';
import { Calendar, MessageSquare, ChevronRight, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import API from '../api/axios';

interface TranscriptItem {
    role: 'user' | 'ai';
    text: string;
}

interface Conversation {
    id: number;
    summary: string;
    transcript: TranscriptItem[];
    created_at: string;
}

interface ChatHistoryProps {
    lessonId: string | number;
    authToken: string | null;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ lessonId, authToken }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!authToken) return;
            try {
                setIsLoading(true);
                // Fetch previous sessions filtered by the current lesson ID
                const response = await API.get(`/ai-conversations/?lesson=${lessonId}`);
                // Ensure data maps to array regardless of paginated shapes
                const data = Array.isArray(response.data) ? response.data : response.data.results || [];
                setConversations(data);
            } catch (err) {
                console.error("Failed to load AI conversation history:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [lessonId, authToken]);

    // Format ISO string to local human-readable date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Loading your history...</p>
            </div>
        );
    }

    // Detail View: Viewing a single selected historic chat transcript
    if (selectedChat) {
        return (
            <div className="flex flex-col h-full animate-in fade-in duration-200">
                <div className="p-2 border-b dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800 flex items-center gap-2">
                    <button 
                        onClick={() => setSelectedChat(null)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">
                        {selectedChat.summary || "Past Discussion"}
                    </span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[430px]">
                    {selectedChat.transcript.map((m, index) => (
                        <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                m.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-800 dark:text-gray-200 border dark:border-gray-700 rounded-tl-none'
                            }`}>
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {m.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // List View: Showing previous chat sessions
    return (
        <div className="p-4 space-y-3 h-full overflow-y-auto max-h-[480px] animate-in fade-in duration-200">
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center space-y-2">
                    <MessageSquare size={32} className="text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">No previous sessions found for this lesson.</p>
                </div>
            ) : (
                conversations.map((chat) => (
                    <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className="w-full text-left p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl shadow-sm transition-all flex items-center justify-between group active:scale-[0.99]"
                    >
                        <div className="space-y-1 max-w-[85%]">
                            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {chat.summary || "Lesson Discussion"}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                <Calendar size={12} />
                                <span>{formatDate(chat.created_at)}</span>
                                <span>•</span>
                                <span>{chat.transcript?.length || 0} messages</span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                ))
            )}
        </div>
    );
};

export default ChatHistory;