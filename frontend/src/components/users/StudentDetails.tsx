import { useEffect, useState } from "react"
import API from "../../api/axios"
import ComponentCard from "../common/ComponentCard"
import Select from "../form/Select";
import Button from "../ui/button/Button";
import toast from "react-hot-toast";
import { Link } from "react-router";
import { ArrowBigLeftDash } from "lucide-react";

const StudentDetails = ({ user }: any) => {
    const [enrollment, setEnrollment] = useState<any>({});
    const [courses, setCourses] = useState<any>([]);
    const [selectedCourse, setSelectedCourse] = useState();
    const getCourses = async () => {
        const response = await API.get('/courses/');
        const courses = response.data.results;
        const data = courses.map((course: any) => ({ value: course.id, label: course.title }))
        setCourses(data);
    }
    const getEnrollment = async (user: any) => {
        const response = await API.post(`/enrollments/get_user_enrollments/ `, { user_id: user.id })
        setEnrollment(response.data[0]);
    }
    const enrollStudent = async () => {
        try {
            const formdata = { student_id: user.id, course_id: selectedCourse };
            await API.post(`/enrollments/`, { ...formdata })
            toast.success("Student Enrolled successfully!");
        }
        catch (error) {
            console.error("Error Enrolling Student:", error);
            toast.error("Error Enrolling Student. Please try again.");
        }
    }
    useEffect(() => { getEnrollment(user); getCourses() }, [])
    return (
        <div>
            <Link className="text-brand-500 mb-5 flex gap-3" to="/learners"><ArrowBigLeftDash /> Back to Students List</Link>
            <div className="flex gap-3">
                {user &&
                    <div className="w-full md:w-1/2">
                        <ComponentCard title={`User Details`}>
                            <div className="flex flex-col gap-3">
                                <p>First Name : {user.first_name}</p>
                                <p>Last Name : {user.last_name}</p>
                                <p>Email : {user.email}</p>
                                <p>Phone Number : {user.phone}</p>
                            </div>
                        </ComponentCard>
                    </div>
                }

                <div className="w-full md:w-1/2">


                    <ComponentCard title="Enrolled to">
                        {enrollment ?
                            <div className="flex flex-col gap-3">
                                <p>Course Name: {enrollment.course?.title}</p>
                                <p>Course Description: {enrollment.course?.description}</p>
                                <p>Number of Lessons: {enrollment.course?.lessons.length}</p>
                                <p>Course Progress : {enrollment.progress}</p>
                            </div> :
                            <div>
                                <Select options={courses} onChange={(e: any) => setSelectedCourse(e.value)} />
                                <div className="flex justify-end">
                                    <Button onClick={enrollStudent} className="mt-3">Enroll</Button>
                                </div>
                            </div>
                        }
                    </ComponentCard>


                </div>
            </div >
        </div >
    )
}

export default StudentDetails