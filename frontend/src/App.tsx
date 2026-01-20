import { Routes, Route } from "react-router";
import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.min.css";
import "froala-editor/js/plugins.pkgd.min.js";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from 'react-hot-toast';
import Home from "./pages/Dashboard/Home";
import UserProfiles from "./pages/UserProfiles";
import Instructors from "./pages/Users/instructors/Instructors";
import DeleteInstructor from "./pages/Users/instructors/DeleteInstructor";
import ViewInstructor from "./pages/Users/instructors/ViewInstructor";
import StudentGroup from "./pages/Users/groups/StudentGroup";
import DeleteGroup from "./pages/Users/groups/DeleteGroup";
import ViewGroup from "./pages/Users/groups/ViewGroup";
import Users from "./pages/Users/students/Learners";
import DeleteLearner from "./pages/Users/students/DeleteLearner";
import Courses from "./pages/Courses/Courses";
import CourseForm from "./components/Forms/CourseForm";
import DeleteCourse from "./pages/Courses/DeleteCourse";
import ViewCourse from "./pages/Courses/ViewCourse";
import UserCourse from "./pages/Courses/UserCourse";
import DeleteLesson from "./pages/Courses/DeleteLesson";
import DeleteAssessment from "./pages/Courses/DeleteAssessment";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import ViewLearner from "./pages/Users/students/ViewLearner";
import StudentCourses from "./pages/Courses/StudentCourses";
import StudentCourseView from "./pages/Courses/StudentCourseView"

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>

          <Route path="/profile" element={<UserProfiles />} />


          <Route element={<ProtectedRoute allowedRoles={["admin", "instructor"]} />}>
            <Route index path="/" element={<Home />} />
            {/* Others Page */}

            {/*Instructor Routes */}
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/instructors/:instructorId/delete" element={<DeleteInstructor />} />
            <Route path='/instructors/:instructorId' element={<ViewInstructor />} />

            {/*Group Routes */}
            <Route path="/student-group" element={<StudentGroup />} />
            <Route path='/groups/:groupId/delete' element={<DeleteGroup />} />
            <Route path='/groups/:groupId' element={<ViewGroup />} />

            {/*student Routes */}
            <Route path="/learners" element={<Users />} />
            <Route path='/learners/:userId/delete' element={<DeleteLearner />} />
            <Route path='/learners/:userId' element={<ViewLearner />} />

            {/*Course Routes */}
            <Route path="/courses" element={<Courses />} />
            <Route path='/add-course' element={<CourseForm />} />
            <Route path='/courses/:courseId/edit' element={<CourseForm />} />
            <Route path='/courses/:courseId/delete' element={<DeleteCourse />} />
            <Route path='/courses/:courseId' element={<ViewCourse />} />
            <Route path='/courses/:courseId/module/:moduleId/delete' element={<DeleteLesson />} />
            <Route path='/courses/:courseId/assessment/:assessmentId/delete' element={<DeleteAssessment />} />
            <Route path="/courses/:courseId/user-view" element={<UserCourse />} />
          </Route>


          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route index path="/me/" element={<StudentCourses />} />
            <Route index path="/me/course/:courseId" element={<StudentCourseView />} />
          </Route>
        </Route>

        {/* Auth Layout */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="bottom-right" containerStyle={{
        zIndex: 99999,
      }} reverseOrder={false} />
    </>
  );
}
