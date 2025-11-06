import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

export default function Enrollments() {
    return (
        <>
            <PageMeta
                title="Skill Sigma LMS | Enrollments"
                description="Enrollments"
            />
            <PageBreadcrumb pageTitle="Enrollments" />
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="space-y-6">
                    Enrollments
                </div>
            </div>
        </>
    );
}
