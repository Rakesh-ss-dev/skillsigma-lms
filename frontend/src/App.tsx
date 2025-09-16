import { Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
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


            <Route path="/courses" element={<Courses />} />
            <Route path='/add-course' element={<CourseForm />} />
            <Route path='/courses/:id/edit' element={<CourseForm />} />
            <Route path='/courses/:id/delete' element={<DeleteCourse />} />
            <Route path='/courses/:id' element={<ViewCourse />} />



            <Route path="/enrollments" element={<Enrollments />} />
            <Route path='/quizes' element={<Quiz />} />
            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
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
