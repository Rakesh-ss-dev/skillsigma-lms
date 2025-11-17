import { useEffect, useState } from "react";
import { useParams } from "react-router";
import API from "../../api/axios";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from '@mui/material/Box';
import Assessment from "../../components/course/Assessment";
import CourseContent from "../../components/course/CourseContent";
import Badge from "../../components/ui/badge/Badge";
const ViewCourse = () => {

    const [course, setCourse] = useState<any>(null);
    const [value, setValue] = useState(0);
    const { courseId } = useParams<{ courseId: string }>();
    const fetchCourse = async () => {
        // Fetch course details using the id
        const response = await API.get(`/courses/${courseId}`);
        setCourse(response.data);
    }
    useEffect(() => {
        fetchCourse();
    }, []);
    return (
        <div className="max-w-7xl mx-auto mt-10 bg-white shadow-md rounded dark:bg-gray-800 rounded-lg">
            {course ? (
                <div>
                    <div className="flex flex-col md:flex-row gap-5 border-b border-gray-200 dark:border-gray-700">
                        <div className="p-5 flex flex-col md:flex-row gap-3 justify-start items-center">
                            <div><img src={course.thumbnail} alt={course.title} width={100} /></div>
                            <div>
                                <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{course.title}</h1>
                                <p className="text-gray-700 dark:text-gray-300">{course.description}</p>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col gap-2 justify-be">
                            <div className="flex flex-row gap-2 text-gray-700 dark:text-gray-300">Categories:<span className="flex flex-row gap-2">{course.categories.map((cat: any) => <Badge key={cat.id}>{cat.name}</Badge>)}</span></div>
                        </div>
                    </div>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={value} onChange={(e, newValue) => { e.preventDefault(); setValue(newValue); }}>
                            <Tab label="Content" className="font-medium text-sm text-gray-700 dark:text-gray-300" sx={{ fontFamily: "inherit" }} />
                            <Tab label="Assessments" sx={{ fontFamily: "inherit" }} />
                        </Tabs>
                    </Box>
                    <Box>
                        {value === 0 && <CourseContent course={course} />}
                        {value === 1 && <Assessment course={course} />}
                    </Box>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    )
}

export default ViewCourse