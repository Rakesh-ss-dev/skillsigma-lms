import { useEffect, useState } from "react";
import { useParams } from "react-router";
import API from "../../api/axios";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from '@mui/material/Box';
import Assessment from "../../components/course/Assessment";
import CourseContent from "../../components/course/CourseContent";
import CourseDetails from "../../components/course/CourseDetails";
const ViewCourse = () => {
    const [course, setCourse] = useState<any>(null);
    const [value, setValue] = useState(0);
    const { id } = useParams<{ id: string }>();
    const fetchCourse = async () => {
        // Fetch course details using the id
        const response = await API.get(`/courses/${id}`);
        setCourse(response.data);
    }
    useEffect(() => {
        fetchCourse();
    }, []);
    return (
        <div className="max-w-7xl mx-auto mt-10 bg-white shadow-md rounded dark:bg-gray-800 rounded-lg">

            {course ? (
                <div>
                    <div className="p-5 flex flex-col md:flex-row gap-3 justify-start items-center border-b border-gray-200 dark:border-gray-700">
                        <div><img src={course.thumbnail} alt={course.title} width={100} /></div>
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
                            <p>{course.description}</p>
                        </div>
                    </div>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={value} onChange={(e: any, newValue) => { console.log(e); setValue(newValue) }}>
                            <Tab label="Details" sx={{ fontFamily: "inherit" }} />
                            <Tab label="Content" sx={{ fontFamily: "inherit" }} />
                            <Tab label="Assessments" sx={{ fontFamily: "inherit" }} />
                        </Tabs>
                    </Box>
                    {value === 0 && <CourseDetails course={course} />}
                    {value === 1 && <CourseContent course={course} />}
                    {value === 2 && <Assessment course={course} />}

                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    )
}

export default ViewCourse