import { useNavigate, useParams } from "react-router";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import ComponentCard from "../../../components/common/ComponentCard";
import API from "../../../api/axios";
import Button from "../../../components/ui/button/Button";


const DeleteGroup = () => {
    const { groupId } = useParams();
    const deleteSubmit = async (e: any) => {
        e.preventDefault();
        try {
            await API.delete(`/groups/${groupId}/`);
            toast.success("Group Deleted Successfully!!")
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

    const [group, setGroup] = useState<any>(null);
    const getAssessment = async () => {
        const response = await API.get(`/groups/${groupId}`);
        setGroup(response.data);
    };
    useEffect(() => {
        getAssessment();
    }, [groupId]);
    return (
        <ComponentCard title="Delete Assessment" desc="Are you sure you want to delete this assessment?">
            <div className="p-5">
                {group ? (
                    <div className="mb-3">
                        <h2>Name: {group.name}</h2>
                        <p>Description: {group.description}</p>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
                <form onSubmit={deleteSubmit}>
                    <div className="flex gap-3">
                        <Button type="button" onClick={(e: any) => { e.preventDefault(); navigate(-1) }}>Cancel</Button>
                        <Button type="submit">Confirm Delete</Button>
                    </div>
                </form>
            </div>
        </ComponentCard>
    )
}

export default DeleteGroup