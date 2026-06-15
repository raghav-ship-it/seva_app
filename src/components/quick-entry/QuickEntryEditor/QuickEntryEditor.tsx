'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';
import { PopoverType, MetaState, Menu, MenuItem } from '../types';
import { TokenToolbar } from '../TokenToolbar/TokenToolbar';

import styles from './QuickEntryEditor.module.css';

export interface QuickEntryEditorProps {
  editor: Editor | null;
  EditorContent: React.ComponentType<{ editor: Editor | null }>;

  title: string;
  desc: string;
  setDesc: (v: string) => void;

  stagedMeta: MetaState;

  users: Array<{ id: string; name: string }>;
  tags: string[];
  projects: string[];
  menu: Menu | null;

  activePopover: PopoverType;

  setActivePopover: (v: PopoverType) => void;
  setMenu: (v: Menu | null) => void;

  applyToken: (type: string, val: string | number) => void;
  processTextContent: (val: string) => void;
  removeTag: (tag: string) => void;

  popoverRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLInputElement | null>;
  setStagedMeta: (updater: (prev: MetaState) => MetaState) => void;
}

export default function QuickEntryEditor({
  editor,
  EditorContent,
  desc,
  setDesc,
  menu,
  applyToken,
  popoverRef,
  datePickerRef,
  setStagedMeta,
  stagedMeta,
  users,
}: QuickEntryEditorProps) {
  const handleTokenClick = (symbol: string) => {
    editor?.commands.insertContent(symbol);
    editor?.commands.focus();
  };

  return (
    <div className={styles.container} ref={popoverRef}>
      <TokenToolbar onTokenClick={handleTokenClick} />
      <div className={styles.header}> 
        <div className={styles.editorWrapper}>
          {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
          <EditorContent editor={editor} />
        </div>
        
        
        {menu && (
          <div className={styles.menu}>
            {menu.items.map((it: MenuItem, i: number) => (
              <div
                key={i}
                className={`${styles.menuItem} ${
                  i === menu.index ? styles.menuItemSelected : ''
                } ${it.class || ''}`}
                onClick={() => applyToken(it.type || menu.type, it.val)}
              >
                <i
                  className={`fas fa-${it.icon} ${styles.menuItemIcon} ${it.color || ''}`}
                ></i>
                <span className={styles.menuItemLabel}>{it.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.hint}>
          Use <span className={styles.hintShortcut}>#</span> for tags, <span className={styles.hintShortcut}>@</span> for assignees, <span className={styles.hintShortcut}>^</span> for projects, <span className={styles.hintShortcut}>+</span> for Alarm, <span className={styles.hintShortcut}>*</span> for Recurrence. 
        </div>

      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description"
        className={styles.textarea}
      />

      {/* Invisible triggering channel for ? macro shortcuts */}
      <input
        ref={datePickerRef}
        type="date"
        className={styles.datePicker}
        onChange={(e) => {
          setStagedMeta((s: MetaState) => ({ ...s, dueDate: e.target.value, dueTime: null }));
          editor?.commands.focus('end');
        }}
      />
    </div>
  );
}

