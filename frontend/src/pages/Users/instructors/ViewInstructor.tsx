import { useParams } from "react-router"
import API from "../../../api/axios";
import { useEffect, useState } from "react";
import InstructorDetails from "../../../components/users/InstructorDetails";

const ViewInstructor = () => {
    const { instructorId } = useParams();
    const [instructor, setInstructor] = useState();
    const fetchInstuctor = async () => {
        const response = await API.get(`/instructors/${instructorId}`)
        setInstructor(response.data);
    }
    useEffect(() => {
        fetchInstuctor();
    }, [])
    return (
        instructor ? <InstructorDetails instructor={instructor} /> : <p>Loading.....</p>
    )
}

export default ViewInstructor