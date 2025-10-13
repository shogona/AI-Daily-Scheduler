import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem, CalendarEvent } from '../types';

// WARNING: Hardcoding keys is a security risk. Use environment variables in production.
const API_KEY = 'AIzaSyA2Ij2ePwUEAO-anhZTEuJQsFEoJ7mlpvg';

if (!API_KEY) {
    throw new Error("API_KEY is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      time: {
        type: Type.STRING,
        description: "The time slot for the task in 'HH:mm - HH:mm' format.",
      },
      task: {
        type: Type.STRING,
        description: "A short, clear description of the task.",
      },
      emoji: {
        type: Type.STRING,
        description: "A single, relevant emoji for the task.",
      },
    },
    required: ["time", "task", "emoji"],
  },
};

const formatCalendarEvents = (events: CalendarEvent[]): string => {
    if (events.length === 0) {
        return "なし";
    }
    return events.map(event => {
        const startTime = event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '終日';
        const endTime = event.end?.dateTime ? new Date(event.end.dateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';
        return `- ${event.summary} (${startTime}${endTime ? ' - ' + endTime : ''})`;
    }).join('\n');
};

export const generateSchedule = async (tasks: string, startTime: string, endTime: string, calendarEvents: CalendarEvent[]): Promise<ScheduleItem[]> => {
  const prompt = `
    あなたは優秀なライフコーチ兼スケジューラです。以下の情報に基づき、現実的で生産的な1日のスケジュールを作成してください。

    # 前提条件
    - 1日の活動時間は ${startTime} から ${endTime} までとします。
    - 各タスクに適切な時間を割り当て、休憩時間（昼食、夕食、小休憩など）も必ず含めてください。
    - 確定済みの予定は変更せず、その空き時間にタスクを効率的に配置してください。
    - タスクリストが空の場合や無関係なテキストの場合は、サンプルスケジュールを生成してください。
    - 出力はJSON形式のオブジェクト配列でなければなりません。各オブジェクトは'time'（例: '09:00 - 10:30'）、'task'（タスクの短い説明）、'emoji'（タスクに関連する絵文字）の3つのキーを持つ必要があります。

    # 確定済みの予定
    ---
    ${formatCalendarEvents(calendarEvents)}
    ---

    # 今日やりたいタスクリスト
    ---
    ${tasks}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    const scheduleData = JSON.parse(jsonText);
    
    if (Array.isArray(scheduleData)) {
      return scheduleData;
    } else {
      console.error("Parsed response is not an array:", scheduleData);
      return [];
    }

  } catch (error) {
    console.error("Error generating schedule:", error);
    throw new Error("スケジュールの生成に失敗しました。後でもう一度お試しください。");
  }
};
