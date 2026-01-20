import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, QuizAnswerState, SubmissionPayload, SubmissionResult } from '../util/types';
import API from '../../api/axios';

interface QuizPlayerProps {
    quizId: number;
    onClose?: () => void;
}

type QuizStatus = 'loading' | 'error' | 'playing' | 'submitting' | 'finished';

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizId, onClose }) => {
    const [status, setStatus] = useState<QuizStatus>('loading');
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentIdx, setCurrentIdx] = useState<number>(0);
    const [answers, setAnswers] = useState<QuizAnswerState>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [result, setResult] = useState<SubmissionResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [strikes, setStrikes] = useState(0);
    const maxStrikes = 2;

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await API.get<Quiz>(`quiz/${quizId}/`);
                setQuiz(response.data);
                if (response.data.time_limit) {
                    setTimeLeft(response.data.time_limit * 60);
                }
                setStatus('playing');
            } catch (err) {
                setStatus('error');
            }
        };
        fetchQuiz();
    }, [quizId]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerViolation();
            }
        };

        const handleWindowBlur = () => {
            triggerViolation();
        };

        const triggerViolation = () => {
            setStrikes((prev) => {
                const newStrikes = prev + 1;

                if (newStrikes >= maxStrikes) {
                    alert("Final Warning: You have switched tabs too many times. The quiz is being auto-submitted.");
                    handleSubmit(); // Trigger your existing submit function
                } else {
                    alert(`Warning ${newStrikes}/${maxStrikes}: Please do not leave this tab. Switching windows again will submit your quiz automatically.`);
                }

                return newStrikes;
            });
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [strikes]);

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
            const response = await API.post<SubmissionResult>('/submission/', payload);
            setResult(response.data);
            setStatus('finished');
        } catch (err) {
            setErrorMsg("Failed to submit answers. Please try again.");
            setStatus('playing');
        }
    }, [quiz, answers]);

    useEffect(() => {
        if (status !== 'playing' || timeLeft === 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status, timeLeft, handleSubmit]);

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

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-64 py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="text-center p-6 text-red-600 py-10 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                <h3 className="font-bold">Error Loading Quiz</h3>
                <p className="text-sm">Please refresh or try again later.</p>
            </div>
        );
    }

    if (quiz?.is_completed || (status === 'finished' && result)) {
        return (
            <div className="max-w-md mx-auto bg-white py-10 dark:bg-gray-900 shadow-lg rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Quiz Completed!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Your answers have been submitted successfully.</p>
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors w-full font-medium"
                >
                    Return to Course
                </button>
            </div>
        );
    }

    if (!quiz) return null;
    const question = quiz.questions[currentIdx];
    const currentAnswer = answers[question.id] || {};
    const isLastQuestion = currentIdx === quiz.questions.length - 1;

    return (
        <div className="max-w-3xl mx-auto w-full bg-white py-10 dark:bg-gray-900 shadow-xl rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div>
                    <h1 className="text-base font-bold text-gray-800 dark:text-white truncate max-w-[200px] md:max-w-xs">{quiz.title}</h1>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                        <span className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded font-bold">
                            {currentIdx + 1} / {quiz.questions.length}
                        </span>
                        <span>Progress: {getProgress()}%</span>
                    </div>
                </div>

                {timeLeft > 0 && (
                    <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-700 dark:text-gray-300'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-800 h-1">
                <div
                    className="bg-brand-500 h-1 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}
                />
            </div>

            {/* Question Body */}
            <div className="p-6 flex-grow">
                <div className="mb-5">
                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-1 block">
                        {question.question_type === 'mcq' ? 'Multiple Choice' :
                            question.question_type === 'tf' ? 'True / False' : 'Short Answer'}
                    </span>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                        {question.text}
                    </h2>
                </div>

                <div className="space-y-2">
                    {(question.question_type === 'mcq' || question.question_type === 'tf') && (
                        <div className="grid gap-2">
                            {question.options.map((option) => {
                                const isSelected = currentAnswer.selected_option === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => handleOptionSelect(question.id, option.id)}
                                        className={`group p-3 border-2 rounded-lg text-left transition-all duration-200 flex items-center gap-3
                                            ${isSelected
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                                                : 'border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-500/30 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                                            ${isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className={`text-sm ${isSelected ? 'text-brand-900 dark:text-brand-400 font-medium' : 'text-gray-700 dark:text-gray-400'}`}>
                                            {option.text}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {question.question_type === 'short' && (
                        <textarea
                            className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-lg focus:border-brand-500 outline-none text-sm text-gray-800 dark:text-gray-200 transition-all"
                            rows={4}
                            placeholder="Type your answer here..."
                            value={currentAnswer.text_answer || ''}
                            onChange={(e) => handleTextChange(question.id, e.target.value)}
                        />
                    )}
                </div>
            </div>
            {strikes > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 font-bold">
                                Integrity Warning: {strikes} of {maxStrikes} attempts used.
                                Switching tabs again will submit your answers.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Error Message */}
            {errorMsg && (
                <div className="px-6 py-2 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs text-center border-t border-red-200 dark:border-red-500/20">
                    {errorMsg}
                </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <button
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentIdx === 0 || status === 'submitting'}
                    className="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                >
                    Previous
                </button>

                {isLastQuestion ? (
                    <button
                        onClick={handleSubmit}
                        disabled={status === 'submitting'}
                        className="px-5 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {status === 'submitting' ? 'Submitting...' : 'Finish & Submit'}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentIdx(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                        className="px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-bold hover:bg-brand-600 transition-all"
                    >
                        Next Question
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizPlayer;