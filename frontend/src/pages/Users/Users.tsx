
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useModal } from "../../hooks/useModal";
import StudentsForm from "../../components/Forms/StudentsForm";
import Button from "../../components/ui/button/Button";
import StudentTable from "../../components/datatables/StudentTable";

export default function Users() {
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
                <StudentsForm isOpen={isOpen} closeModal={closeModal} mode="create" />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <StudentTable />
            </div>
        </>
    );
}
