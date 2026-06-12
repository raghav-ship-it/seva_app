'use client';

import React from 'react';
import { getLocalDateStr } from '@/lib/date';
import type { Priority } from '@/lib/types';
import { PopoverType, MetaState } from '../types';
import styles from './QuickEntryMetaRow.module.css';

export interface QuickEntryMetaRowProps {
  stagedMeta: MetaState;
  users: Array<{ id: string; name: string }>;
  projects: string[];
  activePopover: PopoverType;
  setActivePopover: (v: PopoverType) => void;
  setStagedMeta: (updater: (prev: MetaState) => MetaState) => void;
  removeTag: (tag: string) => void;
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
      <div className={styles.metaContainer}>
        {/* Schedule */}
        <div className={styles.metaItem}>
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'schedule' ? null : 'schedule')}
            className={`${styles.metaButton} ${
              stagedMeta.dueDate ? styles.metaButtonActive : ''
            }`}
          >
            <i className="far fa-calendar text-[10px]"></i>
            <span>
              {stagedMeta.dueDate
                ? stagedMeta.dueDate
                : 'Schedule'}
            </span>
          </button>
        </div>

        {/* Assignee */}
        <div className={styles.metaItem}>
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'assignee' ? null : 'assignee')}
            className={`${styles.metaButton} ${
              stagedMeta.assigneeId ? styles.metaButtonAssigneeActive : ''
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
            <div className={styles.popover}>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setStagedMeta((s: MetaState) => ({ ...s, assigneeId: u.id }));
                    setActivePopover(null);
                  }}
                  className={styles.popoverItem}
                >
                  <i className="fas fa-user text-gray-400 text-[10px]"></i>
                  {u.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className={styles.metaItem}>
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'priority' ? null : 'priority')}
            className={`${styles.metaButton} ${
              stagedMeta.priority ? styles.metaButtonPriorityActive : ''
            }`}
          >
            <i className="far fa-flag text-[10px]"></i>
            <span>{stagedMeta.priority ? stagedMeta.priority.toUpperCase() : 'Priority'}</span>
          </button>

          {activePopover === 'priority' && (
            <div className={styles.popover}>
              {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setStagedMeta((s: MetaState) => ({ ...s, priority: p }));
                    setActivePopover(null);
                  }}
                  className={styles.popoverItem}
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
        <div className={styles.metaItem}>
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'recurrence' ? null : 'recurrence')}
            className={`${styles.metaButton} ${
              stagedMeta.recurrence ? styles.metaButtonRecurrenceActive : ''
            }`}
          >
            <i className="fas fa-redo text-[9px]"></i>
            <span>{stagedMeta.recurrence || 'No Repeat'}</span>
          </button>

          {activePopover === 'recurrence' && (
            <div className={styles.popover}>
              {[
                { label: 'None', val: null },
                { label: 'Daily', val: 'daily' },
                { label: 'Weekly', val: 'weekly' },
                { label: 'Monthly', val: 'monthly' },
              ].map((rec) => (
                <button
                  key={rec.label}
                  onClick={() => {
                    setStagedMeta((s: MetaState) => ({ ...s, recurrence: rec.val as any }));
                    setActivePopover(null);
                  }}
                  className={styles.popoverItem}
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
        <div className={styles.tagsContainer}>
          {stagedMeta.tags.map((t) => (
            <span
              key={t}
              className={styles.tag}
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className={styles.removeTagBtn}
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