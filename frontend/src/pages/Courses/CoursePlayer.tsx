import { useState, useEffect, useMemo } from 'react';
import { Play, FileText, Menu, ArrowLeft, CheckCircle } from 'lucide-react';
import PDFViewer from '../../components/common/PDFViewer';
import VideoPlayer from '../../components/common/VideoPlayer';
import { useNavigate } from 'react-router';

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
    const navigate = useNavigate();
    const sortedLessons = useMemo(() =>
        courseData ? [...courseData.lessons].sort((a: any, b: any) => a.order - b.order) : [],
        [courseData]
    );

    const [activeLesson, setActiveLesson] = useState(sortedLessons[0]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Track completed lesson IDs
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);

    const isAllCompleted = sortedLessons.length > 0 &&
        completedLessonIds.length === sortedLessons.length;

    useEffect(() => {
        if (courseData && courseData.lessons.length > 0) {
            setActiveLesson(sortedLessons[0]);
        }
    }, [courseData, sortedLessons]);

    // Toggle completion handler
    const toggleComplete = (id: number) => {
        setCompletedLessonIds(prev =>
            prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
        );
    };

    if (!courseData) return <div className="dark:text-white p-10">Loading...</div>;

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 font-sans text-gray-800 transition-colors">
            {/* --- HEADER --- */}
            <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0 shadow-md z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/courses')}
                        className="hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-sm font-medium truncate max-w-md">{courseData.title}</h1>
                </div>
                {isAllCompleted && (
                    <div className="hidden md:flex items-center gap-2 text-green-400 text-sm font-bold animate-pulse">
                        <CheckCircle size={16} /> Course Completed!
                    </div>
                )}
            </header>

            {/* --- MAIN LAYOUT --- */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* LEFT: CONTENT AREA */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                    {/* SHOW COMPLETION MESSAGE IF FINISHED */}
                    {isAllCompleted ? (
                        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                <CheckCircle size={48} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Congratulations!</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                                You have successfully completed all the lessons in this course. You can now return to your dashboard or explore more courses.
                            </p>
                            <button
                                onClick={() => navigate('/courses')}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105"
                            >
                                Back to My Courses
                            </button>
                        </div>
                    ) : activeLesson ? (
                        <div>
                            <ContentViewer lesson={activeLesson} />
                            <div className="max-w-5xl mx-auto p-6">
                                <div className="flex justify-between items-start mb-6 pb-6 border-b dark:border-gray-800">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeLesson.title}</h2>
                                        <div className="mt-4">
                                            <button
                                                onClick={() => toggleComplete(activeLesson.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${completedLessonIds.includes(activeLesson.id)
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                                    }`}
                                            >
                                                <CheckCircle size={16} />
                                                {completedLessonIds.includes(activeLesson.id) ? 'Lesson Completed' : 'Mark as Completed'}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSidebarOpen(!sidebarOpen)}
                                        className="lg:hidden p-2 text-gray-600 dark:text-gray-400 border dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <Menu size={20} />
                                    </button>
                                </div>

                                <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Lesson Notes</h3>
                                    <div className='border dark:border-gray-700 p-5 rounded-md bg-gray-50 dark:bg-gray-800/50'
                                        dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className='p-3 dark:text-white'>No Lessons Available</p>
                    )}
                </main>

                {/* RIGHT: SIDEBAR */}
                <aside
                    className={`
                        fixed lg:static inset-y-0 right-0 z-30 w-80 bg-white dark:bg-gray-800 border-l dark:border-gray-700 shadow-xl lg:shadow-none transform transition-all duration-300
                        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden'}
                    `}
                >
                    <div className="h-14 flex items-center justify-between px-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <span className="font-bold text-gray-700 dark:text-white">Course Content</span>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden dark:text-white">✕</button>
                    </div>

                    <div className="overflow-y-auto h-[calc(100vh-7.5rem)]">
                        <div className="bg-white dark:bg-gray-800">
                            {sortedLessons.map((lesson: any, index: number) => {
                                const isActive = activeLesson?.id === lesson.id;
                                const isDone = completedLessonIds.includes(lesson.id);
                                return (
                                    <div
                                        key={lesson.id}
                                        onClick={() => setActiveLesson(lesson)}
                                        className={`flex items-start gap-3 p-4 text-sm border-b dark:border-gray-700 cursor-pointer transition-colors 
                                            ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="mt-0.5">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-green-600"
                                                checked={isDone}
                                                onChange={() => toggleComplete(lesson.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {index + 1}. {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
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