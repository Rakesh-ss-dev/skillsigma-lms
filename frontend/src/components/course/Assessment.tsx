import { useEffect, useState } from "react";
import API from "../../api/axios";
import Button from "../ui/button/Button";


const Assessment = ({ course }: { course: any }) => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const getQuizzes = async () => {
        const response = await API.get(`/courses/${course.id}/quizzes`);
        setQuizzes(response.data.results);
    }
    useEffect(() => {
        getQuizzes();
    }, []);
    return (
        <div className="p-5">
            <div className="flex justify-between items-center mb-4 text-gray-700 dark:text-gray-300">
                {quizzes.length === 0 ? <p>No Assessments available for this course.</p> : <p>Quizzes List:</p>}
                <Button size="sm" onClick={() => alert("Feature coming soon!")}>
                    Create New Assessment
                </Button>
            </div>
            <ul>
                {quizzes.map((quiz) => (
                    <li key={quiz.id}>{quiz.title}</li>
                ))}
            </ul>
        </div>
    )
}

export default Assessment