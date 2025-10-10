# Efficiency Report: AI Daily Scheduler

## Executive Summary

This report documents efficiency issues identified in the AI Daily Scheduler codebase. The analysis focused on performance bottlenecks, redundant code, and opportunities for optimization. Four key issues were identified, ranging from high to low impact. One critical issue (duplicate environment variable definition) has been fixed in this PR.

---

## Findings

### 1. Duplicate Environment Variable Definition (HIGH IMPACT) ✅ FIXED

**Location:** `vite.config.ts`, lines 14-15

**Issue:**
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
},
```

Two environment variables (`process.env.API_KEY` and `process.env.GEMINI_API_KEY`) are both set to the same value (`env.GEMINI_API_KEY`). This is redundant and:
- Wastes memory by storing the same value twice
- Creates confusion about which variable should be used
- Increases bundle size unnecessarily

Additionally, `process.env.GOOGLE_CLIENT_ID` is used in `App.tsx` but is not defined in the vite config.

**Impact:** High - Affects bundle size and code clarity

**Recommended Fix:**
- Remove the duplicate `process.env.GEMINI_API_KEY` definition
- Add the missing `process.env.GOOGLE_CLIENT_ID` definition
- Keep only `process.env.API_KEY` for consistency with the codebase

**Status:** ✅ Fixed in this PR

---

### 2. Inefficient Date Object Creation (MEDIUM IMPACT)

**Location:** `App.tsx`, lines 49-51 (in `fetchCalendarEvents` function)

**Issue:**
```typescript
const today = new Date();
const timeMin = new Date(today.setHours(0, 0, 0, 0)).toISOString();
const timeMax = new Date(today.setHours(23, 59, 59, 999)).toISOString();
```

The code creates a `Date` object and mutates it twice. The `setHours` method mutates the original object and returns the timestamp, which is then used to create a new `Date` object. This is inefficient because:
- It creates unnecessary Date objects
- The mutation pattern is harder to read and understand
- The original `today` variable ends up being modified unintentionally

**Impact:** Medium - Called every time calendar events are fetched

**Recommended Fix:**
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
const timeMin = today.toISOString();

const endOfDay = new Date(today);
endOfDay.setHours(23, 59, 59, 999);
const timeMax = endOfDay.toISOString();
```

This approach:
- Creates fewer Date objects
- Makes the code more readable
- Avoids unnecessary wrapper Date constructors

---

### 3. Time Parsing on Every Render (MEDIUM IMPACT)

**Location:** `components/ScheduleView.tsx`, lines 43-47

**Issue:**
```typescript
{schedule.map((item, index) => {
  const startTimeStr = item.time.split(' - ')[0];
  const endTimeStr = item.time.split(' - ')[1];
  const startTime = parseTime(startTimeStr);
  const endTime = parseTime(endTimeStr);
  // ...
})}
```

The `parseTime` function is called for every schedule item on every render (which happens every minute due to the `setInterval` in the component). This means:
- Time strings are parsed repeatedly even though they don't change
- String operations (`split`) are performed unnecessarily
- CPU cycles are wasted on redundant calculations

**Impact:** Medium - Runs every minute and scales with number of schedule items

**Recommended Fix:**
Use `useMemo` to cache parsed times:
```typescript
const parsedSchedule = useMemo(() => {
  return schedule.map(item => {
    const [startTimeStr, endTimeStr] = item.time.split(' - ');
    return {
      ...item,
      startTime: parseTime(startTimeStr),
      endTime: parseTime(endTimeStr)
    };
  });
}, [schedule]);

// Then in render:
{parsedSchedule.map((item, index) => {
  const isPast = currentTime > item.endTime;
  const isCurrent = currentTime >= item.startTime && currentTime <= item.endTime;
  // ...
})}
```

This ensures parsing only happens when the schedule changes, not on every render cycle.

---

### 4. Redundant Date Formatting in Calendar Event Mapping (LOW IMPACT)

**Location:** `services/geminiService.ts`, lines 37-41

**Issue:**
```typescript
return events.map(event => {
    const startTime = event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '終日';
    const endTime = event.end?.dateTime ? new Date(event.end.dateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';
    return `- ${event.summary} (${startTime}${endTime ? ' - ' + endTime : ''})`;
}).join('\n');
```

While not a major issue, the code creates new `Date` objects inside the map function for each event. For users with many calendar events, this could be slightly inefficient.

**Impact:** Low - Only called once when generating schedule, and most users won't have hundreds of events

**Recommended Fix:**
The current implementation is acceptable for most use cases. If optimization is needed for users with many calendar events:
```typescript
const formatTime = (dateTimeStr: string | undefined): string => {
    if (!dateTimeStr) return '';
    return new Date(dateTimeStr).toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

return events.map(event => {
    const startTime = event.start?.dateTime ? formatTime(event.start.dateTime) : '終日';
    const endTime = event.end?.dateTime ? formatTime(event.end.dateTime) : '';
    return `- ${event.summary} (${startTime}${endTime ? ' - ' + endTime : ''})`;
}).join('\n');
```

This is more of a code organization improvement than a performance optimization.

---

## Recommendations for Future Improvements

1. **Consider React.memo for components** - Components like `ScheduleItem` and `TaskInput` could benefit from memoization to prevent unnecessary re-renders when their props haven't changed.

2. **Debounce user input** - The `handleTaskChange` function in `TaskInput` updates state on every keystroke, which triggers re-renders. Consider debouncing for better performance with many tasks.

3. **Optimize notification scheduling** - The current implementation clears and reschedules all notifications when the schedule changes. Consider only scheduling new notifications for items that weren't in the previous schedule.

4. **Code splitting** - The Google API scripts are loaded even when calendar integration is disabled. Consider lazy loading these scripts only when needed.

5. **Environment variable consistency** - Consider standardizing on a single naming convention for environment variables (either all prefixed with `VITE_` for client-side access or properly handled through the vite config).

---

## Conclusion

The most critical issue (duplicate environment variable definition) has been addressed in this PR. The other issues documented here are opportunities for future optimization and can be tackled incrementally based on actual performance needs and user feedback.

Total issues identified: **4**  
Issues fixed in this PR: **1**  
Remaining optimization opportunities: **3**
