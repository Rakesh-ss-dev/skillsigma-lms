import React from 'react';
import { Play, CheckCircle, Lock, Award, X } from 'lucide-react';
import { ContentItem } from '../util/types';

interface SidebarProps {
    items: ContentItem[];
    activeItem: ContentItem;
    onItemClick: (item: ContentItem) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const CurriculumSidebar: React.FC<SidebarProps> = ({
    items, activeItem, onItemClick, isOpen, onClose
}) => {
    return (
        <>
            <aside
                className={`
          fixed inset-y-0 right-0 w-80 lg:w-96 bg-white border-l shadow-xl z-30 
          transform transition-transform duration-300 ease-in-out mt-19
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
            >
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center h-14">
                        <h3 className="font-bold text-gray-800">Curriculum</h3>
                        <button onClick={onClose} className="lg:hidden text-gray-500"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {items.map((item, index) => {
                            const isActive = activeItem.id === item.id;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => !item.locked && onItemClick(item)}
                                    className={`
                    p-4 border-b transition-all flex items-start group relative
                    ${item.locked ? 'cursor-not-allowed opacity-60 bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}
                    ${isActive ? 'bg-gray-100 border-l-4 border-l-black' : 'border-l-4 border-l-transparent'}
                  `}
                                >
                                    <div className="mt-1 mr-3 flex-shrink-0">
                                        {item.locked ? <Lock size={16} className="text-gray-400" /> :
                                            item.completed ? <CheckCircle size={16} className="text-green-600" /> :
                                                item.type === 'quiz' ? <Award size={16} className={isActive ? "text-black" : "text-gray-500"} /> :
                                                    <Play size={16} className={isActive ? "text-black" : "text-gray-500"} />
                                        }
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium leading-tight mb-1 ${isActive ? 'text-black' : 'text-gray-700'}`}>
                                            {index + 1}. {item.title}
                                        </p>
                                        <div className="flex items-center text-xs text-gray-500 space-x-2">
                                            <span className={`px-1.5 py-0.5 rounded ${item.type === 'quiz' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                                {item.type === 'quiz' ? 'Quiz' : 'Learning'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm mt-16" onClick={onClose} />
            )}
        </>
    );
};