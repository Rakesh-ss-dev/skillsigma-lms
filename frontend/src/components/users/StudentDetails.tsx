import { useEffect, useState, useCallback, useMemo } from "react";
import API from "../../api/axios";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import toast from "react-hot-toast";
import { Link } from "react-router";
import { ArrowBigLeftDash } from "lucide-react";
import MultiSelect from "../form/MultiSelect";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";
import TableHead from "@mui/material/TableHead";

const StudentDetails = ({ user }: any) => {
    const [enrollments, setEnrollments] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all available courses for the dropdown
    const getCourses = useCallback(async () => {
        try {
            const response = await API.get('/courses/');
            const data = response.data.results.map((course: any) => ({
                value: course.id,
                text: course.title
            }));
            setCourses(data);
        } catch (error) {
            toast.error("Failed to load courses");
        }
    }, []);

    // Fetch specific enrollment for this user
    const getEnrollment = useCallback(async () => {
        if (!user?.id) return;
        try {
            const response = await API.post(`/enrollments/get_user_enrollments/`, { user_id: user.id });
            // Taking the first enrollment for display
            setEnrollments(response.data);
        } catch (error) {
            console.error("Error fetching enrollment", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const enrollStudent = async () => {
        try {
            const formdata = { student_id: user.id, course_id: selectedEnrollments };
            await API.post(`/enrollments/`, formdata);
            toast.success("Student Enrolled successfully!");
            setSelectedEnrollments([]);
            getEnrollment();
        } catch (error) {
            toast.error("Error Enrolling Student.");
        }
    };

    const removeEnrollment = async (enrollmentId: any) => {
        try {
            await API.delete(`/enrollments/${enrollmentId}/`);
            toast.success("Enrollment removed successfully!");
            setEnrollments(null);
            getEnrollment();
        } catch (error) {
            toast.error("Error removing enrollment.");
        }
    };

    useEffect(() => {
        getCourses();
        getEnrollment();
    }, [getCourses, getEnrollment]);

    const availableCourses = useMemo(() => {
        if (!courses.length) return [];
        if (!enrollments) return courses;
        const enrolledIds = Array.isArray(enrollments)
            ? enrollments.map((e: any) => e.course?.id)
            : [enrollments.course?.id];
        return courses.filter(course => !enrolledIds.includes(course.value));
    }, [courses, enrollments]);

    if (loading) return <p>Loading student details...</p>;

    return (
        <div>
            <Link className="text-brand-500 mb-5 flex gap-3 items-center" to="/learners">
                <ArrowBigLeftDash size={20} /> Back to Students List
            </Link>

            <div className="flex flex-col md:flex-row gap-5">
                {user && (
                    <div className="w-full md:w-1/2">
                        <ComponentCard title="User Details">
                            <div className="flex flex-col gap-3">
                                <p><strong>First Name:</strong> {user.first_name}</p>
                                <p><strong>Last Name:</strong> {user.last_name}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Phone:</strong> {user.phone}</p>
                            </div>
                        </ComponentCard>
                    </div>
                )}

                <div className="w-full md:w-1/2">
                    {enrollments && (
                        <ComponentCard title="Enrolled to">
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHead className="bg-gray-50 dark:bg-gray-800/50">
                                        <TableRow>
                                            <TableCell className="text-center font-bold text-gray-700 dark:text-gray-200">
                                                Course Name
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-gray-700 dark:text-gray-200">
                                                Progress
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-gray-700 dark:text-gray-200">
                                                Actions
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {(Array.isArray(enrollments) ? enrollments : [enrollments]).map((enrollment: any) => (
                                            <TableRow
                                                key={enrollment.id}
                                                className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                            >
                                                <TableCell className="text-center text-gray-600 dark:text-gray-400">
                                                    {enrollment.course?.title || "Untitled Course"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                                                        {parseInt(enrollment.progress || 0)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="outline"
                                                        className="my-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                                                        onClick={() => removeEnrollment(enrollment.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ComponentCard>
                    )}

                    {courses.length > 0 && availableCourses.length > 0 &&
                        <ComponentCard title="Enroll to New Courses" className="mt-5">
                            <MultiSelect
                                label="Select Courses"
                                defaultSelected={selectedEnrollments}
                                options={availableCourses}
                                onChange={(val: any) => setSelectedEnrollments(val)}
                            />
                            <div className="flex justify-end mt-4">
                                <Button onClick={enrollStudent} disabled={selectedEnrollments.length === 0}>
                                    Enroll Now
                                </Button>
                            </div>
                        </ComponentCard >
                    }
                </div>
            </div>
        </div>

    );
};

export default StudentDetails;