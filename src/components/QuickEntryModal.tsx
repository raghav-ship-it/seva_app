'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Priority, Recurrence } from '@/lib/types';
import { getLocalDateStr, getLocalIsoDateTime } from '@/lib/date';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDueDate?: string | null;
  defaultProject?: string | null;
}

interface AutocompleteItem {
  label: string;
  val: any;
  icon: string;
  type?: string;
  color?: string;
  class?: string;
}


const WISDOM_QUOTES: Record<string, { quote: string; source: string }> = {
  'work': {
    quote: "Perform your prescribed duty, for action is better than inaction.",
    source: "Bhagavad-gita 3.8"
  },
  'marketing': {
    quote: "Whatever action a great man performs, common men follow.",
    source: "Bhagavad-gita 3.21"
  },
  'urgent': {
    quote: "One who does not react to the dualities of pleasure and pain is fit for liberation.",
    source: "Bhagavad-gita 2.15"
  },
  'low-effort': {
    quote: "Yoga is the journey of the self, through the self, to the self.",
    source: "Bhagavad-gita 6.18"
  },
  'personal': {
    quote: "A person who is not disturbed by the incessant flow of desires can alone achieve peace.",
    source: "Bhagavad-gita 2.70"
  },
  'shopping': {
    quote: "He who is regulated in his habits of eating and sleeping can mitigate all pains.",
    source: "Bhagavad-gita 6.17"
  },
  'cleaning': {
    quote: "The temple of the Lord should be kept clean and decorated. Cleanliness is next to godliness.",
    source: "Nectar of Devotion"
  }
};

const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultDueDate = null, 
  defaultProject = null 
}) => {
  const { 
    addTask, 
    users, 
    tags, 
    projects,
    currentUser, 
    addUser, 
    addTag,
    addProject,
    recentTokens,
    trackUsedToken,
    modalDraft,
    saveModalDraft,
    clearModalDraft
  } = useStore();
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  
  const [stagedMeta, setStagedMeta] = useState<{
    assigneeId: string | null;
    projectId: string | null;
    tags: string[];
    priority: Priority;
    dueDate: string | null;
    dueTime: string | null;
    reminder: string | null;
    recurrence: Recurrence;
  }>({
    assigneeId: null,
    projectId: null,
    tags: [],
    priority: 'p4',
    dueDate: null,
    dueTime: null,
    reminder: null,
    recurrence: null
  });

  const [menu, setMenu] = useState<{ items: any[], type: string, index: number } | null>(null);
  const [activePopover, setActivePopover] = useState<'schedule' | 'assignee' | 'priority' | 'tags' | 'project' | 'reminder' | 'recurrence' | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initialize draft / defaults
  useEffect(() => {
    if (isOpen) {
      if (modalDraft) {
        // Load draft if it exists
        setTitle(modalDraft.title);
        setDesc(modalDraft.desc);
        setStagedMeta(modalDraft.stagedMeta);
      } else {
        // Otherwise set defaults
        const parsedDefaultDueDate = defaultDueDate && defaultDueDate.includes('T')
          ? { dueDate: defaultDueDate.split('T')[0], dueTime: defaultDueDate.split('T')[1] }
          : { dueDate: defaultDueDate, dueTime: null };

        setTitle('');
        setDesc('');
        setStagedMeta({
          assigneeId: currentUser?.id || null,
          projectId: defaultProject || (projects.length > 0 ? projects[0] : null),
          tags: [],
          priority: 'p4',
          dueDate: parsedDefaultDueDate.dueDate,
          dueTime: parsedDefaultDueDate.dueTime,
          reminder: null,
          recurrence: null
        });
      }
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, modalDraft, currentUser, defaultDueDate, defaultProject, projects]);

  // Persist draft on title/desc/meta change
  useEffect(() => {
    if (isOpen && (title.trim() || desc.trim() || stagedMeta.tags.length > 0 || stagedMeta.dueDate)) {
      saveModalDraft({
        title,
        desc,
        stagedMeta
      });
    }
  }, [title, desc, stagedMeta, isOpen, saveModalDraft]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    
    const words = val.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@')) {
      const search = lastWord.slice(1).toLowerCase();
      // Prioritize recently used assignees
      const recents = recentTokens?.assignees || [];
      const filtered = users.filter(u => u.name.toLowerCase().includes(search));
      
      // Sort with recents first
      const sorted = [...filtered].sort((a, b) => {
        const aIdx = recents.indexOf(a.id);
        const bIdx = recents.indexOf(b.id);
        if (aIdx !== -1 && bIdx === -1) return -1;
        if (aIdx === -1 && bIdx !== -1) return 1;
        return aIdx - bIdx;
      });

      let items: AutocompleteItem[] = sorted.map(u => ({ label: u.name, val: u.id, icon: 'user' }));
      
      // Add custom creation option
      if (search && !filtered.find(u => u.name.toLowerCase() === search)) {
        items.push({ label: `Add User "${lastWord.slice(1)}"`, val: lastWord.slice(1), type: 'new_user', icon: 'plus-circle' });
      }
      setMenu({ items, type: 'assignee', index: 0 });
    } else if (lastWord.startsWith('#')) {
      const search = lastWord.slice(1).toLowerCase();
      const recents = recentTokens?.tags || [];
      const filtered = tags.filter(t => t.toLowerCase().includes(search));
      
      const sorted = [...filtered].sort((a, b) => {
        const aIdx = recents.indexOf(a);
        const bIdx = recents.indexOf(b);
        if (aIdx !== -1 && bIdx === -1) return -1;
        if (aIdx === -1 && bIdx !== -1) return 1;
        return aIdx - bIdx;
      });

      let items: AutocompleteItem[] = sorted.map(t => ({ label: t, val: t, icon: 'hashtag' }));
      
      if (search && !filtered.includes(lastWord.slice(1))) {
        items.push({ label: `Create Tag "${lastWord.slice(1)}"`, val: lastWord.slice(1), type: 'new_tag', icon: 'plus-circle' });
      }
      setMenu({ items, type: 'tag', index: 0 });
    } else if (lastWord.startsWith('^')) {
      const search = lastWord.slice(1).toLowerCase();
      const recents = recentTokens?.projects || [];
      const filtered = projects.filter(p => p.toLowerCase().includes(search));
      
      const sorted = [...filtered].sort((a, b) => {
        const aIdx = recents.indexOf(a);
        const bIdx = recents.indexOf(b);
        if (aIdx !== -1 && bIdx === -1) return -1;
        if (aIdx === -1 && bIdx !== -1) return 1;
        return aIdx - bIdx;
      });

      let items: AutocompleteItem[] = sorted.map(p => ({ label: p, val: p, icon: 'circle text-[6px]' }));
      
      if (search && !filtered.includes(lastWord.slice(1))) {
        items.push({ label: `Create Project "${lastWord.slice(1)}"`, val: lastWord.slice(1), type: 'new_project', icon: 'plus-circle' });
      }
      setMenu({ items, type: 'project', index: 0 });
    } else if (lastWord.startsWith('!')) {
      setMenu({ items: [
        { label: 'Priority 1', val: 'p1', icon: 'flag', color: 'text-red-500' },
        { label: 'Priority 2', val: 'p2', icon: 'flag', color: 'text-orange-500' },
        { label: 'Priority 3', val: 'p3', icon: 'flag', color: 'text-blue-500' },
        { label: 'Priority 4', val: 'p4', icon: 'flag', color: 'text-gray-400' }
      ], type: 'priority', index: 0 });
    } else if (lastWord.startsWith('?')) {
      setTitle(val.slice(0, -1));
      datePickerRef.current?.showPicker();
    } else if (lastWord.startsWith('+')) {
      setMenu({ items: [
        { label: 'At due time', val: '0', icon: 'bell' },
        { label: '10m before', val: '10', icon: 'bell' },
        { label: '30m before', val: '30', icon: 'bell' },
        { label: '1h before', val: '60', icon: 'bell' }
      ], type: 'reminder', index: 0 });
    } else if (lastWord.startsWith('*')) {
      setMenu({ items: [
        { label: 'Daily', val: 'daily', icon: 'redo' },
        { label: 'Weekly', val: 'weekly', icon: 'redo' },
        { label: 'Monthly', val: 'monthly', icon: 'redo' }
      ], type: 'recurrence', index: 0 });
    } else {
      setMenu(null);
    }
  };

  const applyToken = (type: string, val: any) => {
    const words = title.split(' ');
    words.pop();
    setTitle(words.join(' ') + (words.length ? ' ' : ''));
    
    if (type === 'new_user') {
      const id = addUser(val);
      trackUsedToken('assignees', id);
      setStagedMeta(s => ({ ...s, assigneeId: id }));
    } else if (type === 'new_tag') {
      addTag(val);
      trackUsedToken('tags', val);
      setStagedMeta(s => ({ ...s, tags: [...s.tags, val] }));
    } else if (type === 'new_project') {
      addProject(val);
      trackUsedToken('projects', val);
      setStagedMeta(s => ({ ...s, projectId: val }));
    } else if (type === 'assignee') {
      trackUsedToken('assignees', val);
      setStagedMeta(s => ({ ...s, assigneeId: val }));
    } else if (type === 'tag') {
      trackUsedToken('tags', val);
      setStagedMeta(s => ({ ...s, tags: s.tags.includes(val) ? s.tags : [...s.tags, val] }));
    } else if (type === 'project') {
      trackUsedToken('projects', val);
      setStagedMeta(s => ({ ...s, projectId: val }));
    } else if (type === 'priority') setStagedMeta(s => ({ ...s, priority: val }));
    else if (type === 'reminder') setStagedMeta(s => ({ ...s, reminder: val }));
    else if (type === 'recurrence') setStagedMeta(s => ({ ...s, recurrence: val }));
    
    setMenu(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (menu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMenu({ ...menu, index: (menu.index + 1) % menu.items.length });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMenu({ ...menu, index: (menu.index - 1 + menu.items.length) % menu.items.length });
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const it = menu.items[menu.index];
        applyToken(it.type || menu.type, it.val);
      } else if (e.key === 'Escape') {
        setMenu(null);
      }
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const getDueDateForSave = (date: string | null, time: string | null) => {
    if (!date) return null;
    if (date.includes('T')) return date;
    if (!time) return date;
    return `${date}T${time}`;
  };

  const handleSave = () => {
    if (!title.trim() || !currentUser) return;
    
    const dueDatePayload = getDueDateForSave(stagedMeta.dueDate, stagedMeta.dueTime);

    addTask({
      title: title.trim(),
      desc,
      dueDate: dueDatePayload,
      dueTime: dueDatePayload ? null : stagedMeta.dueTime,
      priority: stagedMeta.priority,
      tags: stagedMeta.tags,
      assigneeId: stagedMeta.assigneeId || currentUser.id,
      creatorId: currentUser.id,
      reminder: stagedMeta.reminder,
      recurrence: stagedMeta.recurrence,
      myDay: dueDatePayload?.startsWith(getLocalDateStr()) || false,
      project: stagedMeta.projectId
    });
    
    // Clear draft & close
    clearModalDraft();
    onClose();
  };

  const handleClose = () => {
    // Keep draft intact for accidental close, just close modal
    onClose();
  };

  const handleClearDraft = () => {
    clearModalDraft();
    setTitle('');
    setDesc('');
    setStagedMeta({
      assigneeId: currentUser?.id || null,
      projectId: projects.length > 0 ? projects[0] : null,
      tags: [],
      priority: 'p4',
      dueDate: null,
      dueTime: null,
      reminder: null,
      recurrence: null
    });
  };

  const removeTag = (tag: string) => {
    setStagedMeta(s => ({ ...s, tags: s.tags.filter(t => t !== tag) }));
  };

  const getHighlightedHtml = () => {
    const escaped = title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return escaped
      .replace(/(@\w+)/g, '<span class="hl-user">$1</span>')
      .replace(/(#\w+)/g, '<span class="hl-tag">$1</span>')
      .replace(/(\^\w+)/g, '<span class="hl-project">$1</span>')
      .replace(/(!p[1-4])/g, '<span class="hl-priority">$1</span>')
      .replace(/(\?\w+)/g, '<span class="hl-date">$1</span>')
      .replace(/(\+\w+)/g, '<span class="hl-reminder">$1</span>')
      .replace(/(\*\w+)/g, '<span class="hl-recurrence">$1</span>');
  };

  // Pull wisdom quote if matching tag is staged
  const activeWisdom = stagedMeta.tags
    .map(t => WISDOM_QUOTES[t.toLowerCase()])
    .find(q => q !== undefined);

  if (!isOpen) return null;

  return (
    <div className="modal active flex items-center justify-center p-4">
      <div className="modal-content relative animate-in fade-in zoom-in-95 duration-200 bg-[var(--bg-primary)] border border-[var(--border-color)] overflow-visible max-w-xl w-full flex flex-col p-6 rounded-2xl shadow-2xl">
        
        {/* Title Input (Mirrored) */}
        <div className="mirror-input-container">
          <div 
            className="mirror-textarea absolute top-0 left-0 w-full h-full pointer-events-none whitespace-pre-wrap break-words border border-transparent font-medium"
            dangerouslySetInnerHTML={{ __html: getHighlightedHtml() + (title.endsWith(' ') ? '&nbsp;' : '') }}
          />
          <input 
            ref={inputRef}
            type="text" 
            value={title}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className="real-textarea w-full text-transparent caret-[var(--text-main)] font-medium outline-none border border-[var(--border-color)] bg-transparent rounded-xl focus:border-red-500/30 transition-colors"
            placeholder="e.g. Design app screen @Sarah #Marketing !p1"
          />
          
          {/* Autocomplete Menu */}
          {menu && (
            <div className="autocomplete-menu absolute left-0 top-full mt-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-[999] min-w-[240px] max-h-[220px] overflow-y-auto py-1">
              {menu.items.map((it, i) => (
                <div 
                  key={i}
                  className={`menu-item px-3 py-2 flex items-center gap-2.5 cursor-pointer text-sm font-medium transition-colors ${
                    i === menu.index ? 'bg-[var(--border-color)]' : 'hover:bg-[var(--border-color)]'
                  } ${it.class || ''}`}
                  onClick={() => applyToken(it.type || menu.type, it.val)}
                >
                  <i className={`fas fa-${it.icon} w-4 text-center ${it.color || 'text-gray-400'}`}></i>
                  <span className="text-[var(--text-main)]">{it.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes/Description */}
        <textarea 
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Add description..."
          className="w-full mt-3 px-4 py-2.5 text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none resize-none min-h-[60px] focus:border-red-500/20 transition-colors"
        />

        {/* Staged Meta Tags (Chips) */}
        <div className="flex flex-wrap gap-1.5 mt-4 min-h-[28px] items-center">
          {stagedMeta.projectId && (
            <span className="tag-pill text-green-600 dark:text-green-400 flex items-center gap-1.5 font-bold">
              <i className="fas fa-circle text-[6px]"></i> {stagedMeta.projectId}
              <button onClick={() => setStagedMeta(s => ({ ...s, projectId: null }))} className="hover:text-red-500 ml-0.5 text-[9px]">✕</button>
            </span>
          )}
          {stagedMeta.assigneeId && (
            <span className="tag-pill text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-bold">
              <i className="fas fa-user text-[9px]"></i> {users.find(u => u.id === stagedMeta.assigneeId)?.name.split(' (')[0]}
              <button onClick={() => setStagedMeta(s => ({ ...s, assigneeId: null }))} className="hover:text-red-500 ml-0.5 text-[9px]">✕</button>
            </span>
          )}
          {stagedMeta.dueDate && (
            <span className="tag-pill text-orange-600 dark:text-orange-400 flex items-center gap-1.5 font-bold">
              <i className="fas fa-calendar text-[9px]"></i> {stagedMeta.dueDate.includes('T')
                ? new Date(stagedMeta.dueDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : new Date(`${stagedMeta.dueDate}T00:00`).toLocaleDateString()}
              <button onClick={() => setStagedMeta(s => ({ ...s, dueDate: null, dueTime: null }))} className="hover:text-red-500 ml-0.5 text-[9px]">✕</button>
            </span>
          )}
          {stagedMeta.tags.map(t => (
            <span key={t} className="tag-pill text-purple-600 dark:text-purple-400 flex items-center gap-1.5 font-bold">
              <i className="fas fa-hashtag text-[9px]"></i> {t}
              <button onClick={() => removeTag(t)} className="hover:text-red-500 ml-0.5 text-[9px]">✕</button>
            </span>
          ))}
          {stagedMeta.reminder && (
            <span className="tag-pill text-teal-600 dark:text-teal-400 flex items-center gap-1.5 font-bold">
              <i className="fas fa-bell text-[9px]"></i> {stagedMeta.reminder}m
              <button onClick={() => setStagedMeta(s => ({ ...s, reminder: null }))} className="hover:text-red-500 ml-0.5 text-[9px]">✕</button>
            </span>
          )}
          {stagedMeta.recurrence && (
            <span className="tag-pill text-violet-600 dark:text-violet-400 flex items-center gap-1.5 font-bold">
              <i className="fas fa-redo text-[9px]"></i> {stagedMeta.recurrence}
              <button onClick={() => setStagedMeta(s => ({ ...s, recurrence: null }))} className="hover:text-red-500 ml-0.5 text-[9px]">✕</button>
            </span>
          )}
          <span className={`tag-pill font-bold tracking-wide uppercase ${
            stagedMeta.priority === 'p1' ? 'text-red-500 border-red-200 bg-red-50/50' : 
            stagedMeta.priority === 'p2' ? 'text-orange-500 border-orange-200 bg-orange-50/50' : 
            stagedMeta.priority === 'p3' ? 'text-blue-500 border-blue-200 bg-blue-50/50' : 'text-gray-400'
          }`}>{stagedMeta.priority}</span>
        </div>

        {/* Action Toolbar Popovers */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color)] relative">
          <div className="flex items-center gap-1.5" ref={popoverRef}>
            
            {/* Schedule (Date) */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setActivePopover(activePopover === 'schedule' ? null : 'schedule')}
                className={`w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-xs text-gray-500 hover:text-[var(--text-main)] transition-colors ${activePopover === 'schedule' ? 'bg-[var(--border-color)] text-[var(--accent)]' : ''}`}
                title="Schedule"
              >
                <i className="fas fa-calendar"></i>
              </button>
              
              {activePopover === 'schedule' && (
                <div className="absolute left-0 bottom-full mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-3 z-50 min-w-[200px] flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Set Due Date</p>
                  <button 
                    onClick={() => { setStagedMeta(s => ({ ...s, dueDate: getLocalDateStr(0), dueTime: '12:00' })); setActivePopover(null); }}
                    className="text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2"
                  >
                    <i className="fas fa-sun text-yellow-500 text-sm w-4"></i> Today
                  </button>
                  <button 
                    onClick={() => {
                      const tom = new Date();
                      tom.setDate(tom.getDate() + 1);
                      setStagedMeta(s => ({ ...s, dueDate: getLocalDateStr(1), dueTime: '12:00' }));
                      setActivePopover(null);
                    }}
                    className="text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2"
                  >
                    <i className="fas fa-moon text-blue-400 text-sm w-4"></i> Tomorrow
                  </button>
                  <button 
                    onClick={() => {
                      const nextW = new Date();
                      nextW.setDate(nextW.getDate() + (1 + 7 - nextW.getDay()) % 7 || 7);
                      setStagedMeta(s => ({ ...s, dueDate: getLocalDateStr(7), dueTime: '12:00' }));
                      setActivePopover(null);
                    }}
                    className="text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2"
                  >
                    <i className="fas fa-calendar-week text-green-500 text-sm w-4"></i> Next Monday
                  </button>
                  <div className="border-t border-[var(--border-color)] my-1.5"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={stagedMeta.dueDate ? stagedMeta.dueDate.split('T')[0] : ''}
                      onChange={(e) => setStagedMeta(s => ({ ...s, dueDate: e.target.value }))}
                      className="w-full text-xs p-1.5 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] outline-none"
                    />
                    <input
                      type="time"
                      value={stagedMeta.dueTime ?? (stagedMeta.dueDate?.includes('T') ? stagedMeta.dueDate.split('T')[1] : '')}
                      onChange={(e) => setStagedMeta(s => ({ ...s, dueTime: e.target.value }))}
                      className="w-full text-xs p-1.5 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] outline-none"
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
                className={`w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-xs text-gray-500 hover:text-[var(--text-main)] transition-colors ${activePopover === 'assignee' ? 'bg-[var(--border-color)] text-[var(--accent)]' : ''}`}
                title="Assign User"
              >
                <i className="fas fa-user"></i>
              </button>
              
              {activePopover === 'assignee' && (
                <div className="absolute left-0 bottom-full mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2.5 z-50 min-w-[200px] flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1.5">Assign User</p>
                  {users.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => { setStagedMeta(s => ({ ...s, assigneeId: u.id })); trackUsedToken('assignees', u.id); setActivePopover(null); }}
                      className={`text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between ${stagedMeta.assigneeId === u.id ? 'bg-red-50 text-[var(--accent)]' : ''}`}
                    >
                      <span>{u.name}</span>
                      {stagedMeta.assigneeId === u.id && <i className="fas fa-check text-[10px]"></i>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setActivePopover(activePopover === 'project' ? null : 'project')}
                className={`w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-xs text-gray-500 hover:text-[var(--text-main)] transition-colors ${activePopover === 'project' ? 'bg-[var(--border-color)]' : ''}`}
                title="Project"
              >
                <i className="fas fa-circle text-[7px]"></i>
              </button>
              
              {activePopover === 'project' && (
                <div className="absolute left-0 bottom-full mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2.5 z-50 min-w-[200px] flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1.5">Project</p>
                  {projects.map(p => (
                    <button 
                      key={p}
                      onClick={() => { setStagedMeta(s => ({ ...s, projectId: p })); trackUsedToken('projects', p); setActivePopover(null); }}
                      className={`text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between ${stagedMeta.projectId === p ? 'bg-green-50 text-green-600' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        <i className="fas fa-circle text-[6px] text-gray-400"></i> {p}
                      </span>
                      {stagedMeta.projectId === p && <i className="fas fa-check text-[10px]"></i>}
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
                className={`w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-xs text-gray-500 hover:text-[var(--text-main)] transition-colors ${activePopover === 'priority' ? 'bg-[var(--border-color)]' : ''}`}
                title="Priority"
              >
                <i className="fas fa-flag"></i>
              </button>
              
              {activePopover === 'priority' && (
                <div className="absolute left-0 bottom-full mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 min-w-[150px] flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-2 py-0.5">Priority</p>
                  {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map(p => (
                    <button 
                      key={p}
                      onClick={() => { setStagedMeta(s => ({ ...s, priority: p })); setActivePopover(null); }}
                      className="text-left px-2.5 py-1 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2"
                    >
                      <i className={`fas fa-flag ${
                        p === 'p1' ? 'text-red-500' : 
                        p === 'p2' ? 'text-orange-500' : 
                        p === 'p3' ? 'text-blue-500' : 'text-gray-400'
                      }`}></i>
                      <span>{p === 'p1' ? 'Priority 1' : p === 'p2' ? 'Priority 2' : p === 'p3' ? 'Priority 3' : 'Priority 4'}</span>
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
                className={`w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-xs text-gray-500 hover:text-[var(--text-main)] transition-colors ${activePopover === 'reminder' ? 'bg-[var(--border-color)]' : ''}`}
                title="Reminder"
              >
                <i className="fas fa-bell"></i>
              </button>
              
              {activePopover === 'reminder' && (
                <div className="absolute left-0 bottom-full mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 min-w-[160px] flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1.5">Reminder</p>
                  {[
                    { label: 'At due time', val: '0' },
                    { label: '10m before', val: '10' },
                    { label: '30m before', val: '30' },
                    { label: '1h before', val: '60' }
                  ].map(r => (
                    <button 
                      key={r.val}
                      onClick={() => { setStagedMeta(s => ({ ...s, reminder: r.val })); setActivePopover(null); }}
                      className="text-left px-2.5 py-1 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-md"
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
                className={`w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-xs text-gray-500 hover:text-[var(--text-main)] transition-colors ${activePopover === 'recurrence' ? 'bg-[var(--border-color)]' : ''}`}
                title="Recurrence"
              >
                <i className="fas fa-redo text-xs"></i>
              </button>
              
              {activePopover === 'recurrence' && (
                <div className="absolute left-0 bottom-full mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 min-w-[140px] flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1.5">Recurrence</p>
                  {[
                    { label: 'None', val: null },
                    { label: 'Daily', val: 'daily' },
                    { label: 'Weekly', val: 'weekly' },
                    { label: 'Monthly', val: 'monthly' }
                  ].map(rec => (
                    <button 
                      key={rec.label}
                      onClick={() => { setStagedMeta(s => ({ ...s, recurrence: rec.val as any })); setActivePopover(null); }}
                      className="text-left px-2.5 py-1 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-md"
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {(title.trim() || desc.trim() || stagedMeta.tags.length > 0 || stagedMeta.dueDate) && (
              <button 
                onClick={handleClearDraft}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear Draft"
              >
                Clear
              </button>
            )}
            <button 
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-5 py-2 text-xs font-bold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] hover:brightness-105 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-red-500/10 transition-all active:scale-95"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Dynamic Wisdom Panel (Bhagavad Gita easter egg) */}
        {activeWisdom && (
          <div className="mt-5 p-4 bg-orange-50/50 dark:bg-orange-950/10 border-l-4 border-orange-500 rounded-r-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <i className="fas fa-feather-alt text-xs"></i> Wisdom from Seva Shastra
            </div>
            <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
              "{activeWisdom.quote}"
            </p>
            <span className="block text-[10px] font-semibold text-gray-500 text-right mt-1">
              — {activeWisdom.source}
            </span>
          </div>
        )}

      </div>
      
      {/* Hidden date picker trigger for ? symbol shorthand */}
      <input 
        ref={datePickerRef}
        type="date" 
        className="hidden" 
        onChange={(e) => {
          setStagedMeta(s => ({ ...s, dueDate: e.target.value, dueTime: null }));
          inputRef.current?.focus();
        }}
      />
    </div>
  );
};

export default QuickEntryModal;
