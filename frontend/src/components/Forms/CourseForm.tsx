import { useEffect, useState } from "react"
import ComponentCard from "../common/ComponentCard"
import Input from "../form/input/InputField"
import Label from "../form/Label"
import API from "../../api/axios"
import TextArea from "../form/input/TextArea"
import MultiSelect from "../form/MultiSelect"
import Button from "../ui/button/Button"
import { Plus } from "lucide-react"
import FileInput from "../form/input/FileInput"
import isImageOrSvg from "../util/isImageorSvg"
import toast from "react-hot-toast"
import { useNavigate, useParams } from "react-router-dom"

const CourseForm = () => {
    const id = useParams().courseId;
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    const [title, setTitle] = useState('');
    const [instructors, setInstructors] = useState<any>([]);
    const [thumbnail, setThumbnail] = useState<File | null>();
    const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
    const [thumbnailError, setThumbnailError] = useState<String | null>('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<any>([]);
    const [instructorsList, setInstructorsList] = useState<any>([])
    const [categoryList, setCategoryList] = useState<any>([]);
    const [formError, setFormError] = useState<any>({});

    const getCategories = async () => {
        const categoriesResponse = await API.get('categories');
        const categoryList = categoriesResponse.data.results;
        const categoryResult = categoryList.map((item: any) => ({
            value: item.id,
            text: item.name,
            selected: false
        }))
        setCategoryList(categoryResult);
    }

    const getInstructors = async () => {
        const instructorsResponse = await API.get("instructors");
        const instructorList = instructorsResponse.data.results;
        const result = instructorList.map((item: any) => ({
            value: item.id,
            text: item.first_name + ' ' + item.last_name,
            selected: false
        }));
        setInstructorsList(result);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!isImageOrSvg(f)) {
            setThumbnailError("Only image files are allowed (PNG, JPG, GIF, SVG).");
            setThumbnail(null);
            return;
        }
        setThumbnailError(null);
        setThumbnail(f);
    };

    const addCategory = async (e: any) => {
        e.preventDefault();
        const response = await API.post("categories/", { name: category });

        const newCategory = {
            value: response.data.id,
            text: response.data.name,
            selected: true
        };
        setCategoryList((prev: any) => {
            if (prev.some((cat: any) => cat.value === newCategory.value)) {
                return prev;
            }
            return [...prev, newCategory];
        });

        // Update selectedCategories (only IDs)
        setSelectedCategories((prev: any) => {
            if (prev.includes(newCategory.value)) {
                return prev; // already selected
            }
            return [...prev, newCategory.value];
        });
    };

    useEffect(() => {
        getInstructors()
        getCategories()
    }, [])
    useEffect(() => {
        if (id) {
            API.get(`courses/${id}/`).then((response) => {
                const course = response.data;
                setTitle(course.title);
                setDescription(course.description);
                setThumbnailUrl(course.thumbnail);
                setInstructors(course.instructors);
                setSelectedCategories(course.categories.map((cat: any) => cat.id));
            });
        }
    }, [id]);
    const validateForm = () => {
        const errors: any = {};
        if (!title) errors.title = "Title is required";
        if (!instructors) errors.instructor = "At least one instructor must be selected";
        if (!thumbnail && !thumbnailUrl) errors.thumbnail = "Thumbnail is required";
        if (!description) errors.description = "Description is required";
        if (selectedCategories.length === 0) errors.categories = "At least one category must be selected";
        setFormError(errors);
        return Object.keys(errors).length === 0;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            if (Array.isArray(instructors)) {
                instructors.forEach((id: any) =>
                    formData.append("instructors", id)
                );
            } else {
                formData.append("instructors", instructors);
            }
            if (thumbnail && typeof thumbnail !== 'string') {
                formData.append("thumbnail", thumbnail as Blob);
            }
            selectedCategories.forEach((id: number) =>
                formData.append("category_ids", id.toString())
            );
            if (id) {
                await API.put(`courses/${id}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Course updated successfully");
            } else {
                await API.post("courses/", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Course added successfully");
            }
            navigate("/courses", { replace: true });
        } catch (error: any) {
            if (error.response?.data) {
                const errors = error.response.data;
                Object.keys(errors).forEach((field) => {
                    const messages = errors[field];
                    if (Array.isArray(messages)) {
                        messages.forEach((msg) => toast.error(msg));
                    } else {
                        toast.error(messages);
                    }
                });
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        }
    };

    return (
        <ComponentCard title={id ? "Edit Course" : "Add Course"} >
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Title</Label>
                        <Input type="text" value={title} onChange={e => setTitle(e.target.value)} />
                        {formError && formError.title && <p className="text-red-500 text-sm mt-1">{formError.title}</p>}
                    </div>
                    {user.role === "instructor" || (
                        <div>
                            <MultiSelect label="Instructors" defaultSelected={instructors} options={instructorsList} onChange={(e: any) => setInstructors(e)} />
                            {formError && formError.instructor && <p className="text-red-500 text-sm mt-1">{formError.instructor}</p>}
                        </div>)}
                    <div>
                        <Label>Thumbnail</Label>
                        <FileInput onChange={handleFileChange} />
                        {thumbnailError && <p className="text-red-500 text-sm mt-1">{thumbnailError}</p>}
                        {formError && formError.thumbnail && <p className="text-red-500 text-sm mt-1">{formError.thumbnail}</p>}
                        {thumbnail && typeof thumbnail === 'string' && <img src={thumbnail} alt="Thumbnail" className="mt-2 h-20 w-20 object-cover rounded" />}
                        {thumbnail && typeof thumbnail !== 'string' && <img src={URL.createObjectURL(thumbnail)} alt="Thumbnail" className="mt-2 h-20 w-20 object-cover rounded" />}
                        {thumbnailUrl && !thumbnail && <img src={thumbnailUrl} alt="Thumbnail" className="mt-2 h-20 w-20 object-cover rounded" />}
                    </div>
                    <div >
                        <Label>Description</Label>
                        <TextArea value={description} onChange={(e: any) => setDescription(e)}></TextArea>
                        {formError && formError.description && <p className="text-red-500 text-sm mt-1">{formError.description}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex flex-column md:flex-row items-end gap-3">
                            <MultiSelect label="Category" defaultSelected={selectedCategories} options={categoryList} onChange={(e: any) => setSelectedCategories(e)} />

                            <div className="w-1/2 mb-1">
                                <Label>Add Category</Label>
                                <div className="flex gap-x-2">
                                    <Input placeholder="Category Name" value={category} onChange={e => setCategory(e.target.value)} />
                                    <Button type="button" onClick={addCategory} size="sm" className="text-nowrap"><Plus /> Add</Button>
                                </div>
                            </div>
                        </div>
                        {formError && formError.categories && <p className="text-red-500 text-sm mt-1">{formError.categories}</p>}
                    </div>
                </div>
                <div className="flex justify-end mt-4 md:col-span-3">
                    <Button
                        className="bg-brand-500 text-white disabled:opacity-50"
                        type="submit"
                    >
                        {id ? "Update Course" : "Create Course"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    )
}

export default CourseForm