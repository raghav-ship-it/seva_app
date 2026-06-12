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
}

export function useQuickEntryController({
  isOpen,
  onClose,
  defaultDueDate = null,
  defaultProject = null,
}: UseQuickEntryControllerProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const [stagedMeta, setStagedMeta] = useState<{
    assigneeId: string | null;
    projectId: string | null;
    tags: string[];
    priority: Priority | null;
    dueDate: string | null;
    dueTime: string | null;
    reminder: string | null;
    recurrence: Recurrence;
  }>({
    assigneeId: null,
    projectId: defaultProject,
    tags: [],
    priority: null,
    dueDate: defaultDueDate || getLocalDateStr(),
    dueTime: null,
    reminder: null,
    recurrence: null,
  });

  const [menu, setMenu] = useState<{
    items: any[];
    type: string;
    index: number;
    startPos: number;
  } | null>(null);

  const isDraftLoadingRef = useRef(false);

  // Store Mock hooks
  const modalDraft = useStore((s: any) => s.modalDraft);
  const saveModalDraft = useStore((s: any) => s.saveModalDraft);
  const clearModalDraft = useStore((s: any) => s.clearModalDraft);
  const users = useStore((s: any) => s.users) || [];
  const tags = useStore((s: any) => s.tags) || [];
  const projects = useStore((s: any) => s.projects) || [];
  const trackUsedToken = useStore((s: any) => s.trackUsedToken);
  const addTask = useStore((s: any) => s.addTask);

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
    // ... rest of existing token logic

    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const filtered = users
        .filter((u: any) => u.name.toLowerCase().includes(query))
        .map((u: any) => ({ icon: 'user', label: u.name, val: u.id, type: 'assignee' }));
      
      const exactMatch = users.find((u: any) => u.name.toLowerCase() === query);
      if (exactMatch) setStagedMeta(s => ({ ...s, assigneeId: exactMatch.id }));
      
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
      
      if (tags.some((t: string) => t.toLowerCase() === query)) setStagedMeta(s => ({ ...s, tags: s.tags.includes(query) ? s.tags : [...s.tags, query] }));

      if (filtered.length) {
        setMenu({ items: filtered, type: 'tag', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    if (lastWord.startsWith('!')) {
      const query = lastWord.slice(1).toLowerCase();
      const priorities = ['p1', 'p2', 'p3', 'p4'] as Priority[];
      const filtered = priorities
        .filter(p => p.includes(query))
        .map(p => ({ icon: 'flag', label: p.toUpperCase(), val: p, type: 'priority' }));
      
      if (priorities.includes(query as Priority)) setStagedMeta(s => ({ ...s, priority: query as Priority }));

      if (filtered.length) {
        setMenu({ items: filtered, type: 'priority', index: 0, startPos: text.length - lastWord.length });
        return;
      }
    }

    if (lastWord.startsWith('^')) {
      const query = lastWord.slice(1).toLowerCase();
      const filtered = projects
        .filter((p: string) => p.toLowerCase().includes(query))
        .map((p: string) => ({ icon: 'folder', label: p, val: p, type: 'project' }));
      
      if (projects.some((p: string) => p.toLowerCase() === query)) setStagedMeta(s => ({ ...s, projectId: projects.find((p: string) => p.toLowerCase() === query) || null }));

      if (filtered.length) {
        setMenu({ items: filtered, type: 'project', index: 0, startPos: text.length - lastWord.length });
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
  }, [users, tags, projects]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'What needs to be done?',
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
              const regex = /([@#^!+*]\w+)/g;
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
                } else if (type === '^') {
                  isValid = projects.some((p: string) => p.toLowerCase() === value);
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
    if (type === 'new_user' || type === 'assignee') {
      const user = users.find((u: any) => u.id === val);
      tokenToInsert = `@${user ? user.name.split(' ')[0] : val}`;
      setStagedMeta((s) => ({ ...s, assigneeId: val }));
    } else if (type === 'new_tag' || type === 'tag') {
      tokenToInsert = `#${val}`;
      setStagedMeta((s) => ({
        ...s,
        tags: s.tags.includes(val) ? s.tags : [...s.tags, val],
      }));
    } else if (type === 'new_project' || type === 'project') {
      tokenToInsert = `^${val}`;
      setStagedMeta((s) => ({ ...s, projectId: val }));
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

    // Replace the current trigger word (the last word that created the menu)
    const text = editor.getText();
    const before = text.slice(0, Math.max(0, menu.startPos));
    const words = text.split(/\s+/);
    const lastWordLength = (words[words.length - 1] || '').length;
    const after = text.slice(menu.startPos + lastWordLength);

    const replaced = `${before}${tokenToInsert} ${after}`;

    editor.commands.setContent(replaced.trimEnd());
    setTitle(replaced.trimEnd());
    setMenu(null);
    editor.commands.focus('end');
  }, [editor, menu, users]);

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
    });
    if (editor) editor.commands.clearContent();
  };

  const handleSave = () => {
    if (!title.trim()) return;

    // Identify and remove tokens from the title
    let cleanedTitle = title;
    
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

    addTask({
      title: cleanedTitle,
      description: desc.trim(),
      ...stagedMeta,
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
    activePopover,
    users,
    tags,
    projects,
    activeWisdom,
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