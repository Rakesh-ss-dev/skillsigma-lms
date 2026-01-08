import React from 'react';
import { ContentItem } from '../util/types';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';
import PDFViewer from '../common/PDFViewer';
interface VideoPlayerProps {
    lesson: ContentItem;
    onComplete: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ lesson, onComplete }) => {
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Video Container */}

            {lesson.video_url && (
                <div className="bg-black w-full aspect-video flex items-center justify-center relative shadow-md">
                    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                        {/* The Player Container */}
                        <MediaPlayer
                            className="[--media-font-family:'Outfit',sans-serif]"
                            src={lesson.video_url}
                            viewType="video"
                            streamType="on-demand"
                            logLevel="warn"
                            crossOrigin
                            playsInline
                            title="Course Content" // You can pass dynamic titles here
                            aspectRatio="16/9"

                        >
                            {/* The Provider handles loading YouTube/Vimeo internally */}
                            <MediaProvider className='font-default' />

                            {/* The Layout handles the UI (Buttons, Sliders, Speed, Quality) */}
                            {/* This completely replaces the YouTube/Vimeo native controls */}
                            <DefaultVideoLayout
                                icons={defaultLayoutIcons}

                                // You can customize which buttons appear here:
                                slots={{
                                    // Removing these slots would hide them, but default is usually good
                                }}
                            />
                        </MediaPlayer>
                    </div>
                </div>
            )}


            {lesson.pdf_version && <PDFViewer pdfUrl={lesson.pdf_version} />}
            {/* Content Info Area */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
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

                {/* Updated: Render HTML Content safely */}
                <div className="prose max-w-none">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Lesson Content</h3>

                    {/* Be careful with dangerouslySetInnerHTML. Ensure your API sanitizes input. */}
                    <div
                        className="text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: lesson.content || "" }}
                    />
                </div>
            </div>
        </div>
    );
};