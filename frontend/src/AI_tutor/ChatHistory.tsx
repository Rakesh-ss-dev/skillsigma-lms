// frontend/src/components/AI_tutor/ChatHistory.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import API from '../api/axios';

interface ChatHistoryProps {
    lessonId: string | number;
    authToken: string | null;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ lessonId, authToken }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await API.get(
                    `/ai-conversations/?lesson=${lessonId}`,
                    {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    }
                );
                setHistory(response.data);
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [lessonId, authToken]);

    if (loading) return <div className="p-4 text-xs animate-pulse">Loading history...</div>;
    if (history.length === 0) return <div className="p-4 text-xs text-gray-400">No past sessions found.</div>;

    return (
        <div className="space-y-3 p-2">
            {history.map((session) => (
                <details key={session.id} className="group border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 list-none">
                        <div className="flex items-center gap-3">
                            <Calendar size={14} className="text-indigo-500" />
                            <span className="text-xs font-medium dark:text-gray-200">
                                {new Date(session.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                    </summary>

                    <div className="p-3 border-t dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">AI Summary</p>
                        <div className="text-sm text-gray-700 dark:text-gray-300 italic mb-4">
                            {session.summary}
                        </div>

                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Transcript</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {session.transcript.map((msg: any, i: number) => (
                                <div key={i} className="text-xs">
                                    <span className="font-bold">{msg.role === 'user' ? 'You: ' : 'AI: '}</span>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            ))}
                        </div>
                    </div>
                </details>
            ))}
        </div>
    );
};

export default ChatHistory;