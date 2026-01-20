import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
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
    // 1. STATE: Use UIState, NOT ApiCourse
    const [courseData, setCourseData] = useState<UIState | null>(null);
    const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const { courseId } = useParams();

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. GET Raw Data (ApiCourse format)
                const res = await API.get(`/courses/${courseId}/`);
                // 2. TRANSFORM to UI Data (UIState format)
                const uiData = mapApiToUI(res.data);
                // 3. SET State
                setCourseData(uiData);
                // 4. Set Initial Active Item (Safe check)
                if (uiData.curriculum && uiData.curriculum.length > 0) {

                    // Find the first item where 'completed' is false
                    const firstUnfinishedItem = uiData.curriculum.find(item => !item.completed);

                    if (firstUnfinishedItem) {
                        setActiveItem(firstUnfinishedItem);
                    } else {
                        // Edge Case: If ALL items are completed (find returns undefined)
                        // You usually want to default to the first item for review
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
        setActiveItem(item);
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const handleCompletion = async (itemId: number) => {
        if (!courseData) return;

        const currentIndex = courseData.curriculum.findIndex(i => i.id === itemId);
        const nextItem: ContentItem = courseData.curriculum[currentIndex + 1];

        const response = await API.post('/progress/', { lesson: courseData.curriculum[currentIndex].id })
        console.log(response);
        const updatedCurriculum = courseData.curriculum.map((item, index) => {
            if (index === currentIndex) return { ...item, completed: true };
            if (index === currentIndex + 1) return { ...item, locked: false };
            if (index === courseData.curriculum.length - 1) return item;
            return item;
        });
        setActiveItem(nextItem);
        const completedCount = updatedCurriculum.filter(i => i.completed).length;
        const newProgress = Math.round((completedCount / updatedCurriculum.length) * 100);

        setCourseData({
            ...courseData,
            progress: newProgress,
            curriculum: updatedCurriculum
        });
    };

    // --- Loading Guard ---
    if (!courseData || !activeItem) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 overflow-hidden relative">
            <main className={`flex-1 flex flex-col h-full transition-all duration-300 ease-in-out bg-black ${sidebarOpen ? 'lg:mr-96' : ''}`}>
                <header className="h-16 bg-gray-900 text-white flex items-center justify-between p-4 lg:p-6 w-full z-40 shadow-lg">
                    <div className="flex items-center min-w-0 gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hover:bg-gray-800 p-2 rounded-lg transition-colors lg:hidden"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="font-bold text-lg truncate pr-4 max-w-[200px] md:max-w-md">
                            {courseData.title}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-6 flex-shrink-0">
                        <div className="hidden md:flex flex-col w-40">
                            <div className="flex justify-between text-xs text-gray-400 mb-1.5 font-medium">
                                <span>Your Progress</span>
                                <span>{courseData.progress}%</span>
                            </div>
                            <ProgressBar progress={courseData.progress} />
                        </div>
                    </div>
                </header>
                {activeItem.type === 'lesson' ? (
                    <>
                        <ContentPlayer
                            lesson={{
                                ...activeItem,
                                // Correctly map the HTML content to description for the player
                                description: activeItem.content || ""
                            }}
                            onComplete={() => handleCompletion(activeItem.id)}
                        />
                    </>
                ) : (
                    <div className="py-6 px-4 sm:px-6 lg:px-8">
                        <QuizPlayer
                            quizId={Number(activeItem.quizId)}
                            onClose={() => navigate('/courses')}
                        />
                    </div>
                )}
            </main>

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