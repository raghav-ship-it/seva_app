'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const FAB = () => {
  const openQuickEntry = useStore((state) => state.openQuickEntry);

  return (
    <button 
      className="fab" 
      onClick={() => openQuickEntry()}
      title="Add Task"
    >
      <i className="fas fa-plus"></i>
    </button>
  );
};

export default FAB;
