import { useNavigate, useParams } from "react-router";
import API from "../../api/axios";
import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";

const DeleteCourse = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<any>(null);
    const fetchcourse = async () => {
        const response = await API.get(`/courses/${id}`);
        setCourse(response.data);
    }
    useEffect(() => {
        fetchcourse();
    }, []);
    return (
        <div className="flex justify-center">
            <div className="w-1/2 p-4">
                <ComponentCard title="Delete Course">
                    {course ? (
                        <div>
                            <h2>Title: {course.title}</h2>
                            <p>Description: {course.description}</p>
                            <div className="flex justify-end mt-4 gap-2">
                                <Button onClick={() => navigate(-1)}>Cancel</Button>
                                <Button onClick={async () => {
                                    await API.delete(`/courses/${id}/`);
                                    navigate("/courses");
                                }}>Confirm Delete</Button>
                            </div>

                        </div>
                    ) : (
                        <p>Loading...</p>
                    )}
                </ComponentCard>
            </div>
        </div>
    )
}

export default DeleteCourse