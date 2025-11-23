// components/ui/NotificationCenter.tsx
'use client';
import React from 'react';
import { X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "./alert";

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
}

interface ShowNotificationDetail {
  title: string;
  message: string;
  type: NotificationType;
}

interface UseNotificationResult {
  showNotification: (title: string, message: string, type: NotificationType) => void;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const addNotification = (title: string, message: string, type: NotificationType = 'info'): void => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, message, type }]);
/*     if (navigator.vibrate) {
        navigator.vibrate(200); // Vibrate for 200ms, adjust duration as desired
      } */
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number): void => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  React.useEffect(() => {
    const handleShowNotification = (event: CustomEvent<ShowNotificationDetail>) => {
      const { title, message, type } = event.detail;
      addNotification(title, message, type);
    };

    window.addEventListener('show-notification', handleShowNotification as EventListener);
    
    return () => {
      window.removeEventListener('show-notification', handleShowNotification as EventListener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="transform transition-all duration-500 ease-in-out"
        >
          <Alert
            className={`relative shadow-lg ${
              notification.type === 'success' ? 'bg-green-50 border-green-200' :
              notification.type === 'error' ? 'bg-red-50 border-red-200' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-200"
            >
              <X size={16} />
            </button>
            <AlertTitle className="text-sm font-medium">
              {notification.title}
            </AlertTitle>
            <AlertDescription className="text-xl font-bold">
              {notification.message}
            </AlertDescription>
          </Alert>
        </div>
      ))}
    </div>
  );
};

const useNotification = (): UseNotificationResult => {
  const [notificationCenter] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const element = document.createElement('div');
      element.id = 'notification-center';
      document.body.appendChild(element);
      return element;
    }
    return null;
  });

  const showNotification = React.useCallback((title: string, message: string, type: NotificationType): void => {
    const event = new CustomEvent('show-notification', {
      detail: { title, message, type }
    });
    window.dispatchEvent(event);
  }, []);

  return { showNotification };
};

export { NotificationCenter, useNotification };
export type { NotificationType };