import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../tables/Datatables/DataTable"
import { Link, useParams } from "react-router";
import { Pen, Trash } from "lucide-react";
import LessonForm from "../Forms/LessonForm";
import { useModal } from "../../hooks/useModal";
import Button from "../ui/button/Button";
import { useState } from "react";

interface Lesson {
    id: number,
    title: string,
    content_file: string,
    content: string,
    video_url: string,
    order: number,
    resources: string,
    action: string,
}

const LessonTable = ({ lessons }: { lessons: Lesson[] }) => {
    const { id } = useParams();
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedLessonId, setSelectedLessonId] = useState<number>(0);
    const editAction = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        openModal();
        setSelectedLessonId(id);
    }
    const columns: ColumnDef<Lesson>[] = [
        {
            accessorKey: "title", header: "Title", cell: ({ getValue }) => {
                const title = getValue<string>();
                return <a href='' className="text-blue-600 hover:text-blue-800">{title}</a>
            }
        },
        {
            accessorKey: "content_file",
            header: "Content File",
            cell: ({ getValue }) => {
                const fileUrl = getValue<string>();
                return fileUrl ? (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        Download
                    </a>
                ) : (
                    "N/A"
                );
            },
        },
        {
            accessorKey: "video_url", header: "Video URL", cell: ({ getValue }) => {
                const fileUrl = getValue<string>();
                return fileUrl ? (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        View
                    </a>
                ) : (
                    "N/A"
                );
            },
        },
        {
            accessorKey: "resources",
            header: "Resource File",
            cell: ({ getValue }) => {
                const fileUrl = getValue<string>();
                return fileUrl ? (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600  hover:text-blue-800"
                    >
                        Download
                    </a>
                ) : (
                    "N/A"
                );
            },
        },
        {
            accessorKey: "actions", header: "Actions", cell: ({ row }: any) => (
                <>
                    <div className="flex justify-center gap-3">

                        <Button onClick={(e) => editAction(e, row.original.id)} className="px-3 py-2 text-sm rounded bg-primary-100 text-blue-700 flex flex-row gap-1 items-center"><Pen className="h-4" />Edit</Button>
                        <Link to={`/courses/${id}/module/${row.original.id}/delete`} className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 flex flex-row gap-1 items-center"><Trash className="h-4" />Delete</Link>
                    </div>

                </>
            )
        },

    ];
    return (
        <>
            <DataTable<Lesson> data={lessons} columns={columns} />
            <LessonForm isOpen={isOpen} closeModal={closeModal} mode="edit" lessonId={selectedLessonId} />
        </>
    )
}

export default LessonTable