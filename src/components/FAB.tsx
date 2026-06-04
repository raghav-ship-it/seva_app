'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const FAB = () => {
  const isQuickEntryOpen = useStore((state) => state.isQuickEntryOpen);
  const openQuickEntry = useStore((state) => state.openQuickEntry);
  const closeQuickEntry = useStore((state) => state.closeQuickEntry);

  return (
    <button 
      className="fab" 
      onClick={() => {
        if (isQuickEntryOpen) closeQuickEntry();
        else openQuickEntry();
      }}
      title="Add Task"
    >
      <i className="fas fa-plus"></i>
    </button>
  );
};

export default FAB;
