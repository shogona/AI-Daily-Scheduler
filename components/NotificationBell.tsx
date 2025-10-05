
import React from 'react';

interface NotificationBellProps {
  permission: NotificationPermission;
  requestPermission: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ permission, requestPermission }) => {
  const getIcon = () => {
    switch (permission) {
      case 'granted':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'denied':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917m-4.28 0A6.002 6.002 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getText = () => {
    switch (permission) {
      case 'granted':
        return '通知はオンです';
      case 'denied':
        return '通知はブロックされています';
      default:
        return '通知を有効にする';
    }
  };

  const isDisabled = permission === 'granted' || permission === 'denied';

  return (
    <button
      onClick={requestPermission}
      disabled={isDisabled}
      className="fixed top-4 right-4 flex items-center space-x-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-4 py-2 rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {getIcon()}
      <span className="text-sm font-medium">{getText()}</span>
    </button>
  );
};

export default NotificationBell;
   