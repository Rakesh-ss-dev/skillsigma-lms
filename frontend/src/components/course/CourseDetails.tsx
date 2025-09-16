import Badge from "../ui/badge/Badge";

const CourseDetails = ({ course }: { course: any }) => {
    console.log(course);
    return (
        <div className="p-5">
            <div>Instructor: {course.instructor.name}</div>
            <div className="flex flex-row gap-2">Categories:<span className="flex flex-row gap-2">{course.categories.map((cat: any) => <Badge key={cat.id}>{cat.name}</Badge>)}</span></div>
            <div>Description: {course.description}</div>
        </div>
    )
}

export default CourseDetails