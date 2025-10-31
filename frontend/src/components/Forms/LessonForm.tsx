import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Editor from "../Editor/RichTextEditor";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { Modal } from "../ui/modal";
interface LessonFormProps {
    isOpen: boolean;
    closeModal: () => void;
    mode?: "edit" | "create";
    lessonId?: number;
}
function LessonForm({ isOpen, closeModal, mode, lessonId }: LessonFormProps) {
    const { courseId } = useParams();
    const [formdata, setFormData] = useState({
        title: "",
        order: "",
        content: "",
        video_url: "",
        content_file: null as File | null,
        resources: null as File | null,
    });
    useEffect(() => {
        if (mode === "edit" && lessonId) {
            const fetchLesson = async () => {
                try {
                    const response = await API.get(`/courses/${courseId}/lessons/${lessonId}`);
                    setFormData(response.data);
                } catch (error) {
                    toast.error("Error fetching lesson:" + error);
                }
            };
            fetchLesson();
        }
    }, [lessonId, mode]);
    const handleClose = (e: React.MouseEvent) => {
        e.preventDefault();
        closeModal();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData((prev) => ({
                ...prev,
                [name]: files[0] || null,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleEditorChange = (value: string) => {
        setFormData((prev) => ({ ...prev, content: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const fd = new FormData();
            fd.append("title", formdata.title);
            fd.append("order", formdata.order);
            fd.append("content", formdata.content);
            fd.append("video_url", formdata.video_url);

            if (formdata.content_file && typeof formdata.content_file !== "string") {
                fd.append("content_file", formdata.content_file);
            }
            if (formdata.resources && typeof formdata.resources !== "string") {
                fd.append("resources", formdata.resources);
            }
            if (mode === "edit" && lessonId) {
                await API.patch(`/courses/${courseId}/lessons/${lessonId}/`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Lesson Updated Successfully")
            } else {
                await API.post(`/courses/${courseId}/lessons/`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Lesson Added Successfully");
            }
            setFormData({
                title: "",
                order: "",
                content: "",
                video_url: "",
                content_file: null,
                resources: null,
            });
            closeModal();
        } catch (err) {
            toast.error(`Error submitting lesson:${err}`);
        }
    };

    return (
        <Modal isOpen={isOpen} dismissable={false} onClose={closeModal} className="max-w-[800px] m-4">
            <div className="relative w-full text-left p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        {mode === "edit" ? "Edit Module" : "Add New Module"}
                    </h4>
                </div>
                <form className="flex flex-col" onSubmit={handleSubmit}>
                    <div className="px-2 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>Title</Label>
                                <Input
                                    type="text"
                                    name="title"
                                    value={formdata.title}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <Label>Lesson Number</Label>
                                <Input
                                    type="text"
                                    name="order"
                                    value={formdata.order}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label>Content</Label>
                                <Editor
                                    initialValue={formdata.content}
                                    onChange={handleEditorChange}
                                />
                            </div>

                            <div>
                                <Label>Content File</Label>
                                <Input type="file" accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" name="content_file" onChange={handleChange} />
                                {formdata.content_file && (<div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <img src={String(formdata.content_file)} alt="Content preview" width={100} className="text-blue-600 hover:text-blue-800" />
                                </div>)}
                            </div>

                            <div>
                                <Label>Resources File</Label>
                                <Input type="file" accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" name="resources" onChange={handleChange} />
                                {formdata.resources && (<div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <img src={String(formdata.resources)} alt="Content preview" width={100} className="text-blue-600 hover:text-blue-800" />
                                </div>)}
                            </div>

                            <div className="md:col-span-2">
                                <Label>Video URL</Label>
                                <Input
                                    type="text"
                                    name="video_url"
                                    value={formdata.video_url}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleClose}
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
}

export default LessonForm;
