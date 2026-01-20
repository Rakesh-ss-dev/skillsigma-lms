import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDownIcon, GridIcon, HorizontaLDots } from "../icons";
import { RiUserSettingsLine } from "react-icons/ri";
import { SiBookstack } from "react-icons/si";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const COMMON_ITEMS = {
  dashboard: { icon: <GridIcon />, name: "Dashboard", path: "/" },
  courses: { icon: <SiBookstack />, name: "Courses", path: "/courses" },
};

const MENU_CONFIG: Record<string, NavItem[]> = {
  admin: [
    COMMON_ITEMS.dashboard,
    COMMON_ITEMS.courses,
    {
      icon: <RiUserSettingsLine />,
      name: "Users",
      subItems: [
        { name: "Student Group", path: "/student-group" },
        { name: "Learners", path: "/learners" },
        { name: "Instructors", path: "/instructors" },
      ],
    },
  ],
  instructor: [
    COMMON_ITEMS.dashboard,
    COMMON_ITEMS.courses,
    {
      icon: <RiUserSettingsLine />,
      name: "Users",
      subItems: [
        { name: "Student Group", path: "/student-group" },
        { name: "Learners", path: "/learners" },
      ],
    },
  ],
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  // Role Logic
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const role = user.role || "student";

  // State for submenus
  const [openSubmenu, setOpenSubmenu] = useState<{ type: string; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const navItems = useMemo(() => MENU_CONFIG[role] || [], [role]);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  // Handle submenu height calculations
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  // --- EARLY RETURN FOR STUDENTS ---
  if (role === "student") return null;

  const handleSubmenuToggle = (index: number, menuType: string) => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: string) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={index}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className={`menu-item-icon-size ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-icon-active" : "menu-item-icon-inactive"
                }`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className="menu-item-text">{nav.name}</span>
                  <ChevronDownIcon className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""
                    }`} />
                </>
              )}
            </button>
          ) : (
            <Link to={nav.path || "#"} className={`menu-item group ${isActive(nav.path!) ? "menu-item-active" : "menu-item-inactive"}`}>
              <span className={`menu-item-icon-size ${isActive(nav.path!) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
            </Link>
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height: openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? `${subMenuHeight[`${menuType}-${index}`]}px`
                  : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((sub) => (
                  <li key={sub.name}>
                    <Link to={sub.path} className={`menu-dropdown-item ${isActive(sub.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}>
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 text-gray-900 h-screen transition-all duration-300 z-50 border-r border-gray-200 dark:border-gray-800
        ${isExpanded || isHovered || isMobileOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          <img className="dark:hidden w-full h-10" src="/images/logo/logo.svg" alt="Logo" />
          <img className="hidden dark:block w-full h-10" src="/images/logo/logo-dark.svg" alt="Logo" />
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto no-scrollbar">
        <nav className="mb-6">
          <h2 className={`mb-4 text-xs uppercase text-gray-400 ${!isExpanded && !isHovered ? "lg:flex lg:justify-center" : "flex"}`}>
            {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
          </h2>
          {renderMenuItems(navItems, "main")}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;