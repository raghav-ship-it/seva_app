'use client';

import React from 'react';
import { getLocalDateStr } from '@/lib/date';
import type { Priority, Recurrence } from '@/lib/types';

export interface QuickEntryMetaRowProps {
  stagedMeta: {
    assigneeId: string | null;
    projectId: string | null;
    tags: string[];
    priority: Priority|null;
    dueDate: string | null;
    dueTime: string | null;
    reminder: string | null;
    recurrence: Recurrence;
  };
  users: Array<{ id: string; name: string }>;
  projects: string[];
  activePopover: any;
  setActivePopover: (v: any) => void;
  setStagedMeta: (updater: any) => void;
  removeTag: (tag: string) => void;
  trackUsedToken: (type: 'assignees' | 'tags' | 'projects', value: string) => void;
}

export default function QuickEntryMetaRow({
  stagedMeta,
  users,
  activePopover,
  setActivePopover,
  setStagedMeta,
  removeTag,
  trackUsedToken,
}: QuickEntryMetaRowProps) {
  return (
    <div>
      {/* Horizontal Meta Custom Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2 px-4">
        {/* Schedule */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'schedule' ? null : 'schedule')}
            className={`h-6 px-2 text-[11px] font-medium border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors text-gray-500 ${
              stagedMeta.dueDate ? 'border-blue-200 bg-blue-50/40 text-blue-600 hover:bg-blue-50' : ''
            }`}
          >
            <i className="far fa-calendar text-[10px]"></i>
            <span>
              {stagedMeta.dueDate
                ? getLocalDateStr(new Date(stagedMeta.dueDate).getTime())
                : 'Schedule'}
            </span>
          </button>
        </div>

        {/* Assignee */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'assignee' ? null : 'assignee')}
            className={`h-6 px-2 text-[11px] font-medium border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors text-gray-500 ${
              stagedMeta.assigneeId ? 'border-orange-200 bg-orange-50/40 text-orange-600 hover:bg-orange-50' : ''
            }`}
          >
            <i className="far fa-user text-[10px]"></i>
            <span>
              {stagedMeta.assigneeId
                ? users.find((u) => u.id === stagedMeta.assigneeId)?.name || 'Assigned'
                : 'Assignee'}
            </span>
          </button>

          {activePopover === 'assignee' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[160px] flex flex-col p-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setStagedMeta((s: any) => ({ ...s, assigneeId: u.id }));
                    setActivePopover(null);
                  }}
                  className="text-left px-2 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded text-gray-700 flex items-center gap-2"
                >
                  <i className="fas fa-user text-gray-400 text-[10px]"></i>
                  {u.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'priority' ? null : 'priority')}
            className={`h-6 px-2 text-[11px] font-medium border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors text-gray-500 ${
              stagedMeta.priority ? 'border-red-200 bg-red-50/40 text-red-600 hover:bg-red-50' : ''
            }`}
          >
            <i className="far fa-flag text-[10px]"></i>
            <span>{stagedMeta.priority ? stagedMeta.priority.toUpperCase() : 'Priority'}</span>
          </button>

          {activePopover === 'priority' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[120px] flex flex-col p-1">
              {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setStagedMeta((s: any) => ({ ...s, priority: p }));
                    setActivePopover(null);
                  }}
                  className="text-left px-2 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded text-gray-700 flex items-center gap-2"
                >
                  <i className={`fas fa-flag text-[10px] ${
                    p === 'p1' ? 'text-red-500' : p === 'p2' ? 'text-orange-500' : p === 'p3' ? 'text-blue-500' : 'text-gray-400'
                  }`}></i>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recurrence */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'recurrence' ? null : 'recurrence')}
            className={`h-6 px-2 text-[11px] font-medium border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors text-gray-500 ${
              stagedMeta.recurrence ? 'border-teal-200 bg-teal-50/40 text-teal-600 hover:bg-teal-50' : ''
            }`}
          >
            <i className="fas fa-redo text-[9px]"></i>
            <span>{stagedMeta.recurrence || 'No Repeat'}</span>
          </button>

          {activePopover === 'recurrence' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[140px] flex flex-col text-left p-1">
              {[
                { label: 'None', val: null },
                { label: 'Daily', val: 'daily' },
                { label: 'Weekly', val: 'weekly' },
                { label: 'Monthly', val: 'monthly' },
              ].map((rec) => (
                <button
                  key={rec.label}
                  onClick={() => {
                    setStagedMeta((s: any) => ({ ...s, recurrence: rec.val as any }));
                    setActivePopover(null);
                  }}
                  className="text-left px-2 py-1 text-xs font-semibold hover:bg-gray-50 rounded text-gray-700"
                >
                  {rec.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chips */}
      {stagedMeta.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 px-4">
          {stagedMeta.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded text-[11px] font-medium"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-purple-900 ml-0.5 font-bold"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}