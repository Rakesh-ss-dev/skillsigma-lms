import { useState, useEffect } from 'react';
import { Play, FileText, Menu, Download } from 'lucide-react';
import PDFViewer from '../../components/common/PDFViewer';
import VideoPlayer from '../../components/common/VideoPlayer';

// --- REFRACTORED CONTENT VIEWER ---
const ContentViewer = ({ lesson }: any) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const hasVideo = !!lesson.video_url;
    const hasPdf = !!lesson.pdf_version;

    // Default to video if available, otherwise pdf.
    // We use a state to toggle, but we use an Effect to reset this when the lesson changes.
    const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video');

    useEffect(() => {
        if (hasVideo) {
            setActiveTab('video');
        } else if (hasPdf) {
            setActiveTab('pdf');
        }
    }, [lesson, hasVideo, hasPdf]);

    // Helper to render the actual media
    const renderContent = () => {
        if (activeTab === 'video' && hasVideo) {
            return (
                <div className="aspect-video w-full flex items-center justify-center bg-black">
                    <VideoPlayer streamUrl={`${apiUrl}/lessons/${lesson.id}/stream/`} />
                </div>
            );
        }

        if (activeTab === 'pdf' && hasPdf) {
            return (
                <div className="bg-white dark:bg-gray-800 aspect-video w-full flex flex-col items-center justify-center border-b h-[500px]">
                    <PDFViewer pdfUrl={lesson.pdf_version} />
                </div>
            );
        }

        // Fallback if the active tab is somehow invalid or neither exists
        return (
            <div className="p-8 bg-white dark:bg-gray-800 min-h-[400px] flex items-center justify-center text-gray-500 border-b">
                <div className="text-center">
                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Read the notes below</p>
                </div>
            </div>
        );
    };

    // 1. Scenario: Both Video and PDF exist -> Show Tabs
    if (hasVideo && hasPdf) {
        return (
            <div className="flex flex-col w-full">
                {/* Tab Navigation */}
                <div className="flex border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('video')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'video'
                                ? 'border-b-2 border-blue-600 text-blue-600 bg-white dark:bg-gray-800 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Play size={16} /> Video Lesson
                    </button>
                    <button
                        onClick={() => setActiveTab('pdf')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'pdf'
                                ? 'border-b-2 border-blue-600 text-blue-600 bg-white dark:bg-gray-800 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <FileText size={16} /> PDF Reference
                    </button>
                </div>

                {/* Content Area */}
                {renderContent()}
            </div>
        );
    }

    // 2. Scenario: Only Video OR Only PDF OR Neither -> Render directly (no tabs)
    return renderContent();
};

// --- MAIN COMPONENT (Unchanged mostly, just ensure props are passed) ---
export default function CoursePlayer({ courseData }: any) {
    // Sort lessons by order before setting state
    const sortedLessons = courseData ? [...courseData.lessons].sort((a: any, b: any) => a.order - b.order) : [];
    const [activeLesson, setActiveLesson] = useState(sortedLessons[0]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Auto-select first lesson if data changes
    useEffect(() => {
        if (courseData && courseData.lessons.length > 0) {
            setActiveLesson(sortedLessons[0]);
        }
    }, [courseData]);

    if (!courseData) return <div>Loading...</div>;

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-800 font-sans text-gray-800">

            {/* --- HEADER --- */}
            <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0 shadow-md z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-sm font-medium truncate max-w-md">{courseData.title}</h1>
                </div>
            </header>

            {/* --- MAIN LAYOUT --- */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* LEFT: CONTENT AREA */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                    {activeLesson ?
                        <div>
                            {/* The Player / Viewer */}
                            <ContentViewer lesson={activeLesson} />

                            {/* Lesson Details & Navigation */}
                            <div className="max-w-5xl mx-auto p-6">
                                {/* Title Row */}
                                <div className="flex justify-between items-start mb-6 pb-6 border-b">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeLesson.title}</h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            {activeLesson.resources && (
                                                <a href={activeLesson.resources} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                                                    <Download size={14} /> Download Resource
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Sidebar Toggle */}
                                    <button
                                        onClick={() => setSidebarOpen(!sidebarOpen)}
                                        className="lg:hidden p-2 text-gray-600 border rounded hover:bg-gray-50"
                                    >
                                        <Menu size={20} />
                                    </button>
                                </div>


                                {/* HTML Content Render */}
                                <div className="prose max-w-none text-gray-700 dark:text-white">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Lesson Notes</h3>
                                    {/* Dangerously Set Inner HTML for the "content" field */}
                                    <div className='border p-5 rounded-md' dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                                </div>
                            </div>
                        </div> : <p className='p-3'>No Lessons Available</p>}
                </main>

                {/* RIGHT: SIDEBAR (Curriculum) */}
                <aside
                    className={`
            fixed lg:static inset-y-0 right-0 z-20 w-80 bg-white dark:bg-gray-800 border-l shadow-xl lg:shadow-none transform transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden'}
          `}
                >
                    {/* Sidebar Header */}
                    <div className="h-14 flex items-center bg-white dark:bg-gray-800 justify-between px-4 border-b bg-gray-50">
                        <span className="font-bold text-gray-700 dark:text-white">Course Content</span>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden">✕</button>
                    </div>

                    {/* Section Wrapper */}
                    <div className="overflow-y-auto h-[calc(100vh-7rem)]">
                        {/* Lesson List */}
                        <div className="bg-white dark:bg-gray-900">
                            {sortedLessons.map((lesson: any, index: number) => {
                                const isActive = activeLesson.id === lesson.id;
                                return (
                                    <div
                                        key={lesson.id}
                                        onClick={() => setActiveLesson(lesson)}
                                        className={`flex items-start gap-3 p-3 text-sm border-b cursor-pointer hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 dark:bg-gray-900 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="mt-0.5 text-gray-400 dark:text-white">
                                            <input type="checkbox" className="accent-black" readOnly />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium ${isActive ? 'text-black dark:text-white' : 'text-gray-600 dark:text-white-500'}`}>
                                                {index + 1}. {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                                {lesson.video_url ? <Play size={12} /> : <FileText size={12} />}
                                                <span>{lesson.video_url ? "Video" : "Reading"}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}