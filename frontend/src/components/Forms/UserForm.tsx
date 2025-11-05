import { useEffect, useState } from "react";
import Label from "../form/Label";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import API from "../../api/axios";
import toast from "react-hot-toast";

interface UserFormProps {
    isOpen: boolean;
    closeModal: () => void;
    userId?: string | number;
    mode?: string;
    userRole?: "student" | "instructor"
}

const UserForm = ({ isOpen, closeModal, userId, userRole }: UserFormProps) => {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        role: userRole
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch user when editing
    const fetchUser = async () => {
        try {
            const response = await API.get(userRole === 'student' ? `/users/${userId}/` : `instructors/${userId}/`);
            const { first_name, last_name, email, phone, role } = response.data;
            setForm({ first_name, last_name, email, phone, password: "", role });
        } catch (err) {
            toast.error("Failed to fetch user details");
            console.error(err);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId]);

    // Input handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Validation
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!form.first_name.trim()) newErrors.first_name = "First name is required";
        if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
        if (!form.email.trim()) newErrors.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(form.email))
            newErrors.email = "Invalid email format";

        if (!form.phone.trim()) newErrors.phone = "Phone number is required";
        else if (!/^[0-9]{10}$/.test(form.phone))
            newErrors.phone = "Invalid phone number";

        if (!userId && !form.password.trim())
            newErrors.password = "Password is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            let response;
            if (!userId) {
                response = await API.post(userRole == 'student' ? "users/" : "instructors/", form);
            } else {
                response = await API.patch(userRole === 'student' ? `/users/${userId}/` : `instructors/${userId}/`, form);
            }

            if (response.status === 201 || response.status === 200) {
                toast.success(userId ? `${userRole} updated successfully` : `${userRole} added successfully`);
                closeModal();
            }
        } catch (error: any) {
            console.error("Error submitting form:", error);
            const errMsg = error.response?.data?.detail || "Failed to save student";
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            dismissable={false}
            onClose={closeModal}
            className="max-w-[800px] m-4"
        >
            <div className="relative w-full text-left p-4 overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        {userId ? "Edit Student" : "Add New Student"}
                    </h4>
                </div>

                <form className="flex flex-col" onSubmit={handleUserSubmit}>
                    <div className="px-2 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>First Name</Label>
                                <Input
                                    type="text"
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                />
                                {errors.first_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                                )}
                            </div>

                            <div>
                                <Label>Last Name</Label>
                                <Input
                                    type="text"
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                />
                                {errors.last_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                                )}
                            </div>

                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {!userId && (
                                <div>
                                    <Label>Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                        />
                                        <span
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                            )}
                                        </span>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <Label>Phone</Label>
                                <Input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.preventDefault(); closeModal() }}
                            disabled={isSubmitting}
                        >
                            Close
                        </Button>
                        <Button size="sm" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default UserForm;
