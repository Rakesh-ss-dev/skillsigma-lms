import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import API from '../../api/axios';
import CoursePlayer from './CoursePlayer';

// --- Interfaces (Kept same as yours) ---
interface Category {
    id: number;
    name: string;
}

interface Lesson {
    id: number;
    course: number;
    title: string;
    content: string;
    content_file: string | null;
    video_url: string;
    order: number;
    resources: any | null;
    created_at: string;
    pdf_version: string | null;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface CourseDetail {
    id: number;
    title: string;
    description: string;
    categories: Category[];
    thumbnail: string;
    is_paid: boolean;
    price: string;
    created_at: string;
    instructors: number[];
    lessons: Lesson[];
}

const UserCourse: React.FC = () => {
    const { courseId } = useParams();

    // FIX 1: Type the state correctly and initialize as null
    // (Initializing as [] causes crashes when accessing object properties like .title)
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const getCourse = async () => {
        try {
            const response = await API.get(`/courses/${courseId}`);
            // FIX 2: DRF DetailViews usually return data directly, not inside .results
            // If your API specifically wraps detail views in results, keep .results, 
            // but standard DRF is just response.data
            setCourse(response.data);
        } catch (error) {
            console.error("Failed to fetch course", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (courseId) {
            getCourse();
        }
    }, [courseId]);

    // FIX 4: Loading State
    // Return early if data hasn't arrived yet
    if (loading) return <div className="p-4">Loading course...</div>;
    if (!course) return <div className="p-4">Course not found.</div>;

    return (
        <CoursePlayer courseData={course} />
    );
};

export default UserCourse;