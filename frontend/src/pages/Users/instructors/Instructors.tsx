
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import InstructorTable from "../../../components/datatables/InstructorTable";
import Button from "../../../components/ui/button/Button";
import StudentsForm from "../../../components/Forms/UserForm";
import { useModal } from "../../../hooks/useModal";


export default function Instructors() {
    const { openModal, isOpen, closeModal } = useModal();
    return (
        <>
            <PageMeta
                title="Skill Sigma LMS | Instructors"
                description="List of Instructors"
            />
            <PageBreadcrumb pageTitle="Instructors" />
            <div className="flex align-end justify-end py-3">
                <Button onClick={openModal}>Add Instructor</Button>
                <StudentsForm isOpen={isOpen} closeModal={closeModal} mode="create" userRole="instructor" />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <InstructorTable />
            </div>
        </>
    );
}
