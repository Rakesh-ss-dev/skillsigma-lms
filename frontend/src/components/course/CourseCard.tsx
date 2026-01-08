import { useNavigate } from "react-router";

const CourseCard = ({ enrollment }: any) => {
    const { course, progress } = enrollment;
    const progressPercent = parseFloat(progress || "0");
    const navigate = useNavigate();
    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100 overflow-hidden">
            {/* Thumbnail Section */}
            <div className="relative p-3 h-48 overflow-hidden bg-gray-200">
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}

                {/* Category Badge */}
                {course.categories && course.categories.length > 0 && (
                    <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            {course.categories[0].name}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {course.title}
                </h3>

                {/* Description */}
                <div
                    className="text-gray-500 text-sm mb-4 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: course.description || "" }}
                />

                {/* Meta Data */}
                <div className="flex items-center text-xs text-gray-400 mb-4 space-x-4">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        {course.lessons ? course.lessons.length : 0} Lessons
                    </div>
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </div>
                </div>

                {/* Progress Footer */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-bold text-indigo-600">{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>

                    <button onClick={() => { navigate(`/me/course/${course.id}`) }} className="mt-6 w-full bg-gray-900 hover:bg-indigo-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center group-hover:shadow-lg">
                        {progressPercent > 0 ? 'Continue Learning' : 'Start Course'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CourseCard