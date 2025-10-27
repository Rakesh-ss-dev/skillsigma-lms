import { useNavigate, useParams } from "react-router";
import ComponentCard from "../../components/common/ComponentCard"
import API from "../../api/axios";
import Button from "../../components/ui/button/Button";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";


const DeleteAssessment = () => {
    const { courseId, assessmentId } = useParams();
    const deleteSubmit = async (e: any) => {
        e.preventDefault();
        try {
            await API.delete(`courses/${courseId}/quizzes/${assessmentId}/`);
            toast.success("Assessment Deleted Successfully!!")
            navigate(-1);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Something went wrong!!");
            } else {
                toast.error("Unexpected error");
            }
        }
    }
    const navigate = useNavigate();

    const [assessment, setAssessment] = useState<any>(null);
    const getAssessment = async () => {
        const response = await API.get(`courses/${courseId}/quizzes/${assessmentId}/`);
        setAssessment(response.data);
    };
    useEffect(() => {
        getAssessment();
    }, [assessmentId]);
    return (
        <ComponentCard title="Delete Assessment" desc="Are you sure you want to delete this assessment?">
            <div className="p-5">
                {assessment ? (
                    <div className="mb-3">
                        <h2>Title: {assessment.title}</h2>
                        <p>Description: {assessment.description}</p>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
                <form onSubmit={deleteSubmit}>
                    <div className="flex gap-3">
                        <Button type="button" onClick={(e: any) => { e.preventDefault(); navigate("/courses/" + courseId) }}>Cancel</Button>
                        <Button type="submit">Confirm Delete</Button>
                    </div>
                </form>
            </div>
        </ComponentCard>
    )
}

export default DeleteAssessment