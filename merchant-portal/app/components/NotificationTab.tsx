import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';

export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationTab() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Listen for custom events to add notifications
  useEffect(() => {
    function handleNewNotification(e: CustomEvent) {
      setNotifications((prev) => [
        {
          id: crypto.randomUUID(),
          message: e.detail.message,
          timestamp: new Date().toLocaleString(),
          read: false,
        },
        ...prev,
      ]);
    }
    window.addEventListener('neda-notification', handleNewNotification as EventListener);
    return () => window.removeEventListener('neda-notification', handleNewNotification as EventListener);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-800"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <FaBell size={20} />
        {notifications.some(n => !n.read) && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{notifications.filter(n => !n.read).length}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="font-semibold text-slate-800 dark:text-white">Notifications</span>
            <button className="text-xs text-blue-600 hover:underline bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-full font-semibold transition" onClick={markAllRead}>Mark all as read</button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {notifications.length === 0 ? (
              <div className="p-4 text-slate-500 dark:text-slate-400">No notifications yet.</div>
            ) : notifications.map((n) => (
              <div key={n.id} className={`p-4 ${n.read ? '' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                <div className="text-sm text-slate-900 dark:text-white">{n.message}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
