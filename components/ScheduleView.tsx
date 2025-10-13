import React, { useState, useEffect } from 'react';
import { ScheduleItem as ScheduleItemType } from '../types';
import ScheduleItem from './ScheduleItem';

interface ScheduleViewProps {
  schedule: ScheduleItemType[];
  onAddToCalendar: () => void;
  isAddingToCalendar: boolean;
  isAuthed: boolean;
}

const parseTime = (timeStr: string): Date => {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    now.setHours(hours, minutes, 0, 0);
    return now;
};

const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, onAddToCalendar, isAddingToCalendar, isAuthed }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const handleCopySchedule = () => {
    if (navigator.clipboard) {
      const scheduleText = schedule.map(item => `${item.time} ${item.emoji} ${item.task}`).join('\n');
      navigator.clipboard.writeText(scheduleText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('コピーに失敗しました。');
      });
    }
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-2 border-b-2 border-slate-200 dark:border-slate-700 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">今日のプラン</h2>
        <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySchedule}
              className="flex items-center justify-center text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-2 px-3 rounded-lg transition-all duration-200"
            >
                {isCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
                {isCopied ? 'コピーしました!' : 'テキストをコピー'}
            </button>
            {isAuthed && (
                <button
                    onClick={onAddToCalendar}
                    disabled={isAddingToCalendar}
                    className="flex items-center justify-center text-sm bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-200 font-medium py-2 px-3 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isAddingToCalendar ? (
                        <svg className="animate-spin h-5 w-5 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            <path d="M10 12a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                        </svg>
                    )}
                    {isAddingToCalendar ? '追加中...' : 'カレンダーに追加'}
                </button>
            )}
        </div>
      </div>
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
