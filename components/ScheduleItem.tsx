
import React from 'react';
import { ScheduleItem as ScheduleItemType } from '../types';

interface ScheduleItemProps {
  item: ScheduleItemType;
  isPast: boolean;
  isCurrent: boolean;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({ item, isPast, isCurrent }) => {
  const containerClasses = `
    flex items-start space-x-4 p-4 rounded-lg transition-all duration-300
    ${isPast ? 'bg-slate-100 dark:bg-slate-800 opacity-60' : 'bg-white dark:bg-slate-700 shadow-md'}
    ${isCurrent ? 'ring-2 ring-blue-500 scale-105 shadow-lg' : ''}
  `;

  return (
    <div className={containerClasses}>
      <div className="text-3xl flex-shrink-0 mt-1">{item.emoji}</div>
      <div className="flex-grow">
        <p className={`font-bold text-slate-800 dark:text-slate-100 ${isPast ? 'line-through' : ''}`}>
          {item.task}
        </p>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {item.time}
        </p>
      </div>
    </div>
  );
};

export default ScheduleItem;
   