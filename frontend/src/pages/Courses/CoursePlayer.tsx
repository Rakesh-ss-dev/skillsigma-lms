import { useState, useEffect } from 'react';
import { Play, FileText, Menu, Download } from 'lucide-react';
import PDFViewer from '../../components/common/PDFViewer';
import VideoPlayer from '../../components/common/VideoPlayer';
// Use this component to render the specific content type
const ContentViewer = ({ lesson }: any) => {
    // 1. If Video exists, show video player
    if (lesson.video_url) {
        return (
            <div className="aspect-video w-full flex items-center justify-center">
                {/* Replace with your actual Video Player component (e.g., ReactPlayer) */}
                <VideoPlayer url={lesson.video_url} />
            </div>
        );
    }

    // 2. If PDF exists, show PDF Viewer (using iframe for simplicity)
    if (lesson.pdf_version) {
        return (
            <div className="bg-white dark:bg-gray-800 aspect-video w-full flex flex-col items-center justify-center border-b">
                <PDFViewer pdfUrl={lesson.pdf_version} />
            </div>
        );
    }

    // 3. Fallback: Show the HTML content directly
    return (
        <div className="p-8 bg-white dark:bg-gray-800 min-h-[400px] flex items-center justify-center text-gray-500 border-b">
            <div className="text-center">
                <FileText size={48} className="mx-auto mb-2 opacity-20" />
                <p>Read the content below</p>
            </div>
        </div>
    );
};

export default function CoursePlayer({ courseData }: any) {
    // Sort lessons by order before setting state
    const sortedLessons = [...courseData.lessons].sort((a, b) => a.order - b.order);
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
                            < ContentViewer lesson={activeLesson} />

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
                                    <div className='border p-5' dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
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

                    {/* Section Wrapper (Since API is flat, we create a fake 'Module 1') */}
                    <div className="overflow-y-auto h-[calc(100vh-7rem)]">
                        {/* Lesson List */}
                        <div className="bg-white dark:bg-gray-900">
                            {sortedLessons.map((lesson, index) => {
                                const isActive = activeLesson.id === lesson.id;
                                return (
                                    <div
                                        key={lesson.id}
                                        onClick={() => setActiveLesson(lesson)}
                                        className={`flex items-start gap-3 p-3 text-sm border-b cursor-pointer hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 dark:bg-gray-900 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="mt-0.5 text-gray-400 dark:text-white">
                                            {/* Use checkbox for visual cue, technically logic should check user progress */}
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