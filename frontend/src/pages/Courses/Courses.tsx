import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api/axios";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/tables/Datatables/DataTable";
import formatDateTime from "../../components/util/formateDateTime";
import { Link } from "react-router";
import { Pen, Trash } from "lucide-react";

export default function Courses() {
    interface Course {
        id: number;
        title: string;
        category: { id: number, name: string }[],
        thumbnail: string,
        created_at: string,
        action?: string,
    }
    const columns: ColumnDef<Course>[] = [
        {
            accessorKey: "title", header: "Course", cell: ({ row }) => (
                <Link className="flex items-center justify-center gap-3" to={`/courses/${row.original.id}`} >
                    {row.original.thumbnail && <img src={row.original.thumbnail} alt={row.original.title} className="h-10 w-10 rounded object-cover" />}
                    <span>{row.original.title}</span>
                </Link>
            )
        },
        {
            accessorKey: "categories",
            header: "Categories",
            cell: ({ row }: any) => (
                <div className="flex flex-wrap gap-1 justify-center">
                    {row.original.categories?.map((cat: any) => (
                        <span
                            key={cat.id}
                            className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"
                        >
                            {cat.name}
                        </span>
                    ))}
                </div>
            ),
        },
        { accessorKey: "created_at", header: "Created At", accessorFn: (row) => formatDateTime(row.created_at) },
        {
            accessorKey: "actions", header: "Actions", cell: ({ row }: any) => (
                <div className="flex justify-center gap-3">
                    <Link to={`/courses/${row.original.id}/edit`} className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-700 flex flex-row gap-1 items-center"><Pen className="h-4" /> Edit</Link>
                    <Link to={`/courses/${row.original.id}/delete`} className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 flex flex-row gap-1 items-center"><Trash className="h-4" />Delete</Link>
                </div>
            )
        },
    ];
    const [courses, setCourses] = useState<Course[]>([]);
    const getCourses = async () => {
        const response: any = await API.get('courses');
        setCourses(response.data.results)
    }
    useEffect(() => {
        getCourses()
    }, [])
    return (
        <>
            <PageMeta
                title="Skill Sigma LMS | courses"
                description="courses"
            />
            <PageBreadcrumb pageTitle="Courses" />
            <DataTable<Course> data={courses} columns={columns} createLink="/add-course" createTitle="Add Course" defaultSort={{ id: 'created_at', desc: true }} />
        </>
    );
}
