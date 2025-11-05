import { Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from 'react-hot-toast';
import Users from "./pages/Users/Users"
import Courses from "./pages/Courses/Courses";
import Enrollments from "./pages/Enrollments/Enrollments";
import Quiz from "./pages/Quiz/Quiz";
import InstructorProfiles from "./pages/Users/Instructors";
import CourseForm from "./components/Forms/CourseForm";
import DeleteCourse from "./pages/Courses/DeleteCourse";
import ViewCourse from "./pages/Courses/ViewCourse";
import DeleteAssessment from "./pages/Courses/DeleteAssessment";
import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.min.css";

import "froala-editor/js/plugins.pkgd.min.js"; // load all plugins
import Editor from "./components/Editor/RichTextEditor";
import DeleteLesson from "./pages/Courses/DeleteLesson";
import DeleteLearner from "./pages/Users/DeleteLearner";
import StudentGroup from "./pages/Users/groups/StudentGroup";
import DeleteGroup from "./pages/Users/groups/DeleteGroup";
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>

          <Route element={<ProtectedRoute allowedRoles={["admin", "instructor"]} />}>
            <Route index path="/" element={<Home />} />
            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/learners" element={<Users />} />
            <Route path="/instructors" element={<InstructorProfiles />} />
            <Route path="/student-group" element={<StudentGroup />} />
            <Route path='/groups/:groupId/delete' element={<DeleteGroup />} />
            <Route path='/learners/:userId/delete' element={<DeleteLearner />} />

            <Route path="/courses" element={<Courses />} />
            <Route path='/add-course' element={<CourseForm />} />
            <Route path='/courses/:courseId/edit' element={<CourseForm />} />
            <Route path='/courses/:courseId/delete' element={<DeleteCourse />} />
            <Route path='/courses/:courseId' element={<ViewCourse />} />
            <Route path='/courses/:courseId/module/:moduleId/delete' element={<DeleteLesson />} />
            <Route path='/courses/:courseId/assessment/:assessmentId/delete' element={<DeleteAssessment />} />
            <Route path="/editor" element={<Editor initialValue="" onChange={(html: any) => console.log(html)} />
            } />
            <Route path="/enrollments" element={<Enrollments />} />
            <Route path='/quizes' element={<Quiz />} />



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
