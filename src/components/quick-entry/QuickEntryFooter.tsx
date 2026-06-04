'use client' ;

import React from 'react';

export interface QuickEntryFooterProps {
  activePopover: any;
  setActivePopover: (v: any) => void;
  stagedMeta: {
    projectId: string | null;
    tags: string[];
    dueDate: string | null;
  };

  projects: string[];
  trackUsedToken: (type: 'assignees' | 'tags' | 'projects', value: string) => void;

  title: string;
  desc: string;

  onClear: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function QuickEntryFooter({
  activePopover,
  setActivePopover,
  stagedMeta,
  projects,
  trackUsedToken,
  title,
  desc,
  onClear,
  onCancel,
  onSave,
}: QuickEntryFooterProps) {
  const canClear = title.trim() || desc.trim() || stagedMeta.tags.length > 0 || stagedMeta.dueDate;

  return (
    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-xl flex items-center justify-between">
      <div className="relative">
        <button
          type="button"
          onClick={() => setActivePopover(activePopover === 'project' ? null : 'project')}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-md transition-colors"
          title="Project Context Mapping"
        >
          <i className="fas fa-inbox text-gray-400 text-sm"></i>
          <span>{stagedMeta.projectId || 'Inbox'}</span>
          <i className="fas fa-chevron-down text-[9px] text-gray-400 ml-0.5"></i>
        </button>

        {activePopover === 'project' && (
          <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 z-50 min-w-[180px] flex flex-col gap-0.5 text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1.5">Projects</p>
            {projects.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setStagedMeta((s: any) => ({ ...s, projectId: p }));
                  trackUsedToken('projects', p);
                  setActivePopover(null);
                }}
                className={`text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded flex items-center justify-between text-gray-700 ${
                  stagedMeta.projectId === p ? 'bg-green-50 text-green-600' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-circle text-[6px] text-gray-400"></i>
                  {p}
                </span>
                {stagedMeta.projectId === p && <i className="fas fa-check text-[9px]"></i>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canClear && (
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
            title="Clear Draft"
          >
            Clear
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!title.trim()}
          className="px-4 py-1.5 text-xs font-bold bg-red-400/90 hover:bg-red-400 text-white rounded-md disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all"
        >
          Add task
        </button>
      </div>
    </div>
  );
}

