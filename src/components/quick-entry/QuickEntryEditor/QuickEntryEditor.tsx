'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';

import styles from './QuickEntryEditor.module.css';

export interface QuickEntryEditorProps { // props for the editor to understand and render the content, as well as manage the state of the meta popovers and menu
  editor: Editor | null;
  EditorContent: React.ComponentType<any>;


  title: string;
  desc: string;
  setDesc: (v: string) => void;

  stagedMeta: {
    assigneeId: string | null;
    projectId: string | null;
    tags: string[];
    priority: 'p1' | 'p2' | 'p3' | 'p4'|null;
    dueDate: string | null;
    dueTime: string | null;
    reminder: string | null;
    recurrence: 'daily' | 'weekly' | 'monthly' | null;
  };

  users: Array<{ id: string; name: string }>;
  tags: string[];
  projects: string[];
  menu:
    | {
        items: Array<any>;
        type: string;
        index: number;
      }
    | null;

  activePopover:
    | 'schedule'
    | 'assignee'
    | 'priority'
    | 'tags'
    | 'project'
    | 'reminder'
    | 'recurrence'
    | null;

  setActivePopover: (v: any) => void;
  setMenu: (v: any) => void;

  applyToken: (type: string, val: any) => void;
  processTextContent: (val: string) => void;
  removeTag: (tag: string) => void;

  popoverRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  setStagedMeta: (updater: any) => void;
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
}: QuickEntryEditorProps) {
  return (
    <div className={styles.container} ref={popoverRef}>
      <div className={styles.header}>
        <div className={styles.editorWrapper}>
          {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
          <EditorContent editor={editor} />
        </div>

        {/*<div className={styles.dictateBtn}>
          <span className="opacity-70 text-[10px] uppercase font-mono">|||</span> DICTATE
          <i className={`fas fa-wave-square text-red-500 animate-pulse ${styles.dictateIcon}`}></i>
        </div>**/}

        {menu && (
          <div className={styles.menu}>
            {menu.items.map((it: any, i: number) => (
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
          setStagedMeta((s: any) => ({ ...s, dueDate: e.target.value, dueTime: null }));
          editor?.commands.focus('end');
        }}
      />
    </div>
  );
}

