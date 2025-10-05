
export interface ScheduleItem {
  time: string;
  task: string;
  emoji: string;
}

export interface CalendarEvent {
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}
