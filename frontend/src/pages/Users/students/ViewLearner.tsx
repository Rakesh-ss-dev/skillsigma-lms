import { useParams } from "react-router";
import API from "../../../api/axios";
import { useEffect, useState } from "react";
import StudentDetails from "../../../components/users/StudentDetails";

const ViewStudent = () => {
    const { userId } = useParams();
    const [user, setUser] = useState<any>();
    const fetchUser = async (userId: any) => {
        const response = await API.get(`/users/${userId}`);
        setUser(response.data);
    }
    useEffect(() => {
        fetchUser(userId);
    }, [])
    return (
        user ?
            <StudentDetails user={user} /> : "Loading ..."
    )
}

export default ViewStudent