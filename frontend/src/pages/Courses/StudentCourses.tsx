import { useEffect, useState } from "react"
import API from "../../api/axios";
import CourseCard from "../../components/course/CourseCard";

const StudentCourses = () => {
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const getEnrollments = async () => {
        try {
            const response = await API.get('/enrollments');
            // Handle both paginated (.results) and non-paginated responses
            const data = response.data.results ? response.data.results : response.data;
            setEnrollments(data);
        } catch (error) {
            console.error("Failed to fetch enrollments", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getEnrollments();
    }, [])

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading courses...</div>;
    }

    if (enrollments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                <p className="text-xl font-medium">No courses enrolled yet.</p>
                <button className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">Browse Courses &rarr;</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {enrollments.map((enrollment: any) => <CourseCard key={enrollment.id} enrollment={enrollment} />)}
                </div>
            </div>
        </div>
    )
}

export default StudentCourses