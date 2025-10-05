import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScheduleItem, CalendarEvent } from './types';
import { generateSchedule } from './services/geminiService';
import TaskInput from './components/TaskInput';
import ScheduleView from './components/ScheduleView';
import NotificationBell from './components/NotificationBell';

// These should be in .env file in a real app
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.API_KEY; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const IS_CALENDAR_FEATURE_AVAILABLE = !!(GOOGLE_CLIENT_ID && GOOGLE_API_KEY);

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<string>('');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const notificationTimeouts = useRef<NodeJS.Timeout[]>([]);

  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('22:00');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [useCalendar, setUseCalendar] = useState<boolean>(true);
  
  let tokenClient = useRef<any>(null);

  useEffect(() => {
    if (!IS_CALENDAR_FEATURE_AVAILABLE) {
      setError("Google APIの認証情報が設定されていません。カレンダー連携は無効です。");
      setUseCalendar(false);
    }
  }, []);

  const fetchCalendarEvents = useCallback(async () => {
    try {
      const today = new Date();
      const timeMin = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const timeMax = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': timeMin,
        'timeMax': timeMax,
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime'
      });
      setCalendarEvents(response.result.items);
    } catch (err: any) {
        setError("カレンダーの予定取得に失敗しました: " + err.message);
    }
  }, []);

  const initializeGapiClient = useCallback(async () => {
    try {
        await window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
    } catch (err: any) {
        setError("Google API Clientの初期化に失敗しました: " + err.message);
    }
  }, []);

  const gapiLoaded = useCallback(() => {
    window.gapi.load('client', initializeGapiClient);
  }, [initializeGapiClient]);

  const gisLoaded = useCallback(() => {
    try {
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              setIsAuthed(true);
              fetchCalendarEvents();
            }
            setIsAuthLoading(false);
          },
        });
    } catch(err: any) {
        setError("Google Identity Serviceの初期化に失敗しました: " + err.message);
    }
  }, [fetchCalendarEvents]);

  useEffect(() => {
    if (!IS_CALENDAR_FEATURE_AVAILABLE) {
      return;
    }

    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = gapiLoaded;
    document.body.appendChild(gapiScript);

    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = gisLoaded;
    document.body.appendChild(gisScript);

    return () => {
        if (gapiScript.parentNode) gapiScript.parentNode.removeChild(gapiScript);
        if (gisScript.parentNode) gisScript.parentNode.removeChild(gisScript);
    }
  }, [gapiLoaded, gisLoaded]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const scheduleNotifications = useCallback((newSchedule: ScheduleItem[]) => {
    notificationTimeouts.current.forEach(clearTimeout);
    notificationTimeouts.current = [];

    if (notificationPermission !== 'granted') return;

    const now = new Date();
    newSchedule.forEach(item => {
      const startTimeStr = item.time.split(' - ')[0];
      const [hours, minutes] = startTimeStr.split(':').map(Number);
      
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes, 0, 0);

      const delay = notificationTime.getTime() - now.getTime();

      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          new Notification('次のタスクの時間です！', {
            body: `${item.task} (${item.time})`,
            icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⏰</text></svg>',
          });
        }, delay);
        notificationTimeouts.current.push(timeoutId);
      }
    });
  }, [notificationPermission]);
  
  useEffect(() => {
    if (schedule.length > 0) {
      scheduleNotifications(schedule);
    }
  }, [schedule, scheduleNotifications]);

  const handleAuthClick = () => {
    if (tokenClient.current) {
        setIsAuthLoading(true);
        tokenClient.current.requestAccessToken({prompt: 'consent'});
    }
  };

  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const eventsToUse = useCalendar && IS_CALENDAR_FEATURE_AVAILABLE ? calendarEvents : [];
      const newSchedule = await generateSchedule(tasks, startTime, endTime, eventsToUse);
      setSchedule(newSchedule);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert('このブラウザはデスクトップ通知をサポートしていません。');
      return;
    }
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <NotificationBell 
        permission={notificationPermission}
        requestPermission={requestNotificationPermission}
      />
      <div className="container mx-auto max-w-2xl">
        <header className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
            <span className="text-blue-600 dark:text-blue-500">AI</span> Daily Scheduler
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            今日のタスクをAIが最適な一日のプランに組み立てます。
          </p>
        </header>

        <main className="space-y-8">
          <TaskInput
            tasks={tasks}
            setTasks={setTasks}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            onSubmit={handleGenerateSchedule}
            isLoading={isLoading}
            onAuthClick={handleAuthClick}
            isAuthed={isAuthed}
            isAuthLoading={isAuthLoading}
            useCalendar={useCalendar}
            setUseCalendar={setUseCalendar}
            isCalendarFeatureAvailable={IS_CALENDAR_FEATURE_AVAILABLE}
          />

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">エラー: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <ScheduleView schedule={schedule} />
        </main>

        <footer className="text-center mt-12 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Powered by Gemini API.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default App;