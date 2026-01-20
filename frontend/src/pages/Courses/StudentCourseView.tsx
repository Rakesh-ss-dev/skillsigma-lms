import { useEffect, useState } from 'react';
import { Menu, X, Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import API from '../../api/axios';

// Imports from the files above
import { UIState, ContentItem } from '../../components/util/types';
import { mapApiToUI } from '../../components/util/courseMapper';

// Component Imports
import { ContentPlayer } from '../../components/course/ContentPlayer';
import { CurriculumSidebar } from '../../components/course/CurriculumSidebar';
import { ProgressBar } from '../../components/course/ProgressBar';
import QuizPlayer from '../../components/course/QuizPlayer';

export default function CoursePlayer() {
    const [courseData, setCourseData] = useState<UIState | null>(null);
    const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isFinished, setIsFinished] = useState(false);

    const navigate = useNavigate();
    const { courseId } = useParams();

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await API.get(`/courses/${courseId}/`);
                const uiData = mapApiToUI(res.data);
                setCourseData(uiData);

                if (uiData.curriculum && uiData.curriculum.length > 0) {
                    // Start where the user left off
                    const firstUnfinishedItem = uiData.curriculum.find(item => !item.completed);
                    if (firstUnfinishedItem) {
                        setActiveItem(firstUnfinishedItem);
                    } else {
                        // If everything is done, show the finish screen immediately or default to first item
                        setIsFinished(true);
                        setActiveItem(uiData.curriculum[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to load course", error);
            }
        }

        if (courseId) fetchData();
    }, [courseId]);

    const handleItemClick = (item: ContentItem) => {
        setIsFinished(false); // If they click a specific item, hide completion screen
        setActiveItem(item);
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const handleCompletion = async (itemId: number) => {
        if (!courseData) return;

        const currentIndex = courseData.curriculum.findIndex(i => i.id === itemId);
        const isLastItem = currentIndex === courseData.curriculum.length - 1;

        // 1. Calculate updated curriculum state
        const updatedCurriculum = courseData.curriculum.map((item, index) => {
            if (item.id === itemId) return { ...item, completed: true };
            if (index === currentIndex + 1) return { ...item, locked: false };
            return item;
        });

        // 2. Update Progress Percentage
        const completedCount = updatedCurriculum.filter(i => i.completed).length;
        const newProgress = Math.round((completedCount / updatedCurriculum.length) * 100);

        setCourseData({
            ...courseData,
            progress: newProgress,
            curriculum: updatedCurriculum
        });

        // 3. Handle Navigation or Finish
        if (isLastItem) {
            setIsFinished(true);
        } else {
            setActiveItem(updatedCurriculum[currentIndex + 1]);
        }

        // Optional: Update progress in backend
        try {
            await API.post(`/courses/${courseId}/progress/`, {
                item_id: itemId,
                completed: true
            });
        } catch (e) {
            console.error("Failed to sync progress", e);
        }
    };

    // --- Loading Guard ---
    if (!courseData || !activeItem) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading course content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-white dark:bg-gray-950 overflow-hidden">

            {/* MAIN CONTENT AREA */}
            <main className={`flex-1 flex flex-col h-full transition-all duration-300 ease-in-out relative ${sidebarOpen ? 'lg:mr-90' : ''}`}>

                {/* HEADER */}
                <header className="h-16 bg-gray-900 text-white flex items-center justify-between px-4 lg:px-6  z-30 shadow-md">
                    <div className="flex items-center min-w-0 gap-3">
                        <button
                            onClick={() => navigate('/me')}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="font-bold text-lg truncate max-w-[200px] md:max-w-md">
                            {courseData.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col w-32 lg:w-48">
                            <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-bold">
                                <span>Progress</span>
                                <span>{courseData.progress}%</span>
                            </div>
                            <ProgressBar progress={courseData.progress} />
                        </div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hover:bg-gray-800 p-2 rounded-lg transition-colors lg:hidden"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </header>

                {/* CONTENT BOX */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {isFinished ? (
                        /* COMPLETION MESSAGE */
                        <div className="flex flex-col items-center justify-center min-h-full p-6 text-center">
                            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg">
                                <Trophy size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Congratulations!</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
                                You have successfully completed <strong>{courseData.title}</strong>.
                                Great job on reaching the finish line!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => navigate('/me')}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                                >
                                    Back to My Courses
                                </button>
                                <button
                                    onClick={() => setIsFinished(false)}
                                    className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                >
                                    Review Lessons
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* PLAYER VIEW */
                        <div className="h-full flex flex-col">
                            {activeItem.type === 'lesson' ? (
                                <ContentPlayer
                                    lesson={{
                                        ...activeItem,
                                        description: activeItem.content || ""
                                    }}
                                    onComplete={() => handleCompletion(activeItem.id)}
                                />
                            ) : (
                                <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
                                    <QuizPlayer
                                        quizId={Number(activeItem.quizId)}
                                        onClose={() => handleCompletion(activeItem.id)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* RIGHT SIDEBAR */}
            <CurriculumSidebar
                items={courseData.curriculum}
                activeItem={activeItem}
                onItemClick={handleItemClick}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
        </div>
    );
}