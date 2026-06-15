import React from 'react';
import styles from './TokenToolbar.module.css';

interface TokenToolbarProps {
  onTokenClick: (token: string) => void;
}

const tokens = [
  { symbol: '@', label: 'Assignee', color: '#3b82f6' },
  { symbol: '#', label: 'Tag', color: '#10b981' },
  { symbol: '!', label: 'Priority', color: '#f59e0b' },
  { symbol: '^', label: 'Project', color: '#8b5cf6' },
  { symbol: '+', label: 'Reminder', color: '#ef4444' },
  { symbol: '*', label: 'Recurrence', color: '#6366f1' },
];

export const TokenToolbar: React.FC<TokenToolbarProps> = ({ onTokenClick }) => {
  return (
    <div className={styles.toolbar}>
      {tokens.map((token) => (
        <button
          key={token.symbol}
          className={styles.button}
          onClick={() => onTokenClick(token.symbol)}
          aria-label={`Add ${token.label} token`}
          style={{ borderColor: token.color, color: token.color }}
        >
          {token.symbol}
        </button>
      ))}
    </div>
  );
};
