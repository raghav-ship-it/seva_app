'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import styles from './BottomNav.module.css';

const BottomNav = () => {
  const pathname = usePathname();
  const { currentUser, tasks } = useStore();

  if (!currentUser) return null;

  const tabs = [
    { 
      name: 'My Day', 
      path: '/home', 
      icon: 'fa-sun',
      count: tasks.filter(t => t.myDay && t.status !== 'completed' && t.assigneeId === currentUser.id).length
    },
    { 
      name: 'Inbox', 
      path: '/tasks', 
      icon: 'fa-inbox',
      count: tasks.filter(t => t.status !== 'completed' && t.assigneeId === currentUser.id).length
    },
    { 
      name: 'Upcoming', 
      path: '/upcoming', 
      icon: 'fa-calendar-day',
      count: tasks.filter(t => {
        if (t.status === 'completed' || t.assigneeId !== currentUser.id) return false;
        if (!t.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(t.dueDate) > today;
      }).length
    },
  ];

  if (currentUser.role === 'admin') {
    tabs.push({ 
      name: 'Everyone', 
      path: '/track', 
      icon: 'fa-users',
      count: tasks.filter(t => t.status !== 'completed').length
    });
  }

  tabs.push({ name: 'Profile', path: '/profile', icon: 'fa-user-circle',count : 0 });

  return (
    <nav className={styles.bottomNav}>
      {tabs.map((tab) => (
        <Link 
          key={tab.path} 
          href={tab.path}
          className={`${styles.navTab} ${pathname === tab.path ? styles.active : ''}`}
        >
          <div className="relative">
            <i className={`fas ${tab.icon}`}></i>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={styles.badge}>{tab.count}</span>
            )}
          </div>
          <span>{tab.name}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
