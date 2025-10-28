import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/tables/Datatables/DataTable";
import API from "../../api/axios";
import { useModal } from "../../hooks/useModal";
import StudentsForm from "../../components/Forms/StudentsForm";
import Button from "../../components/ui/button/Button";
export default function Users() {
    interface User {
        id: number,
        first_name: string,
        last_name: string,
        username: string,
        email: string,
        phone: string,
    }

    const columns: ColumnDef<User>[] = [
        { accessorKey: "first_name", header: "First Name" },
        { accessorKey: "last_name", header: "Last Name" },
        { accessorKey: "username", header: "User Name" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "Phone", header: 'Phone' }
    ];
    const [users, setUsers] = useState<User[]>([]);
    const getUsers = async () => {
        const resp: any = await API.get('users');
        setUsers(resp.data.results);
    }
    useEffect(() => {
        getUsers();
    }, [])
    const { isOpen, openModal, closeModal } = useModal();
    return (
        <>
            <PageMeta
                title="Skill Sigma LMS | Learners"
                description="List of users"
            />
            <PageBreadcrumb pageTitle="Learners" />
            <div className="flex align-end justify-end py-3">
                <Button onClick={openModal}>Add Student</Button>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">

                <div className="space-y-6">
                    <DataTable<User> data={users} columns={columns} />
                </div>
            </div>
            <StudentsForm isOpen={isOpen} closeModal={closeModal} />
        </>
    );
}
