import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Papa from "papaparse";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Select from "../form/Select";
import API from "../../api/axios";
import Badge from "../ui/badge/Badge";
import { CloseIcon } from "../../icons";
import { useParams } from "react-router";
import toast from "react-hot-toast";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";

// --- Types ---
interface Option {
    text: string;
    is_correct: boolean;
}
interface AssessmentFormProps {
    isOpen: boolean;
    closeModal: () => void;
    mode?: "edit" | "create";
    assessmentId?: number;
}
type QuestionType = "mcq" | "tf" | "short";

interface Question {
    id?: number; // optional for existing DB questions
    text: string;
    question_type: QuestionType;
    points: number;
    options: Option[];
    short_answer?: string;
}

interface Assessment {
    title: string;
    description: string;
    questions: Question[];
    course: number;
}

// --- Component ---
const AssessmentForm: React.FC<AssessmentFormProps> = ({ isOpen, closeModal, mode, assessmentId }) => {
    const courseId = useParams<{ courseId: string }>().courseId;
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
    const [selectedDbQuestionIds, setSelectedDbQuestionIds] = useState<number[]>([]);
    const options = [{ value: 'mcq', label: 'Multiple Choice' }, { value: 'tf', label: 'True / False' }, { value: 'short', label: 'Short Answer' }];

    const fetchExistingQuestions = async () => {
        const response = await API.get("/question/");
        setDbQuestions(response.data.results);
    };
    if (mode === "edit" && assessmentId) {
        useEffect(() => {
            const fetchAssessment = async () => {
                const response = await API.get(`/assessments/${assessmentId}/`);
                const { title, description, questions } = response.data;
                setTitle(title);
                setDescription(description);
                setQuestions(questions);
            };
            fetchAssessment();
        }, [assessmentId]);
    }
    const handleClose = (e: React.MouseEvent) => {
        e.preventDefault();
        closeModal();

    };
    useEffect(() => {
        fetchExistingQuestions();
    }, []);

    // --- Add DB selected questions ---
    const handleDbQuestionSelect = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, (option) => Number(option.value));
        setSelectedDbQuestionIds(selectedIds);

        const newQuestions = dbQuestions.filter(
            (q) => selectedIds.includes(q.id!) && !questions.some((qs) => qs.id === q.id)
        );

        setQuestions((prev) => [...prev, ...newQuestions]);
    };

    // --- CSV Upload ---
    const handleCSVUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result: any) => {
                const parsedQuestions: Question[] = (result.data as any[]).map((row: any) => {
                    const options: Option[] = [];
                    Object.keys(row).forEach((key) => {
                        if (key.startsWith("option_") && key.endsWith("_text")) {
                            const base = key.replace("_text", "");
                            const text = row[key];
                            const is_correct = row[`${base}_correct`] === "true";
                            if (text) options.push({ text, is_correct });
                        }
                    });

                    return {
                        text: row.question_text || "",
                        question_type: (row.question_type as QuestionType) || "mcq",
                        points: row.points ? parseInt(row.points, 10) : 1,
                        options,
                    };
                });

                setQuestions((prev) => [...prev, ...parsedQuestions]);
            },
        });
    };

    // --- Add / Remove Questions & Options ---
    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            { text: "", question_type: "mcq", points: 1, options: [{ text: "", is_correct: false }] },
        ]);
    };

    const removeQuestion = (index: number) => setQuestions(questions.filter((_, i) => i !== index));
    const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
        const updated: any = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const addOption = (qIndex: number) => {
        const updated: any = [...questions];
        updated[qIndex].options.push({ text: "", is_correct: false });
        setQuestions(updated);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const updated = [...questions];
        updated[qIndex].options.splice(oIndex, 1);
        setQuestions(updated);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, field: keyof Option, value: any) => {
        const updated: any = [...questions];
        updated[qIndex].options[oIndex][field] = value;
        setQuestions(updated);
    };

    // --- Validation ---
    const validate = (): boolean => {
        const validationErrors: string[] = [];

        if (!title.trim()) validationErrors.push("Title is required.");
        if (!description.trim()) validationErrors.push("Description is required.");

        questions.forEach((q, i) => {
            if (!q.text.trim()) validationErrors.push(`Question ${i + 1} text is required.`);
            if (q.points < 1) validationErrors.push(`Question ${i + 1} must have at least 1 point.`);

            switch (q.question_type) {
                case "mcq":
                    if (q.options.length < 2) validationErrors.push(`Question ${i + 1} (MCQ) must have at least 2 options.`);
                    if (q.options.filter((o) => o.is_correct).length < 1)
                        validationErrors.push(`Question ${i + 1} (MCQ) must have at least 1 correct option.`);
                    break;

                case "tf":
                    if (q.options.length !== 2) validationErrors.push(`Question ${i + 1} (True/False) must have exactly 2 options.`);
                    if (q.options.filter((o) => o.is_correct).length !== 1)
                        validationErrors.push(`Question ${i + 1} (True/False) must have exactly 1 correct option.`);
                    break;

                case "short":
                    if (q.options.length > 0) validationErrors.push(`Question ${i + 1} (Short Answer) must not have options.`);
                    break;
            }
        });

        setErrors(validationErrors);
        return validationErrors.length === 0;
    };

    // --- Submit Form ---
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validate()) return;
        const assessmentData: Assessment = { title, description, questions, course: Number(courseId) };
        try {
            const response = await API.post("/quiz/", assessmentData);
            toast.success("Assessment created successfully!");
            closeModal();
            console.log(response);
        } catch (error) {
            console.error("Error submitting assessment:", error);
            toast.error("Error submitting assessment. Please try again.");
        }

    };

    return (
        <Modal isOpen={isOpen} dismissable={false} onClose={closeModal} className="max-w-[800px] m-4 p-0">
            <div className="p-6 max-w-5xl mx-auto bg-white">
                <h2 className="text-2xl font-semibold mb-4">📝 Create Assessment</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title & Description */}
                    <div>
                        <Label>Title</Label>
                        <Input type="text" className="border w-full p-2 rounded" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div>
                        <Label>Description</Label>
                        <TextArea className="border w-full p-2 rounded" rows={3} value={description} onChange={(e) => setDescription(e)} />
                    </div>

                    {/* CSV Upload */}
                    <div>
                        <Label>Upload Questions (CSV)</Label>
                        <Input type="file" accept=".csv" onChange={handleCSVUpload} className="border p-2 rounded w-full" />
                    </div>

                    {/* Select existing questions from DB */}
                    {dbQuestions.length > 0 && (
                        <div>
                            <Label>Select Existing Questions</Label>
                            <select
                                multiple
                                value={selectedDbQuestionIds.map(String)}
                                onChange={handleDbQuestionSelect}
                                className="border p-2 rounded w-full"
                            >
                                {dbQuestions.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        {q.text}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/* Questions List */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Questions</h3>
                            <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded" onClick={addQuestion}>
                                + Add Question
                            </button>
                        </div>

                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="border rounded-lg p-4 mb-4 bg-gray-50 relative">
                                <Badge color="error" className="absolute top-2 right-2 text-red-600 font-bold" onClick={() => removeQuestion(qIndex)}>
                                    <CloseIcon />
                                </Badge>
                                <div className="flex  mb-2">
                                    <div className="w-full">
                                        <Label>Question Text</Label>
                                        <Input
                                            type="text"
                                            className="border w-full p-2 mb-2 rounded"
                                            placeholder="Question text"
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mb-2">
                                    <div className="w-1/2">
                                        <Label>Question Type</Label>
                                        <Select
                                            options={options}
                                            className="border p-2 rounded"
                                            defaultValue={q.question_type}
                                            onChange={(e: any) => handleQuestionChange(qIndex, "question_type", e.value as QuestionType)}
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <Label>Points</Label>
                                        <Input
                                            type="number"
                                            className="border p-2 rounded w-24"
                                            min={1}
                                            value={q.points}
                                            onChange={(e) => handleQuestionChange(qIndex, "points", parseInt(e.target.value, 10))}
                                        />
                                    </div>
                                </div>

                                {/* Options for MCQ/TF */}
                                {
                                    q.question_type !== "short" && (
                                        <div className="ml-4">
                                            <h4 className="font-medium">Options</h4>
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-2 mb-1">
                                                    <Input
                                                        type="text"
                                                        className="border p-1 flex-1 rounded"
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        value={opt.text}
                                                        onChange={(e) => handleOptionChange(qIndex, oIndex, "text", e.target.value)}
                                                    />
                                                    <Label className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={opt.is_correct}
                                                            onChange={(e) => handleOptionChange(qIndex, oIndex, "is_correct", e.target.checked)}
                                                        />
                                                        Correct
                                                    </Label>
                                                    <button type="button" className="text-red-600 font-bold" onClick={() => removeOption(qIndex, oIndex)}>
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <button type="button" className="text-blue-600 text-sm" onClick={() => addOption(qIndex)}>
                                                + Add Option
                                            </button>
                                        </div>
                                    )
                                }

                                {/* Short Answer Field */}
                                {
                                    q.question_type === "short" && (
                                        <div className="ml-4 mt-2">
                                            <Label>Expected Answer (optional)</Label>
                                            <Input
                                                type="text"
                                                className="border w-full p-2 rounded mt-1"
                                                placeholder="Enter expected answer"
                                                value={q.short_answer || ""}
                                                onChange={(e) => handleQuestionChange(qIndex, "short_answer", e.target.value)}
                                            />
                                        </div>
                                    )
                                }
                            </div>
                        ))}
                    </div>
                    {
                        errors.length > 0 && (
                            <div className="mb-4 bg-red-100 p-2 rounded text-red-700">
                                <ul>
                                    {errors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )
                    }
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
                </form >
            </div >
        </Modal>
    );
};

export default AssessmentForm;
