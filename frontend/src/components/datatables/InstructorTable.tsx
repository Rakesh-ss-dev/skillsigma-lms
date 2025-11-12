import { useEffect, useState } from "react";
import { DataTable } from "../tables/Datatables/DataTable"
import API from "../../api/axios";
import { useModal } from "../../hooks/useModal";
import { Link, useNavigate } from "react-router";
import { Pen, Trash } from "lucide-react";
import Button from "../ui/button/Button";
import { ColumnDef } from "@tanstack/react-table";
import StudentsForm from "../Forms/UserForm";

const InstructorTable = () => {
    interface User {
        id: number,
        first_name: string,
        last_name: string,
        username: string,
        email: string,
        phone: string,
    }
    const editUser = (userId: any) => {
        setUserId(userId)
        openModal();
    }

    const columns: ColumnDef<User>[] = [
        { accessorKey: "first_name", header: "First Name" },
        { accessorKey: "last_name", header: "Last Name" },
        { accessorKey: "username", header: "Username" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "phone", header: 'Phone' },
        {
            accessorKey: "actions", header: "Actions", cell: ({ row }: any) => (
                <>
                    <div className="flex justify-center gap-3">

                        <Button onClick={() => { editUser(row.original.id) }} className="px-3 py-2 text-sm rounded bg-primary-100 text-blue-700 flex flex-row gap-1 items-center"><Pen className="h-4" />Edit</Button>
                        <Link to={`${row.original.id}/delete`} className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 flex flex-row gap-1 items-center"><Trash className="h-4" />Delete</Link>
                    </div>

                </>
            )
        }
    ];
    const { isOpen, openModal, closeModal } = useModal();
    const [users, setUsers] = useState<User[]>([]);
    const [userId, setUserId] = useState();
    const getUsers = async () => {
        const resp: any = await API.get('instructors/');
        setUsers(resp.data.results);
    }

    useEffect(() => {
        getUsers();
    }, [isOpen, closeModal])
    const navigate = useNavigate();
    return (
        <div className="space-y-6">
            <DataTable<User> data={users} columns={columns} onRowClick={(row) => { navigate(`/instructors/${row.id}`) }} />
            <StudentsForm isOpen={isOpen} closeModal={closeModal} mode="edit" userId={userId} userRole='instructor' />
        </div>
    )
}

export default InstructorTable