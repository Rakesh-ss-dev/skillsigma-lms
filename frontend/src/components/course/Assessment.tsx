import { useEffect, useState } from "react";
import API from "../../api/axios";
import Button from "../ui/button/Button";
import { useModal } from "../../hooks/useModal";
import AssessmentBuilder from "./AssessmentBuilder";
import AssessmentTable from "../datatables/AssessmentTable";


const Assessment = ({ course }: { course: any }) => {
    const { isOpen, openModal, closeModal } = useModal();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const getQuizzes = async () => {
        const response = await API.get(`/courses/${course.id}/quizzes`);
        setQuizzes(response.data.results);
    }
    useEffect(() => {
        getQuizzes();
    }, [isOpen]);
    return (
        <div className="p-5">
            <div className="flex justify-between items-center mb-4 text-gray-700 dark:text-gray-300">
                {quizzes.length === 0 ? <p>No Assessments available for this course.</p> : <p>Assessment List:</p>}
                <Button size="sm" onClick={() => openModal()}>
                    Create New Assessment
                </Button>
            </div>
            <AssessmentTable quizzes={quizzes} />

            <AssessmentBuilder isOpen={isOpen} closeModal={closeModal} mode="create" />
        </div>

    )
}

export default Assessment