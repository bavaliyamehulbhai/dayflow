import React, { useState, useEffect } from 'react';
import { googleAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import WidgetWrapper from './WidgetWrapper';
import { Calendar, RefreshCw, ExternalLink, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { safeFormat } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const GoogleCalendarWidget = () => {
  const { user, updateUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isConnected = !!user?.googleCalendar?.email;

  const fetchEvents = async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const response = await googleAPI.getEvents();
      setEvents(response.data.events || []);
    } catch (err) {
      console.error(err);
      setError('Could not sync with Google Calendar.');
      // If unauthorized, it might be due to expired tokens that couldn't refresh
      if (err.response?.status === 400) {
        setError('Connection expired. Please reconnect.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected]);

  const handleConnect = async () => {
    try {
      const response = await googleAPI.getAuthUrl();
      // Pass userId in state for the callback to identify the user
      const authUrl = `${response.data.url}&state=${user._id}`;
      window.location.href = authUrl;
    } catch (err) {
      toast.error('Failed to initiate Google connection.');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your Google Calendar?')) return;
    try {
      await googleAPI.disconnect();
      updateUser({ ...user, googleCalendar: null });
      setEvents([]);
      toast.success('Disconnected from Google Calendar');
    } catch (err) {
      toast.error('Failed to disconnect.');
    }
  };

  return (
    <WidgetWrapper 
      title="Google Calendar" 
      icon={Calendar}
      action={isConnected && (
        <div className="flex gap-2">
          <button 
            onClick={fetchEvents} 
            className={`btn-icon-sm ${loading ? 'animate-spin' : ''}`}
            disabled={loading}
          >
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={handleDisconnect} 
            className="btn-icon-sm text-error"
            title="Disconnect"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    >
      <div className="google-calendar-widget">
        {!isConnected ? (
          <div className="connection-placeholder p-4 text-center">
            <div className="icon-badge-lg mb-4 mx-auto" style={{ background: 'rgba(124, 109, 250, 0.1)', color: 'var(--accent)' }}>
              <Calendar size={32} />
            </div>
            <h4 className="text-display mb-2" style={{ fontSize: '1.1rem' }}>Sync Your Schedule</h4>
            <p className="text-muted text-sm mb-6">
              Connect your Google Calendar to see your professional meetings alongside your personal tasks.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConnect}
              className="btn-premium w-full flex items-center justify-center gap-2"
            >
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" 
                alt="Google" 
                style={{ width: 18, height: 18 }} 
              />
              Connect Google Calendar
            </motion.button>
          </div>
        ) : (
          <div className="events-container">
            <div className="connected-badge mb-4 p-2 rounded-lg flex items-center gap-3" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
              <CheckCircle2 size={16} className="text-success" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-muted" style={{ fontSize: 9 }}>Connected As</div>
                <div className="text-sm font-medium truncate">{user.googleCalendar.email}</div>
              </div>
            </div>

            {loading && !events.length ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton-line" style={{ height: 60, borderRadius: 12 }}></div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle size={24} className="text-error mx-auto mb-2" />
                <p className="text-sm text-error">{error}</p>
                <button onClick={handleConnect} className="btn-link text-xs mt-2">Try Reconnecting</button>
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <Calendar size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No upcoming events found.</p>
              </div>
            ) : (
              <div className="events-list flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                  {events.map((event, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={event.id || idx}
                      className="event-card p-3 rounded-xl flex items-start gap-3 hoverable"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div 
                        className="event-time-badge p-2 rounded-lg text-center min-w-[50px]"
                        style={{ 
                          background: 'rgba(124, 109, 250, 0.1)',
                          color: 'var(--accent)'
                        }}
                      >
                        <div className="text-[10px] font-bold uppercase">
                          {safeFormat(event.start?.dateTime || event.start?.date, 'MMM', '???')}
                        </div>
                        <div className="text-lg font-black leading-none">
                          {safeFormat(event.start?.dateTime || event.start?.date, 'd', '??')}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold truncate mb-0.5">{event.summary || 'Untitled Event'}</h5>
                        <div className="text-xs text-muted flex items-center gap-1">
                          {event.start?.dateTime
                            ? `${safeFormat(event.start.dateTime, 'h:mm a')} - ${safeFormat(event.end.dateTime, 'h:mm a')}`
                            : (event.start?.date ? 'All Day' : 'Time TBD')
                          }
                        </div>
                      </div>
                      {event.htmlLink && (
                        <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
};

export default GoogleCalendarWidget;
