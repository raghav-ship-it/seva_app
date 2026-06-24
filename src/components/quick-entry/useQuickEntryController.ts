'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import { useStore } from '@/store/useStore';
import { Priority, Recurrence } from '@/lib/types';
import { getLocalDateStr, parseNaturalTime } from '@/lib/date';
import { PopoverType } from './types';

export const WISDOM_QUOTES: Record<string, { quote: string; source: string }> = {
  work: {
    quote: 'Perform your prescribed duty, for action is better than inaction.',
    source: 'Bhagavad-gita 3.8',
  },
  marketing: {
    quote: 'Whatever action a great man performs, common men follow.',
    source: 'Bhagavad-gita 3.21',
  },
  urgent: {
    quote: 'One who does not react to the dualities of pleasure and pain is fit for liberation.',
    source: 'Bhagavad-gita 2.15',
  },
  'low-effort': {
    quote: 'Yoga is the journey of the self, through the self, to the self.',
    source: 'Bhagavad-gita 6.18',
  },
};

interface UseQuickEntryControllerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDueDate?: string | null;
  defaultProject?: string | null;
  defaultMyDay?: boolean;
}

export function useQuickEntryController({
  isOpen,
  onClose,
  defaultDueDate = null,
  defaultProject = null,
  defaultMyDay = false,
}: UseQuickEntryControllerProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [activePopover, setActivePopover] = useState<PopoverType>(null);

  const isDraftLoadingRef = useRef(false);
  const isFixingSpacingRef = useRef(false);

  // Store hooks (must be before any useState that references store values)
  const modalDraft = useStore((s: any) => s.modalDraft);
  const saveModalDraft = useStore((s: any) => s.saveModalDraft);
  const clearModalDraft = useStore((s: any) => s.clearModalDraft);
  const users = useStore((s: any) => s.users) || [];
  const tags = useStore((s: any) => s.tags) || [];
  const projects = useStore((s: any) => s.projects) || [];
  const addTag = useStore((s: any) => s.addTag);
  const trackUsedToken = useStore((s: any) => s.trackUsedToken);
  const currentUser = useStore((s: any) => s.currentUser);
  const addTask = useStore((s: any) => s.addTask);

  const [stagedMeta, setStagedMeta] = useState<{
    assigneeId: string | null;
    projectId: string | null;
    tags: string[];
    priority: Priority | null;
    dueDate: string | null;
    dueTime: string | null;
    reminder: string | null;
    recurrence: Recurrence;
    myDay: boolean;
  }>({
    assigneeId: currentUser?.role === 'admin' ? null : (currentUser?.id ?? null),
    projectId: defaultProject,
    tags: [],
    priority: null,
    dueDate: defaultDueDate || getLocalDateStr(),
    dueTime: null,
    reminder: null,
    recurrence: null,
    myDay: defaultMyDay,
  });

  const [menu, setMenu] = useState<{
    items: any[];
    type: string;
    index: number;
    startPos: number;
  } | null>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  const processTextContent = useCallback((text: string) => {
    setTitle(text);

    // Natural Language Time Parsing
    const parsedTime = parseNaturalTime(text);
    if (parsedTime) {
      setStagedMeta(s => ({
        ...s,
        dueTime: parsedTime,
        // If recurrence set but no date, default to today
        dueDate: s.recurrence && !s.dueDate ? getLocalDateStr() : s.dueDate
      }));
    }

    // Look back extraction parsing checks
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1] || '';
    
    // Fix concatenated tokens: @user!p1 -> @user !p1
    const match = lastWord.match(/([@#?^!+*]\w+)([@#?^!+*]\w+)/);
    if (match && editor && !isFixingSpacingRef.current) {
        isFixingSpacingRef.current = true;
        
        // Use insertText command instead of direct index calculation
        editor.chain()
            .focus()
            .insertContentAt(editor.state.selection.from - match[2].length, ' ')
            .run();
            
        isFixingSpacingRef.current = false;
        return; // Wait for next update
    }

    // ... rest of existing token logic

    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const filtered = users
        .filter((u: any) => u.name.toLowerCase().includes(query))
        .map((u: any) => ({ icon: 'user', label: u.name, val: u.id, type: 'assignee' }));
      
      const exactMatch = users.find((u: any) => u.name.toLowerCase() === query);
      if (exactMatch) {
        if (currentUser?.role === 'admin' || exactMatch.id === currentUser?.id) {
          setStagedMeta(s => ({ ...s, assigneeId: exactMatch.id }));
        }
      }
      
      if (filtered.length) {
        setMenu({ items: filtered, type: 'assignee', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    if (lastWord.startsWith('#')) {
      const query = lastWord.slice(1).toLowerCase();
      const filtered = tags
        .filter((t: string) => t.toLowerCase().includes(query))
        .map((t: string) => ({ icon: 'tag', label: `#${t}`, val: t, type: 'tag' }));
      
      if (query && !tags.some((t: string) => t.toLowerCase() === query)) {
          filtered.push({ icon: 'plus', label: `Create #${query}`, val: query, type: 'new_tag' });
      }
      
      if (filtered.length) {
        setMenu({ items: filtered, type: 'tag', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    if (lastWord.startsWith('!')) {
      const query = lastWord.slice(1).toLowerCase();
      const priorities = ['p1', 'p2', 'p3', 'p4'] as Priority[];
      const filtered = priorities
        .filter((p: string) => p.includes(query))
        .map((p: string) => ({ icon: 'flag', label: p.toUpperCase(), val: p, type: 'priority' }));
      
      if (priorities.includes(query as Priority)) setStagedMeta(s => ({ ...s, priority: query as Priority }));

      if (filtered.length) {
        setMenu({ items: filtered, type: 'priority', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    if (lastWord.startsWith('?')) {
      const query = lastWord.slice(1).toLowerCase().trim();
      // Parse natural date strings: "tomorrow", "monday", "jun 29", "june 29", "29 jun", YYYY-MM-DD
      const parseDate = (q: string): string | null => {
        const today = new Date(); today.setHours(0,0,0,0);
        if (!q) return null;
        if (q === 'today') return today.toISOString().slice(0,10);
        if (q === 'tomorrow') { const d = new Date(today); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); }
        const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        const wIdx = weekdays.indexOf(q);
        if (wIdx !== -1) {
          const d = new Date(today);
          const diff = (wIdx - d.getDay() + 7) % 7 || 7;
          d.setDate(d.getDate() + diff);
          return d.toISOString().slice(0,10);
        }
        const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        const mMatch = q.match(/^([a-z]+)\s*(\d{1,2})$/) || q.match(/^(\d{1,2})\s*([a-z]+)$/);
        if (mMatch) {
          const [, a, b] = mMatch;
          const mStr = isNaN(Number(a)) ? a.slice(0,3) : b.slice(0,3);
          const dayNum = isNaN(Number(a)) ? Number(b) : Number(a);
          const mIdx = months.indexOf(mStr);
          if (mIdx !== -1) {
            const year = today.getMonth() > mIdx ? today.getFullYear()+1 : today.getFullYear();
            return `${year}-${String(mIdx+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
          }
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
        return null;
      };
      const parsed = parseDate(query);
      if (parsed) {
        setStagedMeta(s => ({ ...s, dueDate: parsed }));
        // Replace the token in editor with clean date text
        const text = editor?.getText() || '';
        const before = text.slice(0, menu?.startPos ?? text.lastIndexOf('?'));
        editor?.chain().focus().setContent(before).run();
        setTitle(before);
        setMenu(null);
        return;
      }
      // Show date suggestion menu for common values
      const suggestions = [
        { label: 'Today', val: new Date().toISOString().slice(0,10), icon: 'calendar-day', type: 'date' },
        { label: 'Tomorrow', val: new Date(Date.now()+86400000).toISOString().slice(0,10), icon: 'calendar-plus', type: 'date' },
        ...['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => {
          const today2 = new Date(); today2.setHours(0,0,0,0);
          const wIdx2 = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(d.toLowerCase());
          const diff2 = (wIdx2 - today2.getDay() + 7) % 7 || 7;
          const dd = new Date(today2); dd.setDate(dd.getDate()+diff2);
          return { label: d, val: dd.toISOString().slice(0,10), icon: 'calendar', type: 'date' };
        }),
      ].filter(s => !query || s.label.toLowerCase().startsWith(query));
      if (suggestions.length) {
        setMenu({ items: suggestions, type: 'date', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    if (lastWord.startsWith('^')) {
      const query = lastWord.slice(1);
      // Parse time: ^14:30, ^3pm, ^3:30pm, ^3:00 PM
      const parseTime = (q: string): string | null => {
        const amPm = q.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
        if (amPm) {
          let h = parseInt(amPm[1],10);
          const m = amPm[2] ? parseInt(amPm[2],10) : 0;
          if (amPm[3].toLowerCase() === 'pm' && h < 12) h += 12;
          if (amPm[3].toLowerCase() === 'am' && h === 12) h = 0;
          return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        }
        const hm = q.match(/^(\d{1,2}):(\d{2})$/);
        if (hm) return `${String(parseInt(hm[1],10)).padStart(2,'0')}:${hm[2]}`;
        return null;
      };
      const parsed = parseTime(query.trim());
      if (parsed) {
        setStagedMeta(s => ({ ...s, dueTime: parsed }));
        const text = editor?.getText() || '';
        const before = text.slice(0, menu?.startPos ?? text.lastIndexOf('^'));
        editor?.chain().focus().setContent(before).run();
        setTitle(before);
        setMenu(null);
        return;
      }
      // Show time suggestion menu
      const timeSuggestions = ['6:00 AM','8:00 AM','9:00 AM','12:00 PM','3:00 PM','6:00 PM','8:00 PM','10:00 PM']
        .filter(t => !query || t.toLowerCase().startsWith(query.toLowerCase()))
        .map(t => {
          const amPmM = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)!;
          let h = parseInt(amPmM[1],10);
          if (amPmM[3].toUpperCase() === 'PM' && h < 12) h += 12;
          if (amPmM[3].toUpperCase() === 'AM' && h === 12) h = 0;
          return { label: t, val: `${String(h).padStart(2,'0')}:${amPmM[2]}`, icon: 'clock', type: 'time' };
        });
      if (timeSuggestions.length) {
        const text = editor?.getText() || '';
        setMenu({ items: timeSuggestions, type: 'time', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    if (lastWord.startsWith('+')) {
      const query = lastWord.slice(1).toLowerCase();
      const reminders = ['0', '5', '10', '15', '30', '60'];
      const filtered = reminders
        .filter(r => r.includes(query))
        .map(r => ({ icon: 'bell', label: `${r}m before`, val: r, type: 'reminder' }));
      
      if (reminders.includes(query)) setStagedMeta(s => ({ ...s, reminder: query }));

      if (filtered.length) {
        setMenu({ items: filtered, type: 'reminder', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    if (lastWord.startsWith('*')) {
      const query = lastWord.slice(1).toLowerCase();
      const recurrences = ['daily', 'weekly', 'monthly'];
      const filtered = recurrences
        .filter(r => r.includes(query))
        .map(r => ({ icon: 'redo', label: r.charAt(0).toUpperCase() + r.slice(1), val: r, type: 'recurrence' }));
      
      if (recurrences.includes(query)) setStagedMeta(s => ({ ...s, recurrence: query as Recurrence }));

      if (filtered.length) {
        setMenu({ items: filtered, type: 'recurrence', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    setMenu(null);
  }, [users, tags, projects, currentUser]);

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Add a task title...',
      }),
    ],
    onUpdate({ editor }) {
      if (!isDraftLoadingRef.current) {
        processTextContent(editor.getText());
      }
    },
  });

  // Re-hydration side-effect sync loop - ONLY run once when opening
  useEffect(() => {
    if (isOpen && editor && !editor.isDestroyed) {
      // Small delay to ensure editor is ready
      const timer = setTimeout(() => {
        if (modalDraft) {
          isDraftLoadingRef.current = true;
          editor.commands.setContent(modalDraft.title || '');
          setTitle(modalDraft.title || '');
          setDesc(modalDraft.desc || '');
          if (modalDraft.stagedMeta) setStagedMeta(modalDraft.stagedMeta);
          
          setTimeout(() => {
            isDraftLoadingRef.current = false;
          }, 50);
        } else {
          // Clear if no draft
          editor.commands.clearContent();
          setTitle('');
          setDesc('');
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editor]); // Removed modalDraft from dependencies to avoid loop

  // Handle draft auto-saves safely
  useEffect(() => {
    if (isOpen && !isDraftLoadingRef.current) {
      const timeout = setTimeout(() => {
        if (title || desc || stagedMeta.tags.length > 0) {
          saveModalDraft({ title, desc, stagedMeta });
        }
      }, 500); // Debounce save
      return () => clearTimeout(timeout);
    }
  }, [title, desc, stagedMeta, isOpen, saveModalDraft]);

  // Clean Tiptap decorator highlighting rules avoiding multi-plugin leaks
  const tokenHighlightPlugin = useMemo(() => {
    return new Plugin({
      key: new PluginKey('tokenHighlight'),
      props: {
        decorations(state) {
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              const regex = /([@#?^!+*]\w+)/g;
              let match;
              while ((match = regex.exec(node.text)) !== null) {
                const token = match[0];
                const type = token[0];
                const value = token.slice(1).toLowerCase();
                let isValid = false;

                // Validate based on token type
                if (type === '@') {
                  isValid = users.some((u: any) => u.name.toLowerCase().includes(value));
                } else if (type === '#') {
                  isValid = tags.some((t: string) => t.toLowerCase() === value);
                } else if (type === '!') {
                  isValid = ['p1', 'p2', 'p3', 'p4'].includes(value);
                } else if (type === '?') {
                  isValid = ['today','tomorrow','monday','tuesday','wednesday','thursday','friday','saturday','sunday'].some(d => d.startsWith(value)) || /^\d{1,2}[a-z]{3}/.test(value);
                } else if (type === '^') {
                  isValid = /^\d{1,2}(:\d{2})?(am|pm)?$/.test(value);
                } else if (type === '+') {
                  isValid = ['0', '5', '10', '15', '30', '60'].includes(value);
                } else if (type === '*') {
                  isValid = ['daily', 'weekly', 'monthly'].includes(value);
                }

                if (isValid) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'text-blue-600 font-semibold bg-blue-50 px-0.5 rounded',
                    })
                  );
                }
              }
            }
          });
          return DecorationSet.create(state.doc, decorations);
        },
      },
    });
  }, [users, tags, projects]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      // Unregister if already present to guarantee singular instances
      try { editor.unregisterPlugin('tokenHighlight'); } catch(e){}
      editor.registerPlugin(tokenHighlightPlugin);
    }
    return () => {
      if (editor && !editor.isDestroyed) {
        try { editor.unregisterPlugin('tokenHighlight'); } catch(e){}
      }
    };
  }, [editor, tokenHighlightPlugin]);

  useEffect(() => {
    if (activePopover === 'schedule' && datePickerRef.current) {
      (datePickerRef.current as any).showPicker?.();
      setActivePopover(null);
    }
  }, [activePopover]);

  const applyToken = useCallback((type: string, val: any) => {
    if (!editor || !menu) return;

    let tokenToInsert = '';
    if (type === 'date') {
      setStagedMeta((s) => ({ ...s, dueDate: val as string }));
    } else if (type === 'time') {
      setStagedMeta((s) => ({ ...s, dueTime: val as string }));
    } else if (type === 'new_user' || type === 'assignee') {
      const user = users.find((u: any) => u.id === val);
      if (currentUser?.role !== 'admin' && val !== currentUser?.id) return;
      tokenToInsert = `@${user ? user.name.split(' ')[0] : val}`;
      setStagedMeta((s) => ({ ...s, assigneeId: val }));
    } else if (type === 'new_tag' || type === 'tag') {
      if (type === 'new_tag') addTag(val as string);
      tokenToInsert = `#${val}`;
      setStagedMeta((s) => ({ ...s, tags: s.tags.includes(val) ? s.tags : [...s.tags, val] }));
    } else if (type === 'priority') {
      tokenToInsert = `!${val}`;
      setStagedMeta((s) => ({ ...s, priority: val }));
    } else if (type === 'reminder') {
      tokenToInsert = `+${val}`;
      setStagedMeta((s) => ({ ...s, reminder: val }));
    } else if (type === 'recurrence') {
      tokenToInsert = `*${val}`;
      setStagedMeta((s) => ({ ...s, recurrence: val }));
    }

    // Replace the trigger word in-place using Tiptap commands, then insert trailing space
    // menu.startPos = character offset where trigger word starts
    const text = editor.getText();
    const triggerWordLength = text.length - menu.startPos;

    // +1 for ProseMirror doc offset (doc starts at pos 1)
    const from = menu.startPos + 1;
    const to = from + triggerWordLength;

    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, tokenToInsert + ' ')
      .run();

    setTitle(editor.getText());
    setMenu(null);
  }, [editor, menu, users, currentUser, addTag]);

  // Focus trap / keyboard handler configuration safely avoiding race traps
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menu) {
          setMenu(null);
          e.stopPropagation();
        } else {
          handleClose();
        }
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    if (isOpen) document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, menu, handleClose]);

  const removeTag = (tag: string) => {
    setStagedMeta((s) => ({ ...s, tags: s.tags.filter((t) => t !== tag) }));
  };

  const handleClearDraft = () => {
    clearModalDraft();
    setTitle('');
    setDesc('');
    setStagedMeta({
      assigneeId: null,
      projectId: defaultProject,
      tags: [],
      priority: null,
      dueDate: defaultDueDate,
      dueTime: null,
      reminder: null,
      recurrence: null,
      myDay: defaultMyDay,
    });
    if (editor) editor.commands.clearContent();
  };

  const handleSave = () => {
    const fullText = editor?.getText() || '';
    if (!fullText.trim()) return;

    const [rawTitle, ...descLines] = fullText.split('\n');
    let cleanedTitle = rawTitle.trim();
    const description = descLines.join('\n').trim();
    
    const tokensToRemove: string[] = [];
    if (stagedMeta.assigneeId) {
      const user = users.find((u: any) => u.id === stagedMeta.assigneeId);
      tokensToRemove.push(`@${user ? user.name.split(' ')[0] : stagedMeta.assigneeId}`);
    }
    if (stagedMeta.projectId) {
      tokensToRemove.push(`^${stagedMeta.projectId}`);
    }
    stagedMeta.tags.forEach(t => tokensToRemove.push(`#${t}`));
    if (stagedMeta.priority) {
      tokensToRemove.push(`!${stagedMeta.priority}`);
    }
    if (stagedMeta.reminder) {
      tokensToRemove.push(`+${stagedMeta.reminder}`);
    }
    if (stagedMeta.recurrence) {
      tokensToRemove.push(`*${stagedMeta.recurrence}`);
    }

    tokensToRemove.forEach(token => {
        cleanedTitle = cleanedTitle.replace(token, '').trim();
    });

    const finalAssigneeId = currentUser?.role === 'admin'
      ? stagedMeta.assigneeId
      : currentUser?.id ?? null;

    addTask({
      title: cleanedTitle,
      description: description,
      ...stagedMeta,
      assigneeId: finalAssigneeId,
      creatorId: currentUser?.id
    });
    handleClearDraft();
    onClose();
  };

  const activeWisdom = stagedMeta.tags
    .map((t) => WISDOM_QUOTES[t.toLowerCase()])
    .find((q) => q !== undefined);

  return {
    isOpen,
    isClosing,
    modalRef,
    popoverRef,
    datePickerRef,
    editor,
    EditorContent,
    title,
    desc,
    stagedMeta,
    menu,
    activePopover: activePopover as PopoverType,
    users,
    tags,
    projects,
    activeWisdom,
    isAdmin: currentUser?.role === 'admin',
    setDesc,
    setMenu,
    setActivePopover,
    processTextContent,
    applyToken,
    removeTag,
    handleClose,
    handleClearDraft,
    handleSave,
    trackUsedToken,
    setStagedMeta
  };
}