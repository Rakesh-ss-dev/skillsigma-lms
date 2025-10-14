import { useEffect, useState } from "react";
import API from "../../api/axios";
import Button from "../ui/button/Button";
import { useModal } from "../../hooks/useModal";
import LessonForm from "../Forms/LessonForm";
import LessonTable from "../datatables/LessonTable";

const CourseContent = ({ course }: { course: any }) => {
    const { isOpen, openModal, closeModal } = useModal();
    const [lessons, setLessons] = useState<any[]>([]);
    const getLessons = async () => {
        const response = await API.get(`/courses/${course.id}/lessons`);
        const data = response.data.results;
        setLessons(data);
    }
    useEffect(() => {
        if (!isOpen) getLessons();
    }, [isOpen]);
    return (
        <div className="p-5">
            <div className="flex justify-between items-center mb-4 text-gray-700 dark:text-gray-300">
                {lessons.length === 0 ? <p>No Modules available for this course.</p> : <p>Modules List:</p>}
                <Button size="sm" onClick={openModal}>
                    Create New Module
                </Button>
            </div>
            <LessonTable lessons={lessons} />

            <LessonForm isOpen={isOpen} closeModal={closeModal} />

        </div>
    )
}

export default CourseContent