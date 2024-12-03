// components/Notification/Notification.jsx
import React, { useState, useEffect } from 'react';
import './Notification.css';

export const Notification = ({ message, type = "warning" }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsExiting(true);
    }, 2700);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={`notification ${type} ${isExiting ? 'notification-exit' : 'notification-enter'}`}>
      {message}
    </div>
  );
};