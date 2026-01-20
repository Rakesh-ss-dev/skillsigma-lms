import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // 1. Detect role to handle layout spacing
  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const isStudent = user.role === 'student';

  // 2. Determine the left margin based on role and sidebar state
  const getMarginClass = () => {
    if (isStudent) return "ml-0"; // No sidebar, no margin
    if (isMobileOpen) return "ml-0";
    return isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";
  };

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop will handle their own null-returns/visibility internally */}
      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${getMarginClass()}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
