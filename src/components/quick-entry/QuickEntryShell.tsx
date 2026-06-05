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

      // 2. Clear out the inline pinning styles to let it animate to the center layout
      

  if (!isOpen && !isClosing) return null;

  return (
    <div
      // flex items-center justify-center keeps the fallback / target layout perfectly centered
      className={
        'fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 transition-opacity duration-200 ' +
        (isClosing ? 'opacity-0' : 'opacity-100')
      }
      onClick={onRequestClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-visible flex flex-col text-gray-800"
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