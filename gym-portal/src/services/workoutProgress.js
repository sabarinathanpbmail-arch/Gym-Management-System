/**
 * Aurum Gym Management System — Workout Progress Tracking Service
 * Manages real-time synchronization of member workout completion between Member Dashboard & My Progress.
 */

// Legacy cleanup to ensure no previous mock 80% progress remains in user's browser
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('gym_workout_sessions_')) {
        localStorage.removeItem(key);
      }
    });
  }
} catch (e) {
  // Ignore localStorage access errors
}

export const DEFAULT_WORKOUT_DAYS = [
  { id: 0, dayNum: 1, title: 'Day 1: Upper Body Push & Core', focus: 'Bench Press, Incline DB Press, Cable Flyes & Planks', target: '4 Sets × 10 Reps' },
  { id: 1, dayNum: 2, title: 'Day 2: Lower Body Power & Posterior Chain', focus: 'Barbell Squats, Romanian Deadlifts & Calf Raises', target: '4 Sets × 8-12 Reps' },
  { id: 2, dayNum: 3, title: 'Day 3: Upper Body Pull & Hypertrophy', focus: 'Weighted Pull-ups, Barbell Rows, Bicep Curls', target: '4 Sets × 10 Reps' },
  { id: 3, dayNum: 4, title: 'Day 4: Overhead Press & Shoulder Accents', focus: 'Military Press, Lateral Raises, Face Pulls', target: '3 Sets × 12 Reps' },
  { id: 4, dayNum: 5, title: 'Day 5: Functional Core & Conditioning Split', focus: 'Core conditioning circuit, plank variations & HIIT', target: 'Active Routine' }
];

/**
 * Parses workout schedule string into daily split items.
 */
export const parseWorkoutScheduleDays = (scheduleStr) => {
  if (!scheduleStr) {
    return DEFAULT_WORKOUT_DAYS;
  }
  const lines = scheduleStr.split(/\r?\n|\. /).map(s => s.trim()).filter(s => s.length > 3);
  if (lines.length >= 2) {
    return lines.map((line, idx) => ({
      id: idx,
      dayNum: idx + 1,
      title: line.includes(':') ? line.split(':')[0] : `Day ${idx + 1}: Scheduled Split`,
      focus: line.includes(':') ? line.split(':').slice(1).join(':').trim() : line,
      target: 'Target Routine'
    }));
  }
  return [
    { id: 0, dayNum: 1, title: 'Day 1: Upper Body Push & Core', focus: 'Bench Press, Incline DB Press, Cable Flyes & Planks', target: '4 Sets × 10 Reps' },
    { id: 1, dayNum: 2, title: 'Day 2: Lower Body Power & Posterior Chain', focus: 'Barbell Squats, Romanian Deadlifts & Calf Raises', target: '4 Sets × 8-12 Reps' },
    { id: 2, dayNum: 3, title: 'Day 3: Upper Body Pull & Hypertrophy', focus: 'Weighted Pull-ups, Barbell Rows, Bicep Curls', target: '4 Sets × 10 Reps' },
    { id: 3, dayNum: 4, title: 'Day 4: Overhead Press & Shoulder Accents', focus: 'Military Press, Lateral Raises, Face Pulls', target: '3 Sets × 12 Reps' },
    { id: 4, dayNum: 5, title: 'Day 5: Functional Core & Conditioning Split', focus: scheduleStr, target: 'Active Routine' }
  ];
};

/**
 * Standardized storage key based on user email or ROWID.
 */
export const getWorkoutStorageKey = (userOrId) => {
  let uid = 'member';
  if (userOrId) {
    if (typeof userOrId === 'object') {
      uid = userOrId.email || userOrId.user_email || userOrId.ROWID || userOrId.id || 'member';
    } else {
      uid = String(userOrId).trim();
    }
  }
  return `gym_workout_progress_v3_${uid.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
};

/**
 * Returns saved progress object { [dayIndex]: boolean }.
 * Defaults strictly to {} (0% completion).
 */
export const getSavedWorkoutProgress = (userOrId) => {
  if (typeof window === 'undefined') return {};
  try {
    const key = getWorkoutStorageKey(userOrId);
    const data = localStorage.getItem(key);
    if (!data) return {};
    const parsed = JSON.parse(data);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    return {};
  }
};

/**
 * Saves progress to localStorage and dispatches real-time custom event so all views update instantly.
 */
export const saveWorkoutProgress = (userOrId, completedSessions) => {
  if (typeof window === 'undefined') return;
  try {
    const key = getWorkoutStorageKey(userOrId);
    const safeData = typeof completedSessions === 'object' && completedSessions !== null ? completedSessions : {};
    localStorage.setItem(key, JSON.stringify(safeData));
    window.dispatchEvent(new CustomEvent('gym_workout_progress_updated', {
      detail: { key, userOrId, completedSessions: safeData }
    }));
  } catch (e) {
    console.error('Failed to save workout progress:', e);
  }
};

/**
 * Calculates current completion statistics based on completed sessions.
 * Returns 0% by default if no sessions are marked complete.
 */
export const calculateWorkoutStats = (completedSessions = {}, totalDays = 5) => {
  const safeSessions = typeof completedSessions === 'object' && completedSessions !== null ? completedSessions : {};
  const completedCount = Object.values(safeSessions).filter(Boolean).length;
  const days = totalDays > 0 ? totalDays : 5;
  const percentage = Math.min(100, Math.round((completedCount / days) * 100));
  return {
    completedCount,
    totalDays: days,
    percentage,
    streak: completedCount,
    isComplete: completedCount >= days && days > 0
  };
};
