import { Routes, Route } from "react-router";
import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.min.css";
import "froala-editor/js/plugins.pkgd.min.js";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from 'react-hot-toast';

import { lazy } from "react";
export default function App() {
  const SignIn = lazy(() => import('./pages/AuthPages/SignIn'));
  const SignUp = lazy(() => import('./pages/AuthPages/SignUp'));
  const NotFound = lazy(() => import('./pages/OtherPage/NotFound'));
  const UserProfiles = lazy(() => import('./pages/UserProfiles'));
  const Home = lazy(() => import('./pages/Dashboard/Home'));
  const Users = lazy(() => import('./pages/Users/students/Learners'))
  const Courses = lazy(() => import("./pages/Courses/Courses"));
  const CourseForm = lazy(() => import("./components/Forms/CourseForm"));
  const DeleteCourse = lazy(() => import("./pages/Courses/DeleteCourse"));
  const ViewCourse = lazy(() => import("./pages/Courses/ViewCourse"));
  const DeleteAssessment = lazy(() => import("./pages/Courses/DeleteAssessment"));
  const DeleteLesson = lazy(() => import("./pages/Courses/DeleteLesson"));
  const DeleteLearner = lazy(() => import("./pages/Users/students/DeleteLearner"));
  const StudentGroup = lazy(() => import("./pages/Users/groups/StudentGroup"));
  const DeleteGroup = lazy(() => import("./pages/Users/groups/DeleteGroup"));
  const Instructors = lazy(() => import("./pages/Users/instructors/Instructors"));
  const DeleteInstructor = lazy(() => import("./pages/Users/instructors/DeleteInstructor"));
  const ViewInstructor = lazy(() => import("./pages/Users/instructors/ViewInstructor"));
  const ViewGroup = lazy(() => import("./pages/Users/groups/ViewGroup"));
  const ViewLearner = lazy(() => import("./pages/Users/students/ViewLearner"));

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
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>

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
