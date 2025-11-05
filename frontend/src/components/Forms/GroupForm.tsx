import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import API from "../../api/axios";
import Select from "../form/Select";
import Papa from "papaparse";
import { CloseIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import toast from "react-hot-toast";

interface GroupFormProps {
    isOpen: boolean;
    closeModal: () => void;
    mode?: "add" | "edit";
    groupId?: number;
}

interface Student {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    username: string;
}

interface Option {
    label: string;
    value: string | number;
}

const GroupForm = ({ isOpen, closeModal, mode, groupId }: GroupFormProps) => {
    const [name, setName] = useState("");
    const [course, setCourse] = useState<string | number>("");
    const [courseList, setCourseList] = useState<Option[]>([]);
    const [description, setDescription] = useState("");
    const [students, setStudents] = useState<Student[]>([]);

    const getGroupDetails = async (id: any) => {
        const response = await API.get(`/groups/${id}`);
        setName(response.data.name);
        setDescription(response.data.description);
        setStudents(response.data.students_info)
        setCourse(response.data.courses_info[0].id)
    }
    useEffect(() => {
        if (groupId) {
            getGroupDetails(groupId);
        }
    }, [groupId])


    // ✅ Fetch courses from API
    const getCourses = async () => {
        try {
            const response = await API.get("/courses/");
            const courses = response.data.results || [];
            const formattedCourses = courses.map((course: any) => ({
                label: course.title,
                value: course.id,
            }));
            setCourseList(formattedCourses);
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    useEffect(() => {
        getCourses();
    }, []);

    // ✅ Add new student manually
    const addStudent = (e: any) => {
        e.preventDefault();
        setStudents((prev) => [
            ...prev,
            { first_name: "", last_name: "", email: "", phone: "", password: "", username: '' },
        ]);
    };

    // ✅ Remove a student
    const removeStudent = (index: number) => {
        setStudents((prev) => prev.filter((_, i) => i !== index));
    };

    // ✅ Update student fields
    const handleStudentChange = (
        index: number,
        field: keyof Student,
        value: string
    ) => {
        setStudents((prev) => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    // ✅ Handle CSV Upload
    const handleCSVUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result: any) => {
                const validRows = result.data.filter((row: any) => row.email);
                setStudents(validRows);
            },
        });
    };

    // ✅ Submit form
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            name,
            description,
            course,
            students,
        };
        if (!name || !course) {
            alert("Please fill in group name and course before saving.");
            return;
        }
        try {
            if (mode === "edit") {
                await API.put(`/groups/${groupId}/`, payload);
                toast.success('Group Updated Successfully!')
            } else {
                await API.post("/groups/", payload);
                toast.success('Group Added Successfully!')
            }

            closeModal();
        } catch (err: any) {
            console.error("Error saving group:", err.response.data);
        }
    };

    return (
        <Modal isOpen={isOpen} dismissable={false} onClose={closeModal}>
            <div className="relative w-full text-left p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        {mode === "edit" ? "Edit Group" : "Add New Group"}
                    </h4>
                </div>

                <form className="flex flex-col" onSubmit={handleSubmit}>
                    <div className="px-2 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            {/* Group Name */}
                            <div>
                                <Label htmlFor="name">Group Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            {/* Course Select */}
                            <div>
                                <Label htmlFor="course">Course</Label>
                                <Select
                                    options={courseList}
                                    defaultValue={course}
                                    onChange={(e: any) => setCourse(e.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="lg:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <TextArea
                                    id="description"
                                    placeholder="Description about the group"
                                    value={description}
                                    onChange={(e) => setDescription(e)}
                                />
                            </div>

                            {/* Students Section */}
                            <div className="lg:col-span-2">
                                <div className="mb-3">
                                    <Label>Upload Students via CSV</Label>
                                    <Input type="file" accept=".csv" onChange={handleCSVUpload} />
                                </div>



                                {/* Render Students */}
                                {students.map((student, idx) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-4 mb-4 bg-gray-50 relative"
                                    >
                                        <Badge
                                            color="error"
                                            className="absolute top-2 right-2 text-red-600 font-bold cursor-pointer"
                                            onClick={() => removeStudent(idx)}
                                        >
                                            <CloseIcon />
                                        </Badge>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
                                            <div>
                                                <Label>First Name</Label>
                                                <Input
                                                    type="text"
                                                    value={student.first_name}
                                                    onChange={(e) =>
                                                        handleStudentChange(idx, "first_name", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Last Name</Label>
                                                <Input
                                                    type="text"
                                                    value={student.last_name}
                                                    onChange={(e) =>
                                                        handleStudentChange(idx, "last_name", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Username/Email</Label>
                                                <Input
                                                    type="email"
                                                    value={student.email}
                                                    onChange={(e) =>
                                                        handleStudentChange(idx, "email", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Phone</Label>
                                                <Input
                                                    type="tel"
                                                    value={student.phone}
                                                    onChange={(e) =>
                                                        handleStudentChange(idx, "phone", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Password</Label>
                                                <Input
                                                    type="password"
                                                    value={student.password}
                                                    onChange={(e) =>
                                                        handleStudentChange(idx, "password", e.target.value)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Manual Add */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mb-4"
                                    onClick={addStudent}
                                >
                                    + Add Student Manually
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={closeModal}
                        >
                            Close
                        </Button>
                        <Button size="sm" type="submit">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default GroupForm;
