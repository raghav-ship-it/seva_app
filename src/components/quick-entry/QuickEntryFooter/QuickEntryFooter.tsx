'use client' ;

import React from 'react';
import styles from './QuickEntryFooter.module.css';

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
    <div className={styles.footer}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setActivePopover(activePopover === 'project' ? null : 'project')}
          className={`${styles.projectButton} ${
            stagedMeta.projectId ? styles.projectButtonActive : ''
          }`}
        >
          <i className={`fas fa-folder ${styles.projectIcon}`}></i>
          <span>{stagedMeta.projectId || 'Project'}</span>
        </button>

        {activePopover === 'project' && (
          <div className={styles.popover}>
            <button
              onClick={() => {
                setStagedMeta((s: any) => ({ ...s, projectId: null }));
                setActivePopover(null);
              }}
              className={`${styles.popoverItem} ${styles.popoverItemNoProject} ${
                stagedMeta.projectId === null ? styles.popoverItemNoProjectActive : ''
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
                className={`${styles.popoverItem} ${
                  stagedMeta.projectId === p ? styles.popoverItemActive : ''
                }`}
              >
                <span className={styles.popoverItemLabel}>
                  <i className="fas fa-circle text-[6px] text-gray-400"></i>
                  {p}
                </span>
                {stagedMeta.projectId === p && <i className="fas fa-check text-[9px]"></i>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {canClear && (
          <button
            onClick={onClear}
            className={styles.clearBtn}
            title="Clear Draft"
          >
            Clear
          </button>
        )}
        <button
          onClick={onCancel}
          className={styles.cancelBtn}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!title.trim()}
          className={styles.saveBtn}
        >
          Save
        </button>
      </div>
    </div>
  );
}