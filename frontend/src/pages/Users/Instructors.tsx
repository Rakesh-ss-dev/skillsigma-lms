import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/tables/Datatables/DataTable";
import API from "../../api/axios";

export default function Instructors() {
    interface Instructor {
        id: number,
        first_name: string,
        last_name: string,
        username: string,
        email: string,
        phone: string,
    }

    const columns: ColumnDef<Instructor>[] = [
        { accessorKey: "first_name", header: "First Name" },
        { accessorKey: "last_name", header: "Last Name" },
        { accessorKey: "username", header: "User Name" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "phone", header: 'Phone' }
    ];
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const getInstructors = async () => {
        const resp: any = await API.get('instructors/');
        setInstructors(resp.data.results);
    }
    useEffect(() => {
        getInstructors();
    }, [])
    return (
        <>
            <PageMeta
                title="Skill Sigma LMS | Instructors"
                description="List of Instructors"
            />
            <PageBreadcrumb pageTitle="Instructors" />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="space-y-6">
                    <DataTable<Instructor> data={instructors} columns={columns} />
                </div>
            </div>
        </>
    );
}
