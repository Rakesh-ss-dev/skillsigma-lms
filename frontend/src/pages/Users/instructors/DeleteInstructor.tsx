import { useNavigate, useParams } from "react-router"
import ComponentCard from "../../../components/common/ComponentCard"
import { useEffect, useState } from "react";
import API from "../../../api/axios";
import Button from "../../../components/ui/button/Button";
import toast from "react-hot-toast";
import axios from "axios";

const DeleteInstructor = () => {
    const navigate = useNavigate();
    const { instructorId } = useParams();
    const [instructor, setInstructor] = useState<any>();
    const fetchInstructor = async (instructorId: any) => {
        const response = await API.get(`/instructors/${instructorId}/`);
        setInstructor(response.data);
    }
    useEffect(() => {
        fetchInstructor(instructorId);
    }, [])
    const deleteSubmit = async (e: any) => {
        e.preventDefault();
        try {
            await API.delete(`/instructors/${instructorId}/`);
            toast.success("Users Deleted Successfully!!")
            navigate(-1);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Something went wrong!!");
            } else {
                toast.error("Unexpected error");
            }
        }
    }
    return (
        <ComponentCard title="Delete Learner">
            <p className="mb-3 text-xl">Are you sure want to delete the Instructor?</p>
            {instructor && <>
                <p className="mb-2 text-sm">Name: {`${instructor.first_name} ${instructor.last_name}`}</p>
                <p className="mb-2 text-sm">Username: {instructor.username}</p>
                <p className="mb-2 text-sm">Phone: {instructor.phone}</p>
            </>}
            <form onSubmit={deleteSubmit}>
                <div className="flex justify-end gap-3">
                    <Button type="button" onClick={(e: any) => { e.preventDefault(); navigate(-1) }}>Cancel</Button>
                    <Button type="submit">Confirm Delete</Button>
                </div>
            </form>
        </ComponentCard>
    )
}

export default DeleteInstructor