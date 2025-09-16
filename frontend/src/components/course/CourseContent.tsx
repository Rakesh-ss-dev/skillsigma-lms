import { useEffect, useState } from "react";
import API from "../../api/axios";

const CourseContent = ({ course }: { course: any }) => {
    const [lessons, setLessons] = useState<any[]>([]);
    const getLessons = async () => {
        const response = await API.get(`/courses/${course.id}/lessons`);
        const data = response.data.results;
        setLessons(data);
    }
    useEffect(() => { getLessons(); }, [course]);
    return (
        <div className="p-5">
            {lessons.length === 0 ? <p>No lessons available for this course.</p> : <p>Modules List:</p>}
            <ul>
                {lessons.map((lesson) => (
                    <li key={lesson.id}>{lesson.title}</li>
                ))}
            </ul>
        </div>
    )
}

export default CourseContent