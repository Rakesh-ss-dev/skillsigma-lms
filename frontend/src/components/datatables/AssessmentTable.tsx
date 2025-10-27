
import { DataTable } from "../tables/Datatables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import Button from "../ui/button/Button";
import { Link, useParams } from "react-router";
import { Pen, Trash } from "lucide-react";
interface Assessment {
    id: number;
    title: string;
    description: string;
}

const AssessmentTable = ({ quizzes }: { quizzes: Assessment[] }) => {
    const { courseId } = useParams();
    const columns: ColumnDef<Assessment>[] = [
        { accessorKey: "title", header: "Title" },
        { accessorKey: "description", header: "Description" },
        {
            accessorKey: "id", header: "Actions", cell: ({ getValue }) => {
                const id = getValue<number>();
                return (
                    <div className="flex justify-center gap-3">

                        <Button className="px-3 py-2 text-sm rounded bg-primary-100 text-blue-700 flex flex-row gap-1 items-center"><Pen className="h-4" />Edit</Button>
                        <Link to={`/courses/${courseId}/assessment/${id}/delete`} className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 flex flex-row gap-1 items-center"><Trash className="h-4" />Delete</Link>
                    </div>
                );
            }
        },
    ];

    return (
        <DataTable data={quizzes} columns={columns} />
    )
}

export default AssessmentTable