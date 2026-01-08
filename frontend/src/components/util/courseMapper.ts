import { ApiCourse, UIState, ContentItem } from './types';

export const mapApiToUI = (apiData: ApiCourse): UIState => {
  
  // 1. Convert Lessons to ContentItems
  const lessonItems: ContentItem[] = apiData.lessons.map(l => ({
    id: l.id, 
    type: 'lesson',
    title: l.title,
    content: l.content, // HTML
    video_url: l.video_url,
    pdf_version:l.pdf_version,
    completed: false, 
    locked: false, 
    resources: l.resources,
    _order: l.order || 0
  }));

  // 2. Convert Quizzes to ContentItems
  const quizItems: ContentItem[] = apiData.quizzes.map(q => ({
    id: q.id + 10000, // Offset ID to prevent collision with lesson IDs
    quizId: q.id,     // Keep real DB ID for API calls
    type: 'quiz',
    title: q.title,
    description: q.description,
    completed: false,
    locked: true,     // Quizzes locked by default
    _prereq: q.prerequisite_lesson
  }));

  // 3. Sort Lessons by Order
  lessonItems.sort((a, b) => (a._order || 0) - (b._order || 0));

  const finalStructure: ContentItem[] = [];
  const lessonIds = new Set(lessonItems.map(l => l.id));

  // 4. Interleave: Lessons first, then their dependent quizzes
  lessonItems.forEach(lesson => {
    finalStructure.push(lesson);

    // Find quizzes that require THIS lesson
    const dependentQuizzes = quizItems.filter(q => q._prereq === lesson.id);
    finalStructure.push(...dependentQuizzes);
  });

  // 5. Append Standalone Quizzes (prereq is null or invalid)
  const standaloneQuizzes = quizItems.filter(q => !q._prereq || !lessonIds.has(q._prereq));
  finalStructure.push(...standaloneQuizzes);

  // 6. Calculate initial locking (Unlock only the first item)
  finalStructure.forEach((item, index) => {
    item.locked = index > 0; 
  });

  return {
    courseId: apiData.id,
    title: apiData.title,
    progress: 0,
    curriculum: finalStructure // This is what the component needs
  };
};