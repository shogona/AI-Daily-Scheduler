
import React, { useState, useEffect } from 'react';
import { ScheduleItem as ScheduleItemType } from '../types';
import ScheduleItem from './ScheduleItem';

interface ScheduleViewProps {
  schedule: ScheduleItemType[];
}

const parseTime = (timeStr: string): Date => {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    now.setHours(hours, minutes, 0, 0);
    return now;
};

const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  if (schedule.length === 0) {
    return (
      <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">スケジュールがありません</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">上のボックスに今日のタスクを入力して、AIにスケジュールを作成してもらいましょう。</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-200 dark:border-slate-700">今日のプラン</h2>
      <div className="space-y-4">
        {schedule.map((item, index) => {
          const startTimeStr = item.time.split(' - ')[0];
          const endTimeStr = item.time.split(' - ')[1];
          const startTime = parseTime(startTimeStr);
          const endTime = parseTime(endTimeStr);

          const isPast = currentTime > endTime;
          const isCurrent = currentTime >= startTime && currentTime <= endTime;

          return (
            <ScheduleItem 
              key={index} 
              item={item} 
              isPast={isPast} 
              isCurrent={isCurrent}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleView;
   