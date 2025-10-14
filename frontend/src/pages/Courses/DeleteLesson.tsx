import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import API from "../../api/axios";
import ComponentCard from "../../components/common/ComponentCard";

const DeleteLesson = () => {
    const navigate = useNavigate();
    const { moduleId, id } = useParams();
    const [lesson, setLesson] = useState({} as any);
    const fetchLesson = async () => {
        try {
            const response = await API.get(`/courses/${id}/lessons/${moduleId}`);
            setLesson(response.data);
        } catch (error) {
            toast.error("Error fetching lesson:" + error);
        }
    };
    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await API.delete(`/courses/${id}/lessons/${moduleId}/`);
            toast.success("Lesson deleted successfully");
            navigate(`/courses/${id}`);
        } catch (error) {
            toast.error("Error deleting lesson:" + error);
        }
    }
    useEffect(() => {
        fetchLesson();
    }, [moduleId]);
    return (
        <ComponentCard title="Are you sure you want to delete this lesson?">
            {lesson ? (
                <div className="p-5">
                    <form onSubmit={handleDelete}>
                        <p className="mb-4">Title: <strong>{lesson.title}</strong></p>
                        <div className="flex gap-3">
                            <p className="mb-4">Content:</p>
                            <div
                                className="prose mb-4 flex-1 border p-4 rounded bg-gray-50"
                                dangerouslySetInnerHTML={{ __html: lesson.content }}
                            ></div>
                        </div>
                        <div>
                            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete Lesson</button>
                            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 ml-2">Cancel</button>
                        </div>
                    </form>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </ComponentCard>
    )
}


export default DeleteLesson;