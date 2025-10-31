
import { DataTable } from "../tables/Datatables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import Button from "../ui/button/Button";
import { Link, useParams } from "react-router";
import { Pen, Trash } from "lucide-react";
import { useModal } from "../../hooks/useModal";

import AssessmentBuilder from "../Forms/AssessmentBuilder";
import { useState } from "react";
interface Assessment {
    id: number;
    title: string;
    description: string;
}

const AssessmentTable = ({ quizzes }: { quizzes: Assessment[] }) => {
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<number>(0);
    const editAction = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        setSelectedAssessmentId(id);
        openModal();
    }
    const { courseId } = useParams();
    const columns: ColumnDef<Assessment>[] = [
        { accessorKey: "title", header: "Title" },
        { accessorKey: "description", header: "Description" },
        {
            accessorKey: "id", header: "Actions", cell: ({ getValue }) => {
                const id = getValue<number>();
                return (
                    <div className="flex justify-center gap-3">
                        <Button onClick={(e) => editAction(e, id)}><Pen className="h-4" />Edit</Button>
                        <Link to={`/courses/${courseId}/assessment/${id}/delete`} className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 flex flex-row gap-1 items-center"><Trash className="h-4" />Delete</Link>
                    </div>
                );
            }
        },
    ];

    return (
        <>
            <DataTable data={quizzes} columns={columns} />
            <AssessmentBuilder isOpen={isOpen} closeModal={closeModal} mode="edit" assessmentId={selectedAssessmentId} />
        </>
    )
}

export default AssessmentTable