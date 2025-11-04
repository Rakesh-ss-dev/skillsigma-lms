
import PageBreadcrumb from "../../components/common/PageBreadCrumb"
import PageMeta from "../../components/common/PageMeta"
import StudentGroupTable from "../../components/datatables/StudentGroupTable"
import GroupForm from "../../components/Forms/GroupForm"
import Button from "../../components/ui/button/Button"
import { useModal } from "../../hooks/useModal"
interface StudentGroup {
    id: number;
    name: string;
    description: string;
    created_at: string;
}
const StudentGroup = () => {
    const { isOpen, openModal, closeModal } = useModal();

    return (
        <>
            <PageMeta
                title="Skill Sigma LMS | Learners"
                description="List of users"
            />
            <PageBreadcrumb pageTitle="Learner Groups" />

            <div className="flex align-end justify-end py-3">
                <Button onClick={openModal}>Add Group</Button>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">

                <div className="space-y-6">
                    <StudentGroupTable />
                </div>
            </div>
            <GroupForm isOpen={isOpen} closeModal={closeModal} mode={'add'} />
        </>

    )
}

export default StudentGroup