'use client';

import React from 'react';
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
  // Format ISO date into clean short label
  const formatDateLabel = (iso: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(iso + 'T00:00');
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 1 && diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      {/* Horizontal Meta Custom Badges */}
      <div className={styles.metaContainer}>
        {/* Schedule */}
        <div className={styles.metaItem}>
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'schedule' ? null : 'schedule')}
            className={`${styles.metaButton} ${stagedMeta.dueDate ? styles.metaButtonActive : ''
              }`}
          >
            <i className="far fa-calendar text-[11px]"></i>
            <span>
              {stagedMeta.dueDate ? formatDateLabel(stagedMeta.dueDate) : 'Date'}
            </span>
          </button>
        </div>

        {/* Assignee */}
        <div className={styles.metaItem}>
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'assignee' ? null : 'assignee')}
            className={`${styles.metaButton} ${stagedMeta.assigneeId ? styles.metaButtonAssigneeActive : ''
              }`}
          >
            <i className="far fa-user text-[11px]"></i>
            <span>
              {stagedMeta.assigneeId
                ? users.find((u) => u.id === stagedMeta.assigneeId)?.name || 'Assigned'
                : 'Doer'}
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
            className={`${styles.metaButton} ${stagedMeta.priority ? styles.metaButtonPriorityActive : ''
              }`}
          >
            <i className="far fa-flag text-[11px]"></i>
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
                  <i
                    className={`fas fa-flag text-[10px] ${p === 'p1'
                      ? 'text-red-500'
                      : p === 'p2'
                        ? 'text-orange-500'
                        : p === 'p3'
                          ? 'text-blue-500'
                          : 'text-gray-400'
                      }`}
                  ></i>
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
            className={`${styles.metaButton} ${stagedMeta.recurrence ? styles.metaButtonRecurrenceActive : ''
              }`}
          >
            <i className="fas fa-redo text-[10px]"></i>
            <span>{stagedMeta.recurrence || 'None'}</span>
          </button>

          {activePopover === 'recurrence' && (
            <div className={styles.popover}>
              {[
                { label: 'None', val: null },
                { label: 'Daily', val: 'Daily' },
                { label: 'Weekly', val: 'Weekly' },
                { label: 'Monthly', val: 'Monthly' },
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

        {/* Alarm / Reminder */}
        <div className={styles.metaItem}>
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'reminder' ? null : 'reminder')}
            className={`${styles.metaButton} ${stagedMeta.reminder ? styles.metaButtonReminderActive : ''
              }`}
          >
            <i className="far fa-bell text-[11px]"></i>
            <span>
              {stagedMeta.reminder
                ? stagedMeta.reminder === '0'
                  ? 'At event'
                  : `${stagedMeta.reminder}m before`
                : 'Alarm'}
            </span>
          </button>

          {activePopover === 'reminder' && (
            <div className={styles.popover}>
              {[
                { label: 'No Alarm', val: null },
                { label: 'At time of event', val: '0' },
                { label: '5m before', val: '5' },
                { label: '10m before', val: '10' },
                { label: '30m before', val: '30' },
                { label: '1h before', val: '60' },
                { label: '1d before', val: '1440' },
              ].map((rem) => (
                <button
                  key={rem.label}
                  onClick={() => {
                    setStagedMeta((s: MetaState) => ({ ...s, reminder: rem.val }));
                    setActivePopover(null);
                  }}
                  className={styles.popoverItem}
                >
                  <i className="fas fa-bell text-gray-400 text-[10px]"></i>
                  {rem.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags Chips */}
      {stagedMeta.tags.length > 0 && (
        <div className={styles.tagsContainer}>
          {stagedMeta.tags.map((t) => (
            <span key={t} className={styles.tag}>
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