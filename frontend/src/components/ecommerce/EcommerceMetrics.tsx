import { Book, Users } from "lucide-react";
import API from "../../api/axios";
import { useEffect, useState } from "react";
interface Course {
  id: number;
  title: string;
  category: { id: number, name: string }[],
  thumbnail: string,
  created_at: string,
  action?: string,
}

export default function EcommerceMetrics() {
  const [users, setUsers] = useState<any[]>([]);
  const getUsers = async () => {
    const resp: any = await API.get('users');
    setUsers(resp.data.results);
  }
  const [courses, setCourses] = useState<Course[]>([]);
  const getCourses = async () => {
    const response: any = await API.get('courses');
    setCourses(response.data.results)
  }
  useEffect(() => {
    getUsers();
    getCourses()
  }, [])
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Users className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Students
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {users.length}
            </h4>
          </div>

        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Book className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Courses
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {courses.length}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
