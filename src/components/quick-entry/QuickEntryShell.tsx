'use client';

import React, { useEffect, useRef } from 'react';

export interface QuickEntryShellProps {
  isOpen: boolean;
  isClosing: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
  onRequestClose: () => void;
  children: React.ReactNode;
}

export default function QuickEntryShell({
  isOpen,
  isClosing,
  modalRef,
  onRequestClose,
  children,
}: QuickEntryShellProps) {
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    if (!isOpen) return;
    return () => {
      // nothing
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 pt-24 z-50"
      onClick={onRequestClose}
      role="presentation"
    >
      <div
        className={
          'bg-white rounded-xl shadow-xl w-full max-w-xl border border-gray-200 overflow-visible flex flex-col text-gray-800 origin-top ' +
          (isClosing
            ? 'opacity-0 scale-[0.98] translate-y-2 transition-all duration-200'
            : 'opacity-100 scale-100 translate-y-0 transition-all duration-200')
        }
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        ref={modalRef as React.RefObject<HTMLDivElement>}
      >
        {children}
      </div>
    </div>
  );
}

