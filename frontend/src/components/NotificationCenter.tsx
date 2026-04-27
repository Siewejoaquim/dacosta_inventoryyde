import React, { useEffect, useState } from 'react';
import { RiNotification3Line, RiCloseLine, RiCheckLine } from 'react-icons/ri';
import api from '../api/client';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.unreadCount);
    } catch (error: any) {
      // Silently fail if notifications endpoint doesn't exist yet (404)
      if (error.response?.status === 404) {
        console.log('Notifications endpoint not yet available');
        return;
      }
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete('/notifications');
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return '#f59e0b'; // amber
      case 'UNPAID_INVOICE':
        return '#ef4444'; // red
      case 'PRODUCT_REQUEST':
        return '#3b82f6'; // blue
      case 'PAYMENT_RECEIVED':
        return '#10b981'; // green
      case 'INVOICE_CREATED':
        return '#8b5cf6'; // purple
      case 'EXPENSE_LOGGED':
        return '#ec4899'; // pink
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.5rem',
          color: '#6b7280',
          position: 'relative',
          padding: '0.5rem',
          borderRadius: '6px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
          (e.currentTarget as HTMLElement).style.color = '#111827';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'none';
          (e.currentTarget as HTMLElement).style.color = '#6b7280';
        }}
      >
        <RiNotification3Line size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '0.5rem',
            width: '380px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Notifications</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                }}
              >
                <RiCloseLine size={18} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6',
                    background: notif.isRead ? 'white' : '#f9fafb',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = notif.isRead ? 'white' : '#f9fafb';
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {/* Icon */}
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: getNotificationColor(notif.type),
                        marginTop: '0.5rem',
                        flexShrink: 0,
                      }}
                    />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            fontWeight: notif.isRead ? 500 : 600,
                            color: '#111827',
                          }}
                        >
                          {notif.title}
                        </h4>
                        <button
                          onClick={() => handleDelete(notif._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#d1d5db',
                            padding: '0.25rem',
                          }}
                        >
                          <RiCloseLine size={14} />
                        </button>
                      </div>

                      <p
                        style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          lineHeight: 1.4,
                        }}
                      >
                        {notif.message}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#2563eb',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center',
              }}
            >
              <button
                onClick={handleDeleteAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
