import Label from "../form/Label";
import { Modal } from "../ui/modal"
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { useState } from "react";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import API from "../../api/axios";
import toast from "react-hot-toast";
interface StudentsFormProps {
    isOpen: boolean;
    closeModal: () => void;
}
const StudentsForm = ({ isOpen, closeModal }: StudentsFormProps) => {
    const [first_name, setFirstName] = useState<string>("");
    const [last_name, setLastName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [password, setPassword] = useState<string>("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!first_name.trim()) newErrors.first_name = "First name is required";
        if (!last_name.trim()) newErrors.last_name = "Last name is required";
        if (!email.trim()) newErrors.email = "Email is required";
        if (!phone.trim()) newErrors.phone = "Phone number is required";
        if (!password.trim()) newErrors.password = "Password is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setErrors({});
        closeModal();
    };
    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Submit form data
            try {
                const response = await API.post('users/', {
                    first_name,
                    last_name,
                    email,
                    phone,
                    password
                });
                if (response.status === 201) {
                    toast.success("Student added successfully");
                    resetForm();
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                toast.error("Failed to add student");
            }
        };
    };
    return (
        <Modal isOpen={isOpen} dismissable={false} onClose={resetForm} className="max-w-[800px] m-4">
            <div className="relative w-full text-left p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Add New Student
                    </h4>
                </div>
                <form className="flex flex-col" onSubmit={handleUserSubmit} >
                    <div className="px-2 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>First Name</Label>
                                <Input
                                    type="text"
                                    value={first_name}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                            </div>
                            <div>
                                <Label>Last Name</Label>
                                <Input
                                    type="text"
                                    value={last_name}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            </div>
                            <div>
                                <Label>Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}

                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    type="text"
                                    name="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={resetForm}
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
    )
}

export default StudentsForm