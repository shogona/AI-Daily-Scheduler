import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScheduleItem, CalendarEvent } from './types';
import { generateSchedule } from './services/geminiService';
import TaskInput from './components/TaskInput';
import ScheduleView from './components/ScheduleView';
import NotificationBell from './components/NotificationBell';

// WARNING: Hardcoding keys is a security risk. Use environment variables in production.
const GOOGLE_CLIENT_ID = '98233438211-3tm4mi2jn5cet36k6v34t9t2ai8mgtji.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyA2Ij2ePwUEAO-anhZTEuJQsFEoJ7mlpvg';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar'; // Changed to read/write for adding events
const IS_CALENDAR_FEATURE_AVAILABLE = !!(GOOGLE_CLIENT_ID && GOOGLE_API_KEY);

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<string[]>(Array(5).fill(''));
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const notificationTimeouts = useRef<number[]>([]);

  const [startTime, setStartTime] = useState<string>('06:00');
  const [endTime, setEndTime] = useState<string>('23:00');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState<boolean>(false);
  const [useCalendar, setUseCalendar] = useState<boolean>(true);
  const [isGapiClientReady, setIsGapiClientReady] = useState<boolean>(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState<boolean>(false);
  
  let tokenClient = useRef<any>(null);

  useEffect(() => {
    if (!IS_CALENDAR_FEATURE_AVAILABLE) {
      setError("Google APIの認証情報が設定されていません。カレンダー連携は無効です。");
      setUseCalendar(false);
    }
  }, []);

  const fetchCalendarEvents = useCallback(async () => {
    setIsCalendarLoading(true);
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
        setError("カレンダーの予定取得に失敗しました: " + (err.message || JSON.stringify(err)));
    } finally {
        setIsCalendarLoading(false);
    }
  }, []);

  const initializeGapiClient = useCallback(async () => {
    try {
        await window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        setIsGapiClientReady(true);
    } catch (err: any) {
        let errorMessage = '不明なエラーです。';
        if (err) {
            if (err.message) {
                errorMessage = err.message;
            } else if (err.result?.error?.message) {
                errorMessage = err.result.error.message;
            } else {
                try {
                    errorMessage = JSON.stringify(err);
                } catch {
                    errorMessage = String(err);
                }
            }
        }
        setError("Google API Clientの初期化に失敗しました: " + errorMessage);
    }
  }, []);
  
  useEffect(() => {
    if (isAuthed && isGapiClientReady && useCalendar) {
        fetchCalendarEvents();
    }
  }, [isAuthed, isGapiClientReady, useCalendar, fetchCalendarEvents]);


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
              window.gapi.client.setToken(tokenResponse);
              setIsAuthed(true);
            }
            setIsAuthLoading(false);
          },
        });
    } catch(err: any) {
        setError("Google Identity Serviceの初期化に失敗しました: " + (err.message || JSON.stringify(err)));
    }
  }, []);

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
      const tasksAsString = tasks.filter(t => t.trim() !== '').join('\n');
      const eventsToUse = useCalendar && IS_CALENDAR_FEATURE_AVAILABLE ? calendarEvents : [];
      const newSchedule = await generateSchedule(tasksAsString, startTime, endTime, eventsToUse);
      setSchedule(newSchedule);
    } catch (err: any)
{
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
  
  const handleAddScheduleToCalendar = async () => {
    if (!isAuthed || schedule.length === 0) {
      alert('カレンダーと連携してから、スケジュールを作成してください。');
      return;
    }

    setIsAddingToCalendar(true);
    setError(null);

    try {
      const batch = window.gapi.client.newBatch();
      const today = new Date();
      
      schedule.forEach(item => {
        const [startTimeStr, endTimeStr] = item.time.split(' - ');
        if (!startTimeStr || !endTimeStr) return;

        const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number);

        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHours, startMinutes);
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHours, endMinutes);
        
        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }

        const event = {
          'summary': `${item.emoji} ${item.task}`,
          'start': { 'dateTime': startDate.toISOString() },
          'end': { 'dateTime': endDate.toISOString() },
        };

        batch.add(window.gapi.client.calendar.events.insert({
          'calendarId': 'primary',
          'resource': event,
        }));
      });

      await batch;
      alert(`${schedule.length}件の予定をGoogleカレンダーに追加しました。`);

    } catch (err: any) {
      setError("カレンダーへの予定追加に失敗しました: " + (err.result?.error?.message || err.message || JSON.stringify(err)));
    } finally {
      setIsAddingToCalendar(false);
    }
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
            calendarEvents={calendarEvents}
            isCalendarLoading={isCalendarLoading}
          />

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">エラー: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <ScheduleView 
            schedule={schedule}
            onAddToCalendar={handleAddScheduleToCalendar}
            isAddingToCalendar={isAddingToCalendar}
            isAuthed={isAuthed}
          />
        </main>

        <footer className="text-center mt-12 py-4">
        </footer>
      </div>
    </div>
  );
};

export default App;
