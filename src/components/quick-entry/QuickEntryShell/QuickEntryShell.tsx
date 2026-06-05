'use client';

import React, { useEffect, useRef } from 'react';
import styles from './QuickEntryShell.module.css';

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
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : styles.overlayOpen}`}
      onClick={onRequestClose}
      role="presentation"
    >
      <div
        className={styles.modal}
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