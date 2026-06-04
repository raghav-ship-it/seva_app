'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';

import { getLocalDateStr } from '@/lib/date';


export interface QuickEntryEditorProps {
  editor: Editor | null;
  EditorContent: React.ComponentType<any>;


  title: string;
  desc: string;
  setDesc: (v: string) => void;

  stagedMeta: {
    assigneeId: string | null;
    projectId: string | null;
    tags: string[];
    priority: 'p1' | 'p2' | 'p3' | 'p4';
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
  datePickerRef: React.RefObject<HTMLInputElement | null>;
  setStagedMeta: (updater: any) => void;
}

export default function QuickEntryEditor({
  editor,
  EditorContent,
  desc,
  setDesc,
  stagedMeta,
  users,
  menu,
  activePopover,
  setActivePopover,
  applyToken,
  removeTag,
  popoverRef,
  datePickerRef,
  setStagedMeta,
}: QuickEntryEditorProps) {
  return (
    <div className="p-4 flex flex-col gap-1" ref={popoverRef}>
      <div className="flex items-start justify-between gap-4 relative">
        <div className="relative flex-1 min-h-[32px]">
          {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
          <EditorContent editor={editor} />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-green-600 bg-green-50 px-2 py-0.5 rounded cursor-pointer select-none">
          <span className="opacity-70 text-[10px] uppercase font-mono">|||</span> DICTATE
          <i className="fas fa-wave-square text-red-500 animate-pulse ml-0.5"></i>
        </div>

        {menu && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[999] min-w-[240px] max-h-[220px] overflow-y-auto py-1 text-left">
            {menu.items.map((it: any, i: number) => (
              <div
                key={i}
                className={`px-3 py-2 flex items-center gap-2.5 cursor-pointer text-xs font-medium transition-colors ${
                  i === menu.index ? 'bg-gray-100' : 'hover:bg-gray-50'
                } ${it.class || ''}`}
                onClick={() => applyToken(it.type || menu.type, it.val)}
              >
                <i
                  className={`fas fa-${it.icon} w-4 text-center text-gray-400 ${it.color || ''}`}
                ></i>
                <span className="text-gray-700">{it.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description"
        className="w-full text-xs text-gray-500 bg-transparent border-none outline-none resize-none min-h-[40px] p-0 placeholder-gray-400"
      />



      {/* Invisible triggering channel for ? macro shortcuts */}
      <input
        ref={datePickerRef}
        type="date"
        className="hidden"
        onChange={(e) => {
          setStagedMeta((s: any) => ({ ...s, dueDate: e.target.value, dueTime: null }));
          editor?.commands.focus('end');
        }}
      />
    </div>
  );
}

