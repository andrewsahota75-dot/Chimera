import { useState, useEffect } from 'react';

export const useRealTimeUpdates = (intervalMs: number = 1000) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs]);
  
  return currentTime;
};

export const useLiveTimestamp = () => {
  const currentTime = useRealTimeUpdates(1000);
  
  return {
    currentTime,
    formatTime: (date: Date) => date.toLocaleTimeString(),
    formatDateTime: (date: Date) => date.toLocaleString(),
    formatRelativeTime: (timestamp: Date) => {
      const now = currentTime;
      const diff = now.getTime() - timestamp.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
  };
};