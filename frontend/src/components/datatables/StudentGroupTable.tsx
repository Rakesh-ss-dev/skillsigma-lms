
import { DataTable } from "../tables/Datatables/DataTable"
import API from "../../api/axios";
import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

const StudentGroupTable = () => {
    interface StudentGroup {
        id: number;
        name: string;
        description: string;
        memberCount: number;
    }
    const [groupData, setGroupData] = useState<StudentGroup[]>([]);
    const getGroupData = async () => {
        // Fetch or generate data for student groups
        const response = await API.get("/group")
        setGroupData(response.data);
    }
    useEffect(() => {
        getGroupData();
    }, []);
    const columns: ColumnDef<StudentGroup>[] = [
        { accessorKey: "id", header: "Group ID" },
        { accessorKey: "name", header: "Group Name" },
        { accessorKey: "description", header: "Description" },
        { accessorKey: "memberCount", header: "Members" },
    ];
    return (
        <div>
            <h2>Student Group Table</h2>
            <DataTable columns={columns} data={groupData} />
        </div>
    )
}

export default StudentGroupTable