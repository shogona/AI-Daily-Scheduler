import React from 'react';

interface TaskInputProps {
  tasks: string;
  setTasks: (tasks: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onAuthClick: () => void;
  isAuthed: boolean;
  isAuthLoading: boolean;
  useCalendar: boolean;
  setUseCalendar: (use: boolean) => void;
  isCalendarFeatureAvailable: boolean;
}

const TaskInput: React.FC<TaskInputProps> = ({ 
  tasks, setTasks, 
  startTime, setStartTime, 
  endTime, setEndTime, 
  onSubmit, isLoading, 
  onAuthClick, isAuthed, isAuthLoading,
  useCalendar, setUseCalendar,
  isCalendarFeatureAvailable
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="col-span-1 sm:col-span-1">
                <label htmlFor="start-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                起床時間
                </label>
                <input
                type="time"
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="col-span-1 sm:col-span-1">
                <label htmlFor="end-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                就寝時間
                </label>
                <input
                type="time"
                id="end-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                />
            </div>
             <div className={`col-span-1 sm:col-span-1 flex flex-col justify-between h-full ${!isCalendarFeatureAvailable ? 'opacity-50' : ''}`}>
                <label className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center ${isCalendarFeatureAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <input
                        type="checkbox"
                        id="use-calendar-toggle"
                        checked={useCalendar}
                        onChange={(e) => setUseCalendar(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500 mr-2"
                        disabled={!isCalendarFeatureAvailable}
                    />
                    カレンダー連携
                </label>
                <button
                    onClick={onAuthClick}
                    disabled={!useCalendar || isAuthed || isAuthLoading || !isCalendarFeatureAvailable}
                    className="w-full flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                    {isAuthLoading ? '連携中...' : isAuthed ? '連携済み' : 'Googleカレンダーと連携'}
                </button>
            </div>
        </div>

        <label htmlFor="task-input" className="block text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
          今日やりたいことリスト
        </label>
        <textarea
          id="task-input"
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
          placeholder="例： 朝の散歩(改行)プロジェクトの資料作成(改行)チームミーティング(改行)ジムでトレーニング(改行)読書"
          className="w-full h-40 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="mt-4 w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              生成中...
            </>
          ) : (
            'AIにスケジュールを作成してもらう'
          )}
        </button>
      </div>
    </div>
  );
};

export default TaskInput;