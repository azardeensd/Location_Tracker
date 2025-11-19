import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1 className={styles.title}>🚛 Market Vehicle Tracker</h1>
        </div>
        <div className={styles.datetime}>
          <div className={styles.date}>{formatDate(currentTime)}</div>
          <div className={styles.time}>{formatTime(currentTime)}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
