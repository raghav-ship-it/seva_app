'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Priority, Recurrence } from '@/lib/types';
import { getLocalDateStr } from '@/lib/date';

// Tiptap & ProseMirror Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

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

  const datePickerRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Core natural language processing parsing engine
  const processTextContent = (val: string) => {
    setTitle(val);
    
    if (!val) {
    setMenu(null);
    return;
  }

  const lastWord = val.split(' ').pop() || '';
  
  // Don't show menu if last word already looks like a completed token
  if (/^(@|#|\^|!p[1-4]|\+|\*)/.test(lastWord) && lastWord.length > 2) {
    setMenu(null);
    return;
  }
    const words = val.split(' ');
    
    if (lastWord.startsWith('@')) {
      const search = lastWord.slice(1).toLowerCase();
      const recents = recentTokens?.assignees || [];
      const filtered = users.filter(u => u.name.toLowerCase().includes(search));
      
      const sorted = [...filtered].sort((a, b) => {
        const aIdx = recents.indexOf(a.id);
        const bIdx = recents.indexOf(b.id);
        if (aIdx !== -1 && bIdx === -1) return -1;
        if (aIdx === -1 && bIdx !== -1) return 1;
        return aIdx - bIdx;
      });

      let items: AutocompleteItem[] = sorted.map(u => ({ label: u.name, val: u.id, icon: 'user' }));
      
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
      const updatedText = val.slice(0, -1);
      editor?.commands.setContent(updatedText);
      setTitle(updatedText);
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

  // Inline Tiptap Native Decorator Engine to dynamically target meta tags safely
  const tokenHighlightPlugin = new Plugin({
    key: new PluginKey('token-dynamic-decorator'),
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];
        state.doc.descendants((node, pos) => {
          if (node.isText && node.text) {
            const text = node.text;
            const regex = /(@[\w-]+)|(#[\w-]+)|(\^[\w-]+)|(!p[1-4])|(\?[\w-]+)|(\+[\w-]+)|(\*[\w-]+)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
              const start = pos + match.index;
              const end = start + match[0].length;
              decorations.push(
                Decoration.inline(start, end, {
                  class: 'text-red-500 font-semibold bg-red-50/40 px-0.5 rounded pointer-events-none',
                  'data-testid': 'natural-language-match',
                  'data-highlighted-match': 'true'
                })
              );
            }
          }
        });
        return DecorationSet.create(state.doc, decorations);
      }
    }
  });

  // Tiptap Architecture Configuration Hook loop
  const editor = useEditor({
  extensions: [
    StarterKit.configure({
      paragraph: {
        HTMLAttributes: {
          class: 'mb-0',
        },
      },
    }),
    Placeholder.configure({
      placeholder: 'e.g. Design app screen @Sarah #Marketing !p1',
      emptyEditorClass: 'before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none before:h-0'
    }),
  ],

  editorProps: {
    attributes: {
      class: 'w-full text-lg font-normal outline-none border-none text-gray-800 Prosemirror-RichField min-h-[32px] whitespace-pre-wrap break-words'
    },

    // Improved handleKeyDown - Full Space Support
    handleKeyDown: (view, event) => {
      // ← CRITICAL: Let Space key work normally (single tap = one space)
      if (event.key === ' ') {
        return false; // Do not intercept space at all
      }

      if (menu) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setMenu(m => m ? { ...m, index: (m.index + 1) % m.items.length } : null);
          return true;
        } 
        else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setMenu(m => m ? { ...m, index: (m.index - 1 + m.items.length) % m.items.length } : null);
          return true;
        } 
        else if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          const it = menu.items[menu.index];
          applyToken(it.type || menu.type, it.val);
          return true;
        } 
        else if (event.key === 'Escape') {
          setMenu(null);
          return true;
        }
      } 
      else {
        if (event.key === 'Enter' && !event.ctrlKey) {
          event.preventDefault();
          handleSave();
          return true;
        } 
        else if (event.key === 'Enter' && event.ctrlKey) {
          handleSave();
          return true;
        } 
        else if (event.key === 'Escape') {
          handleClose();
          return true;
        }
      }
      return false;
    }
  },


});
  // Dynamically inject custom decorator code inside Tiptap schema loops
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.registerPlugin(tokenHighlightPlugin);
    }
  }, [editor]);

  // Initialize draft / defaults
  useEffect(() => {
    if (isOpen && editor) {
      if (modalDraft) {
        editor.commands.setContent(modalDraft.title);
        setTitle(modalDraft.title);
        setDesc(modalDraft.desc);
        setStagedMeta(modalDraft.stagedMeta);
      } else {
        const parsedDefaultDueDate = defaultDueDate && defaultDueDate.includes('T')
          ? { dueDate: defaultDueDate.split('T')[0], dueTime: defaultDueDate.split('T')[1] }
          : { dueDate: defaultDueDate, dueTime: null };

        editor.commands.clearContent();
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
      setTimeout(() => editor.commands.focus('end'), 80);
    }
  }, [isOpen, modalDraft, currentUser, defaultDueDate, defaultProject, projects, editor]);

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

  const applyToken = (type: string, val: any) => {
  if (!editor) return;

  const currentText = editor.getText().trimEnd();
  const words = currentText.split(' ');
  const lastWord = words.pop() || ''; // Get the trigger word (e.g. "@sa")

  let tokenToInsert = '';

  if (type === 'new_user' || type === 'assignee') {
    const user = users.find(u => u.id === val);
    tokenToInsert = `@${user ? user.name.split(' ')[0] : val}`;
    setStagedMeta(s => ({ ...s, assigneeId: val }));
  } 
  else if (type === 'new_tag' || type === 'tag') {
    tokenToInsert = `#${val}`;
    setStagedMeta(s => ({ 
      ...s, 
      tags: s.tags.includes(val) ? s.tags : [...s.tags, val] 
    }));
  } 
  else if (type === 'new_project' || type === 'project') {
    tokenToInsert = `^${val}`;
    setStagedMeta(s => ({ ...s, projectId: val }));
  } 
  else if (type === 'priority') {
    tokenToInsert = `!${val}`;
    setStagedMeta(s => ({ ...s, priority: val }));
  } 
  else if (type === 'reminder') {
    tokenToInsert = `+${val}`;
    setStagedMeta(s => ({ ...s, reminder: val }));
  } 
  else if (type === 'recurrence') {
    tokenToInsert = `*${val}`;
    setStagedMeta(s => ({ ...s, recurrence: val }));
  }

  // Rebuild text with the visible token
  const newText = [...words, tokenToInsert].join(' ') + ' ';

  editor.commands.setContent(newText);
  setTitle(newText);
  editor.commands.focus('end');

  setMenu(null);
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
    
    clearModalDraft();
    onClose();
  };


  const handleClearDraft = () => {
    clearModalDraft();
    editor?.commands.clearContent();
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

  const activeWisdom = stagedMeta.tags
    .map(t => WISDOM_QUOTES[t.toLowerCase()])
    .find(q => q !== undefined);

  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // Keyboard accessibility and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      
      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 pt-24 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-gray-200 overflow-visible flex flex-col text-gray-800">
        
        {/* Upper Composer Area */}
        <div className="p-4 flex flex-col gap-1" ref={popoverRef}>
          
          {/* Header Row: Unified Rich-Text Tiptap Input Container */}
          <div className="flex items-start justify-between gap-4 relative">
            <div className="relative flex-1 min-h-[32px]">
              <EditorContent editor={editor} />
            </div>

            {/* Dictate Panel / Visual cues right-aligned */}
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-green-600 bg-green-50 px-2 py-0.5 rounded cursor-pointer select-none">
              <span className="opacity-70 text-[10px] uppercase font-mono">|||</span> DICTATE
              <i className="fas fa-wave-square text-red-500 animate-pulse ml-0.5"></i>
            </div>

            {/* Autocomplete Menu dropdown overlay */}
            {menu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[999] min-w-[240px] max-h-[220px] overflow-y-auto py-1 text-left">
                {menu.items.map((it, i) => (
                  <div 
                    key={i}
                    className={`px-3 py-2 flex items-center gap-2.5 cursor-pointer text-xs font-medium transition-colors ${
                      i === menu.index ? 'bg-gray-100' : 'hover:bg-gray-50'
                    } ${it.class || ''}`}
                    onClick={() => applyToken(it.type || menu.type, it.val)}
                  >
                    <i className={`fas fa-${it.icon} w-4 text-center text-gray-400 ${it.color || ''}`}></i>
                    <span className="text-gray-700">{it.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes/Description Area */}
          <textarea 
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            className="w-full text-xs text-gray-500 bg-transparent border-none outline-none resize-none min-h-[40px] p-0 placeholder-gray-400"
          />

          {/* Horizontal Meta Custom Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            
            {/* Schedule / Date Badge */}
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
                    ? (stagedMeta.dueDate === getLocalDateStr(0) ? 'Today' : stagedMeta.dueDate)
                    : 'Schedule'
                  }
                </span>
                {stagedMeta.dueDate && (
                  <span onClick={(e) => { e.stopPropagation(); setStagedMeta(s => ({ ...s, dueDate: null, dueTime: null })); }} className="hover:text-red-500 ml-1 text-[9px]">✕</span>
                )}
              </button>
              
              {activePopover === 'schedule' && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2.5 z-50 min-w-[200px] flex flex-col gap-1 text-left">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Set Due Date</p>
                  <button 
                    onClick={() => { setStagedMeta(s => ({ ...s, dueDate: getLocalDateStr(0), dueTime: '12:00' })); setActivePopover(null); }}
                    className="text-left px-2 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded flex items-center gap-2 text-gray-700"
                  >
                    <i className="fas fa-sun text-yellow-500 text-sm w-4"></i> Today
                  </button>
                  <button 
                    onClick={() => { setStagedMeta(s => ({ ...s, dueDate: getLocalDateStr(1), dueTime: '12:00' })); setActivePopover(null); }}
                    className="text-left px-2 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded flex items-center gap-2 text-gray-700"
                  >
                    <i className="fas fa-moon text-blue-400 text-sm w-4"></i> Tomorrow
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={stagedMeta.dueDate ? stagedMeta.dueDate.split('T')[0] : ''}
                      onChange={(e) => setStagedMeta(s => ({ ...s, dueDate: e.target.value }))}
                      className="w-full text-[11px] p-1 border border-gray-200 rounded bg-gray-50 text-gray-800 outline-none"
                    />
                    <input
                      type="time"
                      value={stagedMeta.dueTime ?? (stagedMeta.dueDate?.includes('T') ? stagedMeta.dueDate.split('T')[1] : '')}
                      onChange={(e) => setStagedMeta(s => ({ ...s, dueTime: e.target.value }))}
                      className="w-full text-[11px] p-1 border border-gray-200 rounded bg-gray-50 text-gray-800 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Assignee Context / Attachment Mock Button */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setActivePopover(activePopover === 'assignee' ? null : 'assignee')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 ${stagedMeta.assigneeId ? 'border-blue-200 text-blue-700 bg-blue-50/30' : ''}`}
              >
                <i className="fas fa-paperclip text-xs text-gray-400"></i>
                <span>{stagedMeta.assigneeId ? users.find(u => u.id === stagedMeta.assigneeId)?.name.split(' (')[0] : 'Attachment'}</span>
                {stagedMeta.assigneeId && (
                  <span onClick={(e) => { e.stopPropagation(); setStagedMeta(s => ({ ...s, assigneeId: null })); }} className="hover:text-red-500 ml-1 text-[9px]">✕</span>
                )}
              </button>
              
              {activePopover === 'assignee' && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50 min-w-[180px] flex flex-col gap-0.5 text-left">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1.5">Assign User</p>
                  {users.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => { setStagedMeta(s => ({ ...s, assigneeId: u.id })); trackUsedToken('assignees', u.id); setActivePopover(null); }}
                      className={`text-left px-2 py-1 text-xs font-semibold hover:bg-gray-50 rounded flex items-center justify-between text-gray-700 ${stagedMeta.assigneeId === u.id ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      <span>{u.name}</span>
                      {stagedMeta.assigneeId === u.id && <i className="fas fa-check text-[9px]"></i>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Button */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setActivePopover(activePopover === 'priority' ? null : 'priority')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 ${
                  stagedMeta.priority !== 'p4' ? 'bg-orange-50/40 text-orange-700 border-orange-200' : ''
                }`}
              >
                <i className={`fas fa-flag text-xs ${
                  stagedMeta.priority === 'p1' ? 'text-red-500' : 
                  stagedMeta.priority === 'p2' ? 'text-orange-500' : 
                  stagedMeta.priority === 'p3' ? 'text-blue-500' : 'text-gray-400'
                }`}></i>
                <span>{stagedMeta.priority === 'p4' ? 'Priority' : stagedMeta.priority.toUpperCase()}</span>
              </button>
              
              {activePopover === 'priority' && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 z-50 min-w-[140px] flex flex-col text-left">
                  {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map(p => (
                    <button 
                      key={p}
                      onClick={() => { setStagedMeta(s => ({ ...s, priority: p })); setActivePopover(null); }}
                      className="text-left px-2 py-1 text-xs font-semibold hover:bg-gray-50 rounded flex items-center gap-2 text-gray-700"
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

            {/* Reminders Button */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setActivePopover(activePopover === 'reminder' ? null : 'reminder')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 ${stagedMeta.reminder ? 'bg-teal-50 text-teal-700 border-teal-200' : ''}`}
              >
                <i className="fas fa-bell text-xs text-gray-400"></i>
                <span>{stagedMeta.reminder ? `${stagedMeta.reminder}m before` : 'Reminders'}</span>
                {stagedMeta.reminder && (
                  <span onClick={(e) => { e.stopPropagation(); setStagedMeta(s => ({ ...s, reminder: null })); }} className="hover:text-red-500 ml-1 text-[9px]">✕</span>
                )}
              </button>
              
              {activePopover === 'reminder' && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-50 min-w-[150px] flex flex-col text-left">
                  {[
                    { label: 'At due time', val: '0' },
                    { label: '10m before', val: '10' },
                    { label: '30m before', val: '30' },
                    { label: '1h before', val: '60' }
                  ].map(r => (
                    <button 
                      key={r.val}
                      onClick={() => { setStagedMeta(s => ({ ...s, reminder: r.val })); setActivePopover(null); }}
                      className="text-left px-2 py-1 text-xs font-semibold hover:bg-gray-50 rounded text-gray-700"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recurrence Trigger Button */}
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
                  <span onClick={(e) => { e.stopPropagation(); setStagedMeta(s => ({ ...s, recurrence: null })); }} className="hover:text-red-500 ml-0.5 text-[9px]">✕</span>
                )}
              </button>
              
              {activePopover === 'recurrence' && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-50 min-w-[140px] flex flex-col text-left">
                  {[
                    { label: 'None', val: null },
                    { label: 'Daily', val: 'daily' },
                    { label: 'Weekly', val: 'weekly' },
                    { label: 'Monthly', val: 'monthly' }
                  ].map(rec => (
                    <button 
                      key={rec.label}
                      onClick={() => { setStagedMeta(s => ({ ...s, recurrence: rec.val as any })); setActivePopover(null); }}
                      className="text-left px-2 py-1 text-xs font-semibold hover:bg-gray-50 rounded text-gray-700"
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Staged inline text metadata tag chips */}
          {stagedMeta.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {stagedMeta.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded text-[11px] font-medium">
                  #{t}
                  <button onClick={() => removeTag(t)} className="hover:text-red-500 text-[10px] ml-0.5">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions Layout Grid wrapper */}
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-xl flex items-center justify-between">
          
          {/* Bottom Left: Dropdown Folder Context / Project Selector */}
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
                {projects.map(p => (
                  <button 
                    key={p}
                    onClick={() => { setStagedMeta(s => ({ ...s, projectId: p })); trackUsedToken('projects', p); setActivePopover(null); }}
                    className={`text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50 rounded flex items-center justify-between text-gray-700 ${stagedMeta.projectId === p ? 'bg-green-50 text-green-600' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <i className="fas fa-circle text-[6px] text-gray-400"></i>{p}
                    </span>
                    {stagedMeta.projectId === p && <i className="fas fa-check text-[9px]"></i>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Right: Actions Controller row */}
          <div className="flex items-center gap-2">
            {(title.trim() || desc.trim() || stagedMeta.tags.length > 0 || stagedMeta.dueDate) && (
              <button 
                onClick={handleClearDraft}
                className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                title="Clear Draft"
              >
                Clear
              </button>
            )}
            <button 
              onClick={handleClose}
              className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-1.5 text-xs font-bold bg-red-400/90 hover:bg-red-400 text-white rounded-md disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all"
            >
              Add task
            </button>
          </div>
        </div>

        {/* Dynamic Eastern philosophy quote banner row */}
        {activeWisdom && (
          <div className="m-4 mt-0 p-3 bg-orange-50/40 border-l-2 border-orange-400 rounded-r-lg animate-fade-in text-left">
            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <i className="fas fa-feather-alt text-[9px]"></i> Wisdom from Seva Shastra
            </div>
            <p className="text-xs text-gray-500 italic leading-relaxed">
              "{activeWisdom.quote}"
            </p>
            <span className="block text-[10px] font-semibold text-gray-400 text-right mt-0.5">
              — {activeWisdom.source}
            </span>
          </div>
        )}

      </div>
      
      {/* Invisible triggering channel for ? macro shortcuts */}
      <input 
        ref={datePickerRef}
        type="date" 
        className="hidden" 
        onChange={(e) => {
          setStagedMeta(s => ({ ...s, dueDate: e.target.value, dueTime: null }));
          editor?.commands.focus('end');
        }}
      />
    </div>
  );
};

export default QuickEntryModal;