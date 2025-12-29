import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
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
    const [isProcessing, setIsProcessing] = useState(false);
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
    const checkStatus = async (id: number) => {
        try {
            const response = await API.get(`/courses/${courseId}/lessons/${id}/`);
            setIsProcessing(true);
            setTimeout(() => {
                if (response.data.processing_status === "processing" || response.data.processing_status === "pending") {
                    checkStatus(id);
                }
                else if (response.data.processing_status === "completed") {
                    toast.success("Lesson PDF processed successfully.");
                    setIsProcessing(false);
                    setFormData({
                        title: "",
                        order: "",
                        content: "",
                        video_url: "",
                        content_file: null,
                        resources: null,
                    });
                    closeModal();
                }
                else if (response.data.processing_status === "failed") {
                    toast.error("Lesson PDF processing failed.");
                    setIsProcessing(false);
                    setFormData({
                        title: "",
                        order: "",
                        content: "",
                        video_url: "",
                        content_file: null,
                        resources: null,
                    });
                    closeModal();
                }
            }, 2000);
        } catch (error) {
            toast.error("Error fetching lesson status:" + error);
        }
    }
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
                await checkStatus(lessonId);
                toast.success("Lesson Updated Successfully")
            } else {
                const response = await API.post(`/courses/${courseId}/lessons/`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                await checkStatus(response.data.id);
                toast.success("Lesson Added Successfully");
            }

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

                    {isProcessing && <div className="px-2 py-4 text-center flex items-center justify-center fixed w-full h-full top-0 left-0 bg-gray-100/75 z-999999">
                        <div className="flex flex-col items-center justify-center min-h-[200px]">
                            {/* Outer Ring */}
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

                            {/* Loading Text */}
                            <p className="mt-4 text-lg font-medium text-gray-600 animate-pulse">
                                Uploading and processing files, please wait...
                            </p>
                        </div>
                    </div>}
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
                                    <Link to={String(formdata.content_file)} target="_blank" className="text-blue-600 hover:text-blue-800">
                                        View Current File
                                    </Link>
                                </div>)}
                            </div>

                            <div>
                                <Label>Resources File</Label>
                                <Input type="file" accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" name="resources" onChange={handleChange} />
                                {formdata.resources && (<div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Link to={String(formdata.resources)} target="_blank" className="text-blue-600 hover:text-blue-800">
                                        View Current File
                                    </Link>
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
