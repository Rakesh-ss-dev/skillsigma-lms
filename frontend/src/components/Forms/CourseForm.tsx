import { useEffect, useState } from "react"
import ComponentCard from "../common/ComponentCard"
import Input from "../form/input/InputField"
import Label from "../form/Label"
import Select from "../form/Select"
import API from "../../api/axios"

const CourseForm = () => {
    const [instructors, setInstructors] = useState([])
    const getInstructors = async () => {
        const instructorsResponse = await API.get("instructors");
        const instructorList = instructorsResponse.data.results;
        const result = instructorList.map((item: any) => ({
            value: item.id,
            label: item.first_name + ' ' + item.last_name,
        }));
        setInstructors(result);
    }
    useEffect(() => {
        getInstructors()
    }, [])
    return (
        <ComponentCard title="Add Course" >
            <form>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div>
                        <Label>Title</Label>
                        <Input type="text" />
                    </div>
                    <div>
                        <Label>Instructor</Label>
                        <Select options={instructors} onChange={e => { console.log(e) }} />
                    </div>
                </div>
            </form>
        </ComponentCard>
    )
}

export default CourseForm