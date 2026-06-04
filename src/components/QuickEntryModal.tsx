'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Priority, Recurrence } from '@/lib/types';
import { getLocalDateStr, getLocalIsoDateTime ,t} from '@/lib/date';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDueDate?: string | null;
  defaultProject?: string | null;
}

const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultDueDate = null, 
  defaultProject = null 
}) => {
  const { 
    addTask, users, tags, projects, currentUser, 
    addUser, addTag, addProject, recentTokens, 
    trackUsedToken, modalDraft, saveModalDraft, clearModalDraft
  } = useStore();
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [stagedMeta, setStagedMeta] = useState({
    assigneeId: null as string | null,
    projectId: null as string | null,
    tags: [] as string[],
    priority: 'p4' as Priority,
    dueDate: null as string | null,
    dueTime: null as string | null,
    reminder: null as string | null,
    recurrence: null as Recurrence
  });

  const [menu, setMenu] = useState<{ items: any[], type: string, index: number } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Sync Drafts
  useEffect(() => {
    if (isOpen) {
      if (modalDraft) {
        setTitle(modalDraft.title);
        setDesc(modalDraft.desc);
        setStagedMeta(modalDraft.stagedMeta);
      } else {
        setTitle('');
        setDesc('');
        setStagedMeta({
          assigneeId: currentUser?.id || null,
          projectId: defaultProject || (projects.length > 0 ? projects[0] : null),
          tags: [],
          priority: 'p4',
          dueDate: defaultDueDate,
          dueTime: null,
          reminder: null,
          recurrence: null
        });
      }
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, modalDraft, currentUser, defaultDueDate, defaultProject, projects]);

  useEffect(() => {
    if (isOpen && (title.trim() || desc.trim() || stagedMeta.tags.length > 0 || stagedMeta.dueDate)) {
      saveModalDraft({ title, desc, stagedMeta });
    }
  }, [title, desc, stagedMeta, isOpen, saveModalDraft]);

  // Token String Parsing Core Logic
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    
    const words = val.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@')) {
      const search = lastWord.slice(1).toLowerCase();
      const filtered = users.filter(u => u.name.toLowerCase().includes(search));
      let items = filtered.map(u => ({ label: u.name, val: u.id, icon: 'user' }));
      setMenu({ items, type: 'assignee', index: 0 });
    } else if (lastWord.startsWith('#')) {
      const search = lastWord.slice(1).toLowerCase();
      const filtered = tags.filter(t => t.toLowerCase().includes(search));
      let items = filtered.map(t => ({ label: t, val: t, icon: 'hashtag' }));
      setMenu({ items, type: 'tag', index: 0 });
    } else if (lastWord.startsWith('!')) {
      setMenu({ items: [
        { label: 'Priority 1', val: 'p1', icon: 'flag', color: 'text-red-500' },
        { label: 'Priority 2', val: 'p2', icon: 'flag', color: 'text-orange-500' },
        { label: 'Priority 3', val: 'p3', icon: 'flag', color: 'text-blue-500' },
        { label: 'Priority 4', val: 'p4', icon: 'flag', color: 'text-gray-400' }
      ], type: 'priority', index: 0 });
    } else {
      setMenu(null);
    }
  };

  const appendTokenTrigger = (char: string) => {
    setTitle(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + char);
    setTimeout(() => {
      inputRef.current?.focus();
      // Dispatch fake event change to activate dropdown menu
      if (inputRef.current) handleInput({ target: inputRef.current } as any);
    }, 50);
  };

  const applyToken = (type: string, val: any) => {
    const words = title.split(' ');
    words.pop();
    setTitle(words.join(' ') + (words.length ? ' ' : ''));

    if (type === 'tag') setStagedMeta(s => ({ ...s, tags: s.tags.includes(val) ? s.tags : [...s.tags, val] }));
    if (type === 'assignee') setStagedMeta(s => ({ ...s, assigneeId: val }));
    if (type === 'priority') setStagedMeta(s => ({ ...s, priority: val }));
    
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
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = menu.items[menu.index];
        applyToken(menu.type, it.val);
      }
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleSave = () => {
    if (!title.trim() || !currentUser) return;
    addTask({
      title: title.trim(), desc,
      dueDate: stagedMeta.dueDate, priority: stagedMeta.priority,
      dueTime: null,
      tags: stagedMeta.tags, assigneeId: stagedMeta.assigneeId || currentUser.id,
      creatorId: currentUser.id, reminder: stagedMeta.reminder,
      recurrence: stagedMeta.recurrence, myDay: false, project: stagedMeta.projectId
    });
    clearModalDraft();
    onClose();
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getHighlightedHtml = () => {
    return title
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/(@\w+)/g, '<span class="text-blue-500 font-semibold">$1</span>')
      .replace(/(#\w+)/g, '<span class="text-purple-500 font-semibold">$1</span>')
      .replace(/(!p[1-4])/g, '<span class="text-red-500 font-semibold">$1</span>');
  };

  if (!isOpen) return null;

  return (
    <div className="modal active" id="task-modal">
      <div className="modal-content">
        
        {/* Title input utilizing the UI architecture of HTML layout + TSX Engine */}
        <div className="relative w-full mb-3">
          <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none px-3 py-2 text-sm font-medium whitespace-pre-wrap break-words border border-transparent"
            dangerouslySetInnerHTML={{ __html: getHighlightedHtml() + (title.endsWith(' ') ? '&nbsp;' : '') }}
          />
          <input 
            ref={inputRef}
            type="text" 
            value={title}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className="w-full text-transparent caret-gray-800 dark:caret-white px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-transparent"
            placeholder="e.g. Update report @Sarah #Work !p1"
          />

          {/* Dynamic Autocomplete Dropdown matching HTML style */}
          {menu && (
            <div id="autocomplete-box" className="autocomplete-menu absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-full max-h-40 overflow-y-auto">
              {menu.items.map((it, i) => (
                <div 
                  key={i} 
                  onClick={() => applyToken(menu.type, it.val)}
                  className={`menu-item px-3 py-2 text-xs cursor-pointer flex items-center gap-2 hover:bg-gray-100 ${i === menu.index ? 'bg-gray-100' : ''}`}
                >
                  <i className={`fas fa-${it.icon} text-gray-400 ${it.color || ''}`}></i>
                  <span>{it.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description Field */}
        <textarea 
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          id="modal-task-desc" 
          className="input-desc w-full border border-gray-200 rounded px-3 py-2 text-xs" 
          placeholder="Notes..."
        />
        
        {/* Quick Token Carousel Layout exactly from your HTML layout preference */}
        <div className="flex flex-col gap-2 mt-6">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Quick Token Shortcuts:</div>
          <div className="token-carousel-container flex items-center gap-1">
            <button type="button" className="carousel-nav-btn" onClick={() => scrollCarousel('left')}>
              <i className="fas fa-chevron-left"></i>
            </button>
            
            <div ref={carouselRef} className="token-carousel flex gap-2 overflow-x-hidden scroll-smooth whitespace-nowrap py-1">
              <button type="button" className="token-btn px-2.5 py-1.5 border border-gray-200 text-xs rounded flex items-center gap-1.5 bg-gray-50" onClick={() => appendTokenTrigger('@')}>
                <i className="fas fa-user text-blue-500"></i> @ User
              </button>
              <button type="button" className="token-btn px-2.5 py-1.5 border border-gray-200 text-xs rounded flex items-center gap-1.5 bg-gray-50" onClick={() => appendTokenTrigger('#')}>
                <i className="fas fa-hashtag text-purple-500"></i> # Tag
              </button>
              <button type="button" className="token-btn px-2.5 py-1.5 border border-gray-200 text-xs rounded flex items-center gap-1.5 bg-gray-50" onClick={() => appendTokenTrigger('!')}>
                <i className="fas fa-flag text-red-500"></i> ! Prio
              </button>
              <button type="button" className="token-btn px-2.5 py-1.5 border border-gray-200 text-xs rounded flex items-center gap-1.5 bg-gray-50" onClick={() => datePickerRef.current?.showPicker()}>
                <i className="fas fa-calendar text-orange-500"></i> ? Due
              </button>
            </div>

            <button type="button" className="carousel-nav-btn" onClick={() => scrollCarousel('right')}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* Meta Visualization Pills Container */}
        <div id="modal-meta-pills" className="flex flex-wrap gap-2 mt-4 min-h-[24px]">
          {stagedMeta.tags.map(t => (
            <span key={t} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[11px] font-bold flex items-center gap-1">
              #{t}
            </span>
          ))}
          {stagedMeta.assigneeId && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-bold flex items-center gap-1">
              <i className="fas fa-user text-[9px]"></i> Assigned
            </span>
          )}
        </div>

        <input 
          ref={datePickerRef}
          type="datetime-local" 
          id="hidden-date-picker" 
          className="absolute opacity-0 pointer-events-none"
          onChange={(e) => setStagedMeta(s => ({ ...s, dueDate: e.target.value }))}
        />

        {/* Action Controls */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <button className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded hover:bg-red-700 shadow-sm" onClick={handleSave}>Add task</button>
        </div>
      </div>
    </div>
  );
};

export default QuickEntryModal;