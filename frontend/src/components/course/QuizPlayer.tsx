import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, QuizAnswerState, SubmissionPayload, SubmissionResult } from '../util/types';
import API from '../../api/axios';


interface QuizPlayerProps {
    quizId: number;
    onClose?: () => void; // Optional: to close the modal or navigate away
}

type QuizStatus = 'loading' | 'error' | 'playing' | 'submitting' | 'finished';

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizId, onClose }) => {
    // --- State ---
    const [status, setStatus] = useState<QuizStatus>('loading');
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentIdx, setCurrentIdx] = useState<number>(0);
    const [answers, setAnswers] = useState<QuizAnswerState>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [result, setResult] = useState<SubmissionResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');

    // --- 1. Fetch Quiz ---
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await API.get<Quiz>(`quiz/${quizId}/`);
                setQuiz(response.data);

                // Initialize timer if exists
                if (response.data.time_limit) {
                    setTimeLeft(response.data.time_limit * 60); // Convert mins to seconds
                }
                setStatus('playing');
            } catch (err) {
                console.error("Failed to load quiz", err);
                setStatus('error');
            }
        };
        fetchQuiz();
    }, [quizId]);

    // --- 2. Timer Logic ---
    const handleSubmit = useCallback(async () => {
        if (!quiz) return;
        setStatus('submitting');

        const payload: SubmissionPayload = {
            quiz: quiz.id,
            answers: Object.entries(answers).map(([qId, data]: any) => ({
                question: parseInt(qId),
                selected_option: data.selected_option || null,
                text_answer: data.text_answer || ""
            }))
        };

        try {
            const response = await API.post<SubmissionResult>(
                '/submission/',
                payload
            );
            setResult(response.data);
            setStatus('finished');
        } catch (err) {
            console.error("Submission error", err);
            setErrorMsg("Failed to submit answers. Please try again.");
            setStatus('playing'); // Allow retry
        }
    }, [quiz, answers]);

    useEffect(() => {
        if (status !== 'playing' || timeLeft === 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, timeLeft, handleSubmit]);

    // --- 3. Input Handlers ---
    const handleOptionSelect = (qId: number, optId: number) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: { selected_option: optId, text_answer: null }
        }));
    };

    const handleTextChange = (qId: number, text: string) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: { selected_option: null, text_answer: text }
        }));
    };

    // --- 4. Render Helpers ---
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const getProgress = () => {
        if (!quiz) return 0;
        const answeredCount = Object.keys(answers).length;
        return Math.round((answeredCount / quiz.questions.length) * 100);
    };

    // --- RENDER STATES ---

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">
                <h3 className="text-lg font-bold">Error Loading Quiz</h3>
                <p>Please refresh the page or try again later.</p>
            </div>
        );
    }

    if (status === 'finished' && result) {
        return (
            <div className="max-w-xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden mt-10 text-center p-8">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
                <p className="text-gray-500 mb-6">Your answers have been submitted successfully.</p>
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors w-full font-medium"
                >
                    Return to Course
                </button>
            </div>
        );
    }

    // --- MAIN PLAYING UI ---
    if (!quiz) return null;
    const question = quiz.questions[currentIdx];
    const currentAnswer = answers[question.id] || {};
    const isLastQuestion = currentIdx === quiz.questions.length - 1;

    return (
        <div className="w-[90%] mx-auto bg-white shadow-xl rounded-xl overflow-hidden mt-6 flex flex-col">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">{quiz.title}</h1>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Q{currentIdx + 1} / {quiz.questions.length}
                        </span>
                        <span>Progress: {getProgress()}%</span>
                    </div>
                </div>

                {timeLeft > 0 && (
                    <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-1.5">
                <div
                    className="bg-blue-600 h-1.5 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}
                />
            </div>

            {/* Question Body */}
            <div className="p-8 flex-grow overflow-y-auto">
                <div className="mb-6">
                    <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2 block">
                        {question.question_type === 'mcq' ? 'Multiple Choice' :
                            question.question_type === 'tf' ? 'True / False' : 'Short Answer'}
                    </span>
                    <h2 className="text-2xl font-medium text-gray-900 leading-relaxed">
                        {question.text}
                    </h2>
                </div>

                <div className="space-y-3">
                    {/* Render Options: MCQ or TF */}
                    {(question.question_type === 'mcq' || question.question_type === 'tf') && (
                        <div className="grid gap-3">
                            {question.options.map((option) => {
                                const isSelected = currentAnswer.selected_option === option.id;
                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => handleOptionSelect(question.id, option.id)}
                                        className={`group p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between
                                            ${isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                                {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                            </div>
                                            <span className={`text-lg ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                                                {option.text}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Render Input: Short Answer */}
                    {question.question_type === 'short' && (
                        <textarea
                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-lg"
                            rows={5}
                            placeholder="Type your answer here..."
                            value={currentAnswer.text_answer || ''}
                            onChange={(e) => handleTextChange(question.id, e.target.value)}
                        />
                    )}
                </div>
            </div>

            {/* Error Message Toast */}
            {errorMsg && (
                <div className="px-8 py-2 bg-red-100 text-red-700 text-sm text-center">
                    {errorMsg}
                </div>
            )}

            {/* Footer / Navigation */}
            <div className="bg-gray-50 p-6 border-t flex justify-between items-center">
                <button
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentIdx === 0 || status === 'submitting'}
                    className="px-6 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>

                {isLastQuestion ? (
                    <button
                        onClick={handleSubmit}
                        disabled={status === 'submitting'}
                        className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        {status === 'submitting' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : 'Finish & Submit'}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentIdx(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                        Next Question
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizPlayer;