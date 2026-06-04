'use client';

import React from 'react';
import { getLocalDateStr } from '@/lib/date';
import type { Priority, Recurrence } from '@/lib/types';

export interface QuickEntryMetaRowProps {
  stagedMeta: {
    assigneeId: string | null;
    projectId: string | null;
    tags: string[];
    priority: Priority;
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
}: QuickEntryMetaRowProps) {
  return (
    <div>
      {/* Horizontal Meta Custom Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {/* Schedule */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'schedule' ? null : 'schedule')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
              stagedMeta.dueDate
                ? 'border-green-200 text-green-700 bg-green-50/50 hover:bg-green-50'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-calendar-day text-green-600 text-xs"></i>
            <span>
              {stagedMeta.dueDate
                ? stagedMeta.dueDate === getLocalDateStr(0)
                  ? 'Today'
                  : stagedMeta.dueDate
                : 'Schedule'}
            </span>
            {stagedMeta.dueDate && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setStagedMeta((s: any) => ({ ...s, dueDate: null, dueTime: null }));
                }}
                className="hover:text-red-500 ml-1 text-[9px]"
              >
                ✕
              </span>
            )}
          </button>

          {activePopover === 'schedule' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2.5 z-50 min-w-[200px] flex flex-col gap-1 text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Set Due Date
              </p>
              <button
                onClick={() => {
                  setStagedMeta((s: any) => ({ ...s, dueDate: getLocalDateStr(0), dueTime: '12:00' }));
                  setActivePopover(null);
                }}
                className="text-left px-2 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded flex items-center gap-2 text-gray-700"
              >
                <i className="fas fa-sun text-yellow-500 text-sm w-4"></i> Today
              </button>
              <button
                onClick={() => {
                  setStagedMeta((s: any) => ({ ...s, dueDate: getLocalDateStr(1), dueTime: '12:00' }));
                  setActivePopover(null);
                }}
                className="text-left px-2 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded flex items-center gap-2 text-gray-700"
              >
                <i className="fas fa-moon text-blue-400 text-sm w-4"></i> Tomorrow
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={stagedMeta.dueDate ? stagedMeta.dueDate.split('T')[0] : ''}
                  onChange={(e) => setStagedMeta((s: any) => ({ ...s, dueDate: e.target.value }))}
                  className="w-full text-[11px] p-1 border border-gray-200 rounded bg-gray-50 text-gray-800 outline-none"
                />
                <input
                  type="time"
                  value={
                    stagedMeta.dueTime ??
                    (stagedMeta.dueDate?.includes('T') ? stagedMeta.dueDate.split('T')[1] : '')
                  }
                  onChange={(e) => setStagedMeta((s: any) => ({ ...s, dueTime: e.target.value }))}
                  className="w-full text-[11px] p-1 border border-gray-200 rounded bg-gray-50 text-gray-800 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'assignee' ? null : 'assignee')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 ${
              stagedMeta.assigneeId ? 'border-blue-200 text-blue-700 bg-blue-50/30' : ''
            }`}
          >
            <i className="fas fa-paperclip text-xs text-gray-400"></i>
            <span>
              {stagedMeta.assigneeId
                ? users.find((u) => u.id === stagedMeta.assigneeId)?.name.split(' (')[0]
                : 'Attachment'}
            </span>
            {stagedMeta.assigneeId && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setStagedMeta((s: any) => ({ ...s, assigneeId: null }));
                }}
                className="hover:text-red-500 ml-1 text-[9px]"
              >
                ✕
              </span>
            )}
          </button>

          {activePopover === 'assignee' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50 min-w-[180px] flex flex-col gap-0.5 text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1.5">
                Assign User
              </p>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setStagedMeta((s: any) => ({ ...s, assigneeId: u.id }));
                    setActivePopover(null);
                  }}
                  className={`text-left px-2 py-1 text-xs font-semibold hover:bg-gray-50 rounded flex items-center justify-between text-gray-700 ${
                    stagedMeta.assigneeId === u.id ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <span>{u.name}</span>
                  {stagedMeta.assigneeId === u.id && <i className="fas fa-check text-[9px]"></i>}
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
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 ${
              stagedMeta.priority !== 'p4' ? 'bg-orange-50/40 text-orange-700 border-orange-200' : ''
            }`}
          >
            <i
              className={`fas fa-flag text-xs ${
                stagedMeta.priority === 'p1'
                  ? 'text-red-500'
                  : stagedMeta.priority === 'p2'
                    ? 'text-orange-500'
                    : stagedMeta.priority === 'p3'
                      ? 'text-blue-500'
                      : 'text-gray-400'
              }`}
            ></i>
            <span>{stagedMeta.priority === 'p4' ? 'Priority' : stagedMeta.priority.toUpperCase()}</span>
          </button>

          {activePopover === 'priority' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 z-50 min-w-[140px] flex flex-col text-left">
              {(['p1', 'p2', 'p3', 'p4'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setStagedMeta((s: any) => ({ ...s, priority: p }));
                    setActivePopover(null);
                  }}
                  className="text-left px-2 py-1 text-xs font-semibold hover:bg-gray-50 rounded flex items-center gap-2 text-gray-700"
                >
                  <i
                    className={`fas fa-flag ${
                      p === 'p1'
                        ? 'text-red-500'
                        : p === 'p2'
                          ? 'text-orange-500'
                          : p === 'p3'
                            ? 'text-blue-500'
                            : 'text-gray-400'
                    }`}
                  ></i>
                  <span>
                    {p === 'p1' ? 'Priority 1' : p === 'p2' ? 'Priority 2' : p === 'p3' ? 'Priority 3' : 'Priority 4'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reminder */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'reminder' ? null : 'reminder')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 ${
              stagedMeta.reminder ? 'bg-teal-50 text-teal-700 border-teal-200' : ''
            }`}
          >
            <i className="fas fa-bell text-xs text-gray-400"></i>
            <span>{stagedMeta.reminder ? `${stagedMeta.reminder}m before` : 'Reminders'}</span>
            {stagedMeta.reminder && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setStagedMeta((s: any) => ({ ...s, reminder: null }));
                }}
                className="hover:text-red-500 ml-1 text-[9px]"
              >
                ✕
              </span>
            )}
          </button>

          {activePopover === 'reminder' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-50 min-w-[150px] flex flex-col text-left">
              {[
                { label: 'At due time', val: '0' },
                { label: '10m before', val: '10' },
                { label: '30m before', val: '30' },
                { label: '1h before', val: '60' },
              ].map((r) => (
                <button
                  key={r.val}
                  onClick={() => {
                    setStagedMeta((s: any) => ({ ...s, reminder: r.val }));
                    setActivePopover(null);
                  }}
                  className="text-left px-2 py-1 text-xs font-semibold hover:bg-gray-50 rounded text-gray-700"
                >
                  {r.label}
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
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
              stagedMeta.recurrence
                ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-50'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-sync-alt text-[9px]"></i>
            <span>{stagedMeta.recurrence ? stagedMeta.recurrence : 'Recurrence'}</span>
            {stagedMeta.recurrence && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setStagedMeta((s: any) => ({ ...s, recurrence: null }));
                }}
                className="hover:text-red-500 ml-0.5 text-[9px]"
              >
                ✕
              </span>
            )}
          </button>

          {activePopover === 'recurrence' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-50 min-w-[140px] flex flex-col text-left">
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
        <div className="flex flex-wrap gap-1 mt-2">
          {stagedMeta.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded text-[11px] font-medium"
            >
              #{t}
              <button
                onClick={() => removeTag(t)}
                className="hover:text-red-500 text-[10px] ml-0.5"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}


