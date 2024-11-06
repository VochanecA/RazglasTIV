/* // hooks/useSpeechScheduler.ts
import { useEffect, useCallback } from 'react';

interface ScheduleConfig {
  startHour: number;
  endHour: number;
  intervalMinutes: number;
}

const SUMMER_SCHEDULE: ScheduleConfig = {
  startHour: 7,
  endHour: 20,
  intervalMinutes: 30
};

const WINTER_SCHEDULE: ScheduleConfig = {
  startHour: 7,
  endHour: 15,
  intervalMinutes: 30
};

const useSpeechScheduler = (onScheduledPlay: () => void) => {
  const isSummerPeriod = useCallback((date: Date): boolean => {
    // Get month and day for comparison (month is 0-based)
    const month = date.getMonth();
    const day = date.getDate();
    
    // Summer period: April 1 (3rd month) to October 29 (9th month)
    const isAfterApril1 = (month > 3) || (month === 3 && day >= 1);
    const beforeOctober30 = (month < 9) || (month === 9 && day <= 29);
    
    return isAfterApril1 && beforeOctober30;
  }, []);

  const isWithinOperatingHours = useCallback((date: Date, schedule: ScheduleConfig): boolean => {
    const hour = date.getHours();
    return hour >= schedule.startHour && hour < schedule.endHour;
  }, []);

  const getNextScheduledTime = useCallback((currentDate: Date): Date => {
    const schedule = isSummerPeriod(currentDate) ? SUMMER_SCHEDULE : WINTER_SCHEDULE;
    const now = new Date(currentDate);
    const next = new Date(currentDate);
    
    // If before operating hours, set to start time
    if (now.getHours() < schedule.startHour) {
      next.setHours(schedule.startHour, 0, 0, 0);
      return next;
    }
    
    // If after operating hours, set to start time of next day
    if (now.getHours() >= schedule.endHour) {
      next.setDate(next.getDate() + 1);
      next.setHours(schedule.startHour, 0, 0, 0);
      return next;
    }
    
    // Round up to next interval
    const minutes = now.getMinutes();
    const intervalMinutes = schedule.intervalMinutes;
    const nextIntervalMinutes = Math.ceil(minutes / intervalMinutes) * intervalMinutes;
    
    next.setMinutes(nextIntervalMinutes, 0, 0);
    
    // If next interval would be after operating hours, set to next day
    if (next.getHours() >= schedule.endHour) {
      next.setDate(next.getDate() + 1);
      next.setHours(schedule.startHour, 0, 0, 0);
    }
    
    return next;
  }, [isSummerPeriod]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      const now = new Date();
      const nextTime = getNextScheduledTime(now);
      const delay = nextTime.getTime() - now.getTime();

      timeoutId = setTimeout(() => {
        const currentDate = new Date();
        const schedule = isSummerPeriod(currentDate) ? SUMMER_SCHEDULE : WINTER_SCHEDULE;
        
        if (isWithinOperatingHours(currentDate, schedule)) {
          onScheduledPlay();
        }
        
        scheduleNext();
      }, delay);

      console.log(`Next announcement scheduled for: ${nextTime.toLocaleString()}`);
    };

    scheduleNext();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [getNextScheduledTime, isSummerPeriod, isWithinOperatingHours, onScheduledPlay]);
};

export default useSpeechScheduler; */


import { useEffect, useCallback } from 'react';

interface Schedule {
  startHour: number;
  endHour: number;
}

const INTERVAL_MINUTES = 30;

const useSpeechScheduler = (onScheduledPlay: () => void) => {
  const getSchedule = useCallback((): Schedule => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();
    
    // Summer schedule: April 1 (month 3) - October 29
    if ((month === 3 && day >= 1) || (month > 3 && month < 9) || (month === 9 && day <= 29)) {
      return { startHour: 7, endHour: 20 };
    }
    // Winter schedule
    return { startHour: 7, endHour: 15 };
  }, []);

  const isWithinOperatingHours = useCallback((): boolean => {
    const now = new Date();
    const schedule = getSchedule();
    const currentHour = now.getHours();
    
    return currentHour >= schedule.startHour && currentHour < schedule.endHour;
  }, [getSchedule]);

  const getNextPlayTime = useCallback((): Date => {
    const now = new Date();
    const schedule = getSchedule();
    const currentMinutes = now.getMinutes();
    
    // Calculate next interval
    const nextIntervalMinutes = Math.ceil(currentMinutes / INTERVAL_MINUTES) * INTERVAL_MINUTES;
    const nextPlayTime = new Date(now);
    nextPlayTime.setMinutes(nextIntervalMinutes, 0, 0);

    // If we're past the end hour, schedule for next day's start
    if (now.getHours() >= schedule.endHour) {
      nextPlayTime.setHours(schedule.startHour, 0, 0, 0);
      nextPlayTime.setDate(nextPlayTime.getDate() + 1);
    }
    // If we're before the start hour, schedule for today's start
    else if (now.getHours() < schedule.startHour) {
      nextPlayTime.setHours(schedule.startHour, 0, 0, 0);
    }

    return nextPlayTime;
  }, [getSchedule]);

  useEffect(() => {
    if (!isWithinOperatingHours()) {
      return;
    }

    const scheduleNextPlay = () => {
      const nextPlayTime = getNextPlayTime();
      const timeUntilNextPlay = nextPlayTime.getTime() - new Date().getTime();
      
      return setTimeout(() => {
        if (isWithinOperatingHours()) {
          onScheduledPlay();
        }
        scheduleNextPlay();
      }, timeUntilNextPlay);
    };

    const timeoutId = scheduleNextPlay();
    return () => clearTimeout(timeoutId);
  }, [isWithinOperatingHours, getNextPlayTime, onScheduledPlay]);
};

export default useSpeechScheduler;