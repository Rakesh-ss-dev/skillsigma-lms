import { ArrowBigLeftDash } from "lucide-react"
import { Link } from "react-router"
import ComponentCard from "../common/ComponentCard"
import Select from "../form/Select"
import { useEffect, useState } from "react"
import API from "../../api/axios"
import Button from "../ui/button/Button"
import toast from "react-hot-toast"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table"

const InstructorDetails = ({ instructor }: any) => {
    const [courses, setCourses] = useState<any>([]);
    const [selectedCourse, setSelectedCourse] = useState();
    const [assignedCourses, setAssignedCourses] = useState<any>([]);
    const getAssignedCourses = async () => {
        const response = await API.get(`/courses/?instructor_id=${instructor.id}`);
        setAssignedCourses(response.data.results);
    }
    const getCourses = async () => {
        const response = await API.get('/courses/');
        const courses = response.data.results;
        const data = courses.map((course: any) => ({ value: course.id, label: course.title }))
        setCourses(data);
    }
    useEffect(() => {
        getCourses();
        getAssignedCourses();
    }, [])
    const assignCourse = async () => {
        try {
            const formdata = { instructor_id: instructor.id }
            await API.post(`/courses/${selectedCourse}/add-instructor/`, { ...formdata });
            toast.success("Course assigned successfully");
            getAssignedCourses();
        } catch (error) {
            console.error(error);
            toast.error("Error assigning course");
        }
    }
    const removeCourse = async (courseId: any) => {
        try {
            const formdata = { instructor_id: instructor.id }
            await API.post(`/courses/${courseId}/remove-instructor/`, { ...formdata });
            toast.success("Course removed successfully");
            getAssignedCourses();
        } catch (error) {
            console.error(error);
            toast.error("Error removing course");
        }
    }
    return (
        <div>
            <Link className="text-brand-500 mb-5 flex gap-3" to="/instructors"><ArrowBigLeftDash /> Back to Instructors List</Link>
            <div className="flex gap-3">
                {instructor &&
                    <div className="w-full md:w-1/2">
                        <ComponentCard title={`User Details`}>
                            <div className="flex flex-col gap-3">
                                <p>First Name : {instructor.first_name}</p>
                                <p>Last Name : {instructor.last_name}</p>
                                <p>Email : {instructor.email}</p>
                                <p>Phone Number : {instructor.phone}</p>
                            </div>
                        </ComponentCard>
                    </div>
                }

                <div className="w-full md:w-1/2">

                    <ComponentCard title="Assigned to">
                        {assignedCourses.length !== 0 ?
                            <div>
                                {
                                    <Table>
                                        <TableHeader>
                                            <TableCell className="text-center">Course Title</TableCell>
                                            <TableCell className="text-center">Remove Instructor</TableCell>
                                        </TableHeader>
                                        <TableBody>
                                            {
                                                assignedCourses.map((course: any) =>
                                                    <TableRow key={course.id}>
                                                        <TableCell className="text-center">
                                                            <Link className="text-brand-500 hover:text-brand-800" to={`/courses/${course.id}`}> {course?.title}</Link>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button onClick={() => { removeCourse(course.id) }} size="sm">Remove </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            }
                                        </TableBody>
                                    </Table>
                                }
                            </div> :
                            <div>
                                <Select options={courses} onChange={(e: any) => setSelectedCourse(e.value)} />
                                <div className="flex justify-end">
                                    <Button onClick={assignCourse} className="mt-3">Assign</Button>
                                </div>
                            </div>
                        }
                    </ComponentCard>


                </div>
            </div >
        </div >
    )
}

export default InstructorDetails