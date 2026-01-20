import { useEffect, useState, useMemo } from "react";
import API from "../../api/axios";
import CourseCard from "../../components/course/CourseCard";
import Input from "../../components/form/input/InputField";

const StudentCourses = () => {
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState(""); // Store only the string query

    const getEnrollments = async () => {
        try {
            const response = await API.get('/enrollments');
            const data = response.data.results ? response.data.results : response.data;
            setEnrollments(data);
        } catch (error) {
            console.error("Failed to fetch enrollments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getEnrollments();
    }, []);

    // --- Search Logic Solution ---
    // useMemo re-calculates automatically whenever enrollments OR query changes.
    const filteredEnrollments = useMemo(() => {
        return enrollments.filter((enrollment: any) =>
            enrollment.course?.title?.toLowerCase().includes(query.toLowerCase())
        );
    }, [enrollments, query]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                    Loading courses...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        My Courses
                    </h1>

                    <div className="w-full md:w-80">
                        <Input
                            placeholder="Search your courses..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            // Ensure your Input component accepts className or has dark: styles
                            className="bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                </header>

                {/* --- Results Section --- */}
                {filteredEnrollments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredEnrollments.map((enrollment: any) => (
                            <CourseCard key={enrollment.id} enrollment={enrollment} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
                            {enrollments.length === 0 ? "You aren't enrolled in any courses." : "No courses match your search."}
                        </p>
                        {enrollments.length === 0 && (
                            <button className="mt-4 text-brand-600 dark:text-brand-400 hover:underline font-semibold">
                                Browse Courses →
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCourses;