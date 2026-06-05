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
  setStagedMeta: (updater: any) => void;
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
  setStagedMeta,
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
          className={`h-7 px-2 text-xs font-medium border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1.5 transition-colors text-gray-600 ${
            stagedMeta.projectId ? 'border-green-200 bg-green-50/50 text-green-700 hover:bg-green-50' : ''
          }`}
        >
          <i className="fas fa-folder text-gray-400"></i>
          <span>{stagedMeta.projectId || 'Project'}</span>
        </button>

        {activePopover === 'project' && (
          <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[160px] p-1 flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
            <button
              onClick={() => {
                setStagedMeta((s: any) => ({ ...s, projectId: null }));
                setActivePopover(null);
              }}
              className={`text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded flex items-center justify-between text-gray-500 ${
                stagedMeta.projectId === null ? 'bg-gray-50 font-bold' : ''
              }`}
            >
              No Project
            </button>
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
          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-md shadow-sm transition-colors"
        >
          Add Task
        </button>
      </div>
    </div>
  );
}