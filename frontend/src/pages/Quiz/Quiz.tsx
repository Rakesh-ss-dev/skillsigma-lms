import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api/axios";
import { DataTable } from "../../components/tables/Datatables/DataTable";
import { ColumnDef } from "@tanstack/react-table";

export default function Quizes() {
    interface Quiz {
        course: string,
        title: string,
        description: string,
    }
    const [quizes, setQuizes] = useState<Quiz[]>([]);

    const getQuizes = async () => {
        const response = await API.get('quizzes');
        setQuizes(response.data.results)
    }
    useEffect(() => {
        getQuizes();
    }, [])
    const columns: ColumnDef<Quiz>[] = [
        { accessorKey: "course", header: "Course" },
        { accessorKey: "title", header: "Title" },
        { accessorKey: "description", header: "description" }
    ]
    return (
        <>
            <PageMeta
                title="Skill Sigma LMS | Quizes"
                description="List of Quizes"
            />
            <PageBreadcrumb pageTitle="Quizes" />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="space-y-6">
                    <DataTable<Quiz> data={quizes} columns={columns} />
                </div>
            </div>
        </>
    );
}
