
import { DataTable } from "../tables/Datatables/DataTable"
import { ColumnDef } from "@tanstack/react-table";
import formatDateTime from "../util/formateDateTime";
import GroupForm from "../Forms/GroupForm";
import { useModal } from "../../hooks/useModal";
import Button from "../ui/button/Button";
import { Link } from "react-router";
import { Pen, Trash } from "lucide-react";
import { useState } from "react";
interface StudentGroup {
    id: number;
    name: string;
    description: string;
    created_at: string;
}
const StudentGroupTable = ({ groupData }: { groupData: StudentGroup[] }) => {
    const { openModal, isOpen, closeModal } = useModal();
    const [groupId, setgroupId] = useState();
    const editAction = (e: any, id: any) => {
        e.preventDefault();
        console.log(e, id);
        setgroupId(id);
        openModal();
    }
    const columns: ColumnDef<StudentGroup>[] = [
        { accessorKey: "id", header: "Group ID" },
        { accessorKey: "name", header: "Group Name" },
        { accessorKey: "description", header: "Description" },
        {
            accessorKey: "created_at", header: "Created On", cell: ({ getValue }) => {
                const created_at = getValue<string>();
                return formatDateTime(created_at);
            }
        },
        {
            accessorKey: "actions", header: "Actions", cell: ({ row }: any) => (
                <>
                    <div className="flex justify-center gap-3">

                        <Button onClick={(e) => editAction(e, row.original.id)} className="px-3 py-2 text-sm rounded bg-primary-100 text-blue-700 flex flex-row gap-1 items-center"><Pen className="h-4" />Edit</Button>
                        <Link to={`/groups/${row.original.id}/delete`} className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 flex flex-row gap-1 items-center"><Trash className="h-4" />Delete</Link>
                    </div>

                </>
            )
        },
    ];
    return (
        <div>
            <h2>Student Group Table</h2>
            <DataTable<StudentGroup> columns={columns} data={groupData} />
            <GroupForm isOpen={isOpen} closeModal={closeModal} mode={'edit'} groupId={groupId} />
        </div>

    )
}

export default StudentGroupTable