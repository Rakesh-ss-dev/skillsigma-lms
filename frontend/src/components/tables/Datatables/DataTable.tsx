import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

interface DataTableProps<T extends object> {
    columns: ColumnDef<T, any>[];
    data: T[];
    createLink?: string;
    createTitle?: string;
    defaultSort?: { id: string; desc?: boolean };
    onRowClick?: (row: T) => void;
}

export function DataTable<T extends object>({
    columns,
    data,
    createLink,
    createTitle,
    defaultSort,
    onRowClick,
}: DataTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>(
        defaultSort ? [{ id: defaultSort.id, desc: defaultSort.desc ?? false }] : []
    );

    // 🔍 search state
    const [globalFilter, setGlobalFilter] = useState("");

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: "includesString", // built-in fuzzy search
        initialState: {
            sorting: defaultSort
                ? [{ id: defaultSort.id, desc: defaultSort.desc ?? false }]
                : [],
        },
    });

    return (
        <div className="p-4 bg-white rounded-xl shadow dark:bg-gray-800">
            {/* 🔍 Search + Create Button */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between gap-3">
                <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search..."
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />

                {createLink && (
                    <a
                        href={createLink}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        {createTitle || "Create"}
                    </a>
                )}
            </div>

            {/* Table */}
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-700">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                    {({
                                        asc: " 🔼",
                                        desc: " 🔽",
                                    }[header.column.getIsSorted() as string] ?? null)}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>

                <tbody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row.original)}
                                className="border-t text-center bg-white hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="text-center py-4 text-gray-500 dark:text-gray-400"
                            >
                                No results found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <span>
                    Page{" "}
                    <strong>
                        {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </strong>
                </span>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
