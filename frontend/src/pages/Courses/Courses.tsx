import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api/axios";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/tables/Datatables/DataTable";

export default function Courses() {
    interface Course {
        id: number;
        title: string;
        category: string[],
        thumbnail: string,
        created_at: string,
        instructor: string,
    }
    const columns: ColumnDef<Course>[] = [
        { accessorKey: "title", header: "Title" },
        { accessorKey: "category", header: "Categories" },
        { accessorKey: "instructor", header: "Instructor" },
        { accessorKey: "created_at", header: "Created At" },
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
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="space-y-6">
                    <DataTable<Course> data={courses} columns={columns} createLink="/add-course" createTitle="Add Course" />
                </div>
            </div>
        </>
    );
}
