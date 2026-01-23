import React, { useState, useEffect, useMemo } from 'react';
import { Play, FileText } from 'lucide-react'; // Ensure you have lucide-react installed or use alternatives
import { ContentItem } from '../util/types';
import PDFViewer from '../common/PDFViewer';
import VideoPlayer from '../common/VideoPlayer';

interface ContentPlayerProps {
    lesson: ContentItem;
    onComplete: () => void;
}

export const ContentPlayer: React.FC<ContentPlayerProps> = ({ lesson, onComplete }) => {
    const apiUrl = import.meta.env.VITE_API_URL;

    // 1. Determine availability
    const hasVideo = !!lesson.video_url;
    const hasPdf = !!lesson.pdf_version;

    // 2. State for Active Tab
    const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video');

    // 3. Reset tab when lesson changes
    const playerUrl = useMemo(() => {
        if (!lesson.video_url) return '';
        const isGoogleDrive = lesson.video_url.includes('drive.google.com');
        if (isGoogleDrive) {
            return `${apiUrl}/lessons/${lesson.id}/stream/`;
        }
        return lesson.video_url;
    }, [lesson, apiUrl]);
    useEffect(() => {
        if (hasVideo) {
            setActiveTab('video');
        } else if (hasPdf) {
            setActiveTab('pdf');
        }
    }, [lesson, hasVideo, hasPdf]);

    // 4. Helper to render the media content
    const renderMedia = () => {
        // Render Video
        if (activeTab === 'video' && hasVideo) {
            return (
                <div className="bg-black w-full aspect-video flex items-center justify-center relative shadow-md">
                    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                        <VideoPlayer streamUrl={playerUrl} />
                    </div>
                </div>
            );
        }

        // Render PDF
        if (activeTab === 'pdf' && hasPdf) {
            return (
                <div className="w-full bg-gray-100 border-b h-[600px] flex flex-col">
                    <PDFViewer pdfUrl={lesson.pdf_version} />
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex flex-col h-full bg-white">

            {/* --- TAB NAVIGATION (Only show if BOTH exist) --- */}
            {hasVideo && hasPdf && (
                <div className="flex border-b bg-gray-50">
                    <button
                        onClick={() => setActiveTab('video')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'video'
                            ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <Play size={16} /> Video Lesson
                    </button>
                    <button
                        onClick={() => setActiveTab('pdf')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'pdf'
                            ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <FileText size={16} /> PDF Reference
                    </button>
                </div>
            )}

            {/* --- MEDIA VIEWER AREA --- */}
            {renderMedia()}

            {/* --- CONTENT INFO AREA --- */}
            <div className="p-6 md:p-8 flex-1">
                <h1 className="text-2xl font-bold mb-6 text-gray-900">{lesson.title}</h1>

                <div className="flex flex-wrap items-center gap-4 mb-8">
                    <button
                        onClick={onComplete}
                        disabled={lesson.completed}
                        className={`px-6 py-2.5 rounded font-semibold transition-all shadow-sm ${lesson.completed
                            ? 'bg-green-100 text-green-700 cursor-default border border-green-200'
                            : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md'
                            }`}
                    >
                        {lesson.completed ? '✓ Completed' : 'Mark as Complete'}
                    </button>
                </div>

                {/* Render HTML Content safely */}
                <div className="prose max-w-none">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Lesson Content</h3>
                    <div
                        className="text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: lesson.content || "<p>No additional text content.</p>" }}
                    />
                </div>
            </div>
        </div>
    );
};