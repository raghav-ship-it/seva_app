'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import { useStore } from '@/store/useStore';
import { Priority, Recurrence } from '@/lib/types';
import { getLocalDateStr } from '@/lib/date';

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
  personal: {
    quote: 'A person who is not disturbed by the incessant flow of desires can alone achieve peace.',
    source: 'Bhagavad-gita 2.70',
  },
  shopping: {
    quote: 'He who is regulated in his habits of eating and sleeping can mitigate all pains.',
    source: 'Bhagavad-gita 6.17',
  },
  cleaning: {
    quote: 'The temple of the Lord should be kept clean and decorated. Cleanliness is next to godliness.',
    source: 'Nectar of Devotion',
  },
};

export interface QuickEntryControllerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDueDate?: string | null;
  defaultProject?: string | null;
}

type Popover =
  | 'schedule'
  | 'assignee'
  | 'priority'
  | 'tags'
  | 'project'
  | 'reminder'
  | 'recurrence'
  | null;

interface AutocompleteItem {
  label: string;
  val: any;
  icon: string;
  type?: string;
  color?: string;
  class?: string;
}

type DraftMeta = {
  assigneeId: string | null;
  projectId: string | null;
  tags: string[];
  priority: Priority;
  dueDate: string | null;
  dueTime: string | null;
  reminder: string | null;
  recurrence: Recurrence;
};

export function useQuickEntryController({
  isOpen,
  onClose,
  defaultDueDate = null,
  defaultProject = null,
}: QuickEntryControllerProps) {
  const {
    addTask,
    users,
    tags,
    projects,
    currentUser,
    trackUsedToken,
    modalDraft,
    saveModalDraft,
    clearModalDraft,
  } = useStore();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const [stagedMeta, setStagedMeta] = useState<DraftMeta>({
    assigneeId: null,
    projectId: null,
    tags: [],
    priority: 'p4',
    dueDate: null,
    dueTime: null,
    reminder: null,
    recurrence: null,
  });

  const [menu, setMenu] = useState<{ items: AutocompleteItem[]; type: string; index: number } | null>(null);
  const [activePopover, setActivePopover] = useState<Popover>(null);

  const [isClosing, setIsClosing] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  const tokenHighlightPlugin = useMemo(() => {
    return new Plugin({
      key: new PluginKey('token-dynamic-decorator'),
      props: {
        decorations(state) {
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              const text = node.text;
              const regex = /(@[\w-]+)|(#[\w-]+)|(\^[\w-]+)|(!p[1-4])|(\?[\w-]+)|(\+[\w-]+)|(\*[\w-]+)/g;
              let match: RegExpExecArray | null;
              while ((match = regex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length + match.index + pos - match.index; // keep original math safe
                decorations.push(
                  Decoration.inline(start, start + match[0].length, {
                    class:
                      'text-red-500 font-semibold bg-red-50/40 px-0.5 rounded pointer-events-none',
                    'data-testid': 'natural-language-match',
                    'data-highlighted-match': 'true',
                  }),
                );
              }
            }
          });
          return DecorationSet.create(state.doc, decorations);
        },
      },
    });
  }, []);





  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: { class: 'mb-0' },
        },
      }),
      Placeholder.configure({
        placeholder: 'e.g. Design app screen @Sarah #Marketing !p1',
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none before:h-0',
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'w-full text-lg font-normal outline-none border-none text-gray-800 Prosemirror-RichField min-h-[32px] whitespace-pre-wrap break-words',
      },
      handleKeyDown: (view, event) => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (event.key === ' ') return false;

        if (menu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setMenu((m) => (m ? { ...m, index: (m.index + 1) % m.items.length } : null));
            return true;
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setMenu((m) => (m ? { ...m, index: (m.index - 1 + m.items.length) % m.items.length } : null));
            return true;
          } else if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            const it = menu.items[menu.index];
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            applyToken(it.type || menu.type, it.val);
            return true;
          } else if (event.key === 'Escape') {
            setMenu(null);
            return true;
          }
        } else {
          if (event.key === 'Enter' && !event.ctrlKey) {
            event.preventDefault();
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            handleSave();
            return true;
          } else if (event.key === 'Enter' && event.ctrlKey) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            handleSave();
            return true;
          } else if (event.key === 'Escape') {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            handleClose();
            return true;
          }
        }
        return false;
      },
    },
  });

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
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
      project: stagedMeta.projectId,
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
      recurrence: null,
    });
  };

  // Core natural language parsing
  const processTextContent = (val: string) => {
    setTitle(val);

    if (!val) {
      setMenu(null);
      return;
    }

    const lastWord = val.split(' ').pop() || '';

    if (/^(@|#|\^|!p[1-4]|\+|\*)/.test(lastWord) && lastWord.length > 2) {
      setMenu(null);
      return;
    }

    const words = val.split(' ');

    if (lastWord.startsWith('@')) {
      const search = lastWord.slice(1).toLowerCase();
      const recents = useStore.getState().recentTokens?.assignees || [];
      const filtered = users.filter((u) => u.name.toLowerCase().includes(search));

      const sorted = [...filtered].sort((a, b) => {
        const aIdx = recents.indexOf(a.id);
        const bIdx = recents.indexOf(b.id);
        if (aIdx !== -1 && bIdx === -1) return -1;
        if (aIdx === -1 && bIdx !== -1) return 1;
        return aIdx - bIdx;
      });

      const items: AutocompleteItem[] = sorted.map((u) => ({
        label: u.name,
        val: u.id,
        icon: 'user',
      }));

      if (search && !filtered.find((u) => u.name.toLowerCase() === search)) {
        items.push({
          label: `Add User "${lastWord.slice(1)}"`,
          val: lastWord.slice(1),
          type: 'new_user',
          icon: 'plus-circle',
        });
      }

      setMenu({ items, type: 'assignee', index: 0 });
    } else if (lastWord.startsWith('#')) {
      const search = lastWord.slice(1).toLowerCase();
      const recents = useStore.getState().recentTokens?.tags || [];
      const filtered = tags.filter((t) => t.toLowerCase().includes(search));

      const sorted = [...filtered].sort((a, b) => {
        const aIdx = recents.indexOf(a);
        const bIdx = recents.indexOf(b);
        if (aIdx !== -1 && bIdx === -1) return -1;
        if (aIdx === -1 && bIdx !== -1) return 1;
        return aIdx - bIdx;
      });

      const items: AutocompleteItem[] = sorted.map((t) => ({
        label: t,
        val: t,
        icon: 'hashtag',
      }));

      if (search && !filtered.includes(lastWord.slice(1))) {
        items.push({
          label: `Create Tag "${lastWord.slice(1)}"`,
          val: lastWord.slice(1),
          type: 'new_tag',
          icon: 'plus-circle',
        });
      }

      setMenu({ items, type: 'tag', index: 0 });
    } else if (lastWord.startsWith('^')) {
      const search = lastWord.slice(1).toLowerCase();
      const recents = useStore.getState().recentTokens?.projects || [];
      const filtered = projects.filter((p) => p.toLowerCase().includes(search));

      const sorted = [...filtered].sort((a, b) => {
        const aIdx = recents.indexOf(a);
        const bIdx = recents.indexOf(b);
        if (aIdx !== -1 && bIdx === -1) return -1;
        if (aIdx === -1 && bIdx !== -1) return 1;
        return aIdx - bIdx;
      });

      const items: AutocompleteItem[] = sorted.map((p) => ({
        label: p,
        val: p,
        icon: 'circle text-[6px]',
      }));

      if (search && !filtered.includes(lastWord.slice(1))) {
        items.push({
          label: `Create Project "${lastWord.slice(1)}"`,
          val: lastWord.slice(1),
          type: 'new_project',
          icon: 'plus-circle',
        });
      }

      setMenu({ items, type: 'project', index: 0 });
    } else if (lastWord.startsWith('!')) {
      setMenu({
        items: [
          { label: 'Priority 1', val: 'p1', icon: 'flag', color: 'text-red-500' },
          { label: 'Priority 2', val: 'p2', icon: 'flag', color: 'text-orange-500' },
          { label: 'Priority 3', val: 'p3', icon: 'flag', color: 'text-blue-500' },
          { label: 'Priority 4', val: 'p4', icon: 'flag', color: 'text-gray-400' },
        ],
        type: 'priority',
        index: 0,
      });
    } else if (lastWord.startsWith('?')) {
      const updatedText = val.slice(0, -1);
      editor?.commands.setContent(updatedText);
      setTitle(updatedText);
      datePickerRef.current?.showPicker();
    } else if (lastWord.startsWith('+')) {
      setMenu({
        items: [
          { label: 'At due time', val: '0', icon: 'bell' },
          { label: '10m before', val: '10', icon: 'bell' },
          { label: '30m before', val: '30', icon: 'bell' },
          { label: '1h before', val: '60', icon: 'bell' },
        ],
        type: 'reminder',
        index: 0,
      });
    } else if (lastWord.startsWith('*')) {
      setMenu({
        items: [
          { label: 'Daily', val: 'daily', icon: 'redo' },
          { label: 'Weekly', val: 'weekly', icon: 'redo' },
          { label: 'Monthly', val: 'monthly', icon: 'redo' },
        ],
        type: 'recurrence',
        index: 0,
      });
    } else {
      setMenu(null);
    }
  };

  const applyTokenImpl = (type: string, val: any) => {
    if (!editor) return;

    const currentText = editor.getText().trimEnd();
    const words = currentText.split(' ');
    const lastWord = words.pop() || '';

    let tokenToInsert = '';

    if (type === 'new_user' || type === 'assignee') {
      const user = users.find((u) => u.id === val);
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

    const newText = [...words, tokenToInsert].join(' ') + ' ';

    editor.commands.setContent(newText);
    setTitle(newText);
    editor.commands.focus('end');
    setMenu(null);
  };

  // wire applyToken for editor keydown
  const applyTokenRef = useRef(applyTokenImpl);
  applyTokenRef.current = applyTokenImpl;

  const applyToken = (type: string, val: any) => applyTokenRef.current(type, val);

  // Tiptap token highlight plugin
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.registerPlugin(tokenHighlightPlugin);
    }
  }, [editor, tokenHighlightPlugin]);

  // init draft/default
  useEffect(() => {
    if (isOpen && editor) {
      if (modalDraft) {
        editor.commands.setContent(modalDraft.title);
        setTitle(modalDraft.title);
        setDesc(modalDraft.desc);
        setStagedMeta(modalDraft.stagedMeta);
      } else {
        const parsedDefaultDueDate =
          defaultDueDate && defaultDueDate.includes('T')
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
          recurrence: null,
        });
      }
      setTimeout(() => editor.commands.focus('end'), 80);
    }
  }, [isOpen, modalDraft, currentUser, defaultDueDate, defaultProject, projects, editor]);

  // persist draft
  useEffect(() => {
    if (isOpen && (title.trim() || desc.trim() || stagedMeta.tags.length > 0 || stagedMeta.dueDate)) {
      saveModalDraft({
        title,
        desc,
        stagedMeta,
      });
    }
  }, [title, desc, stagedMeta, isOpen, saveModalDraft]);

  // close popover click-out
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Escape + focus trap
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();

      if (e.key === 'Tab' && isOpen && modalRef.current) {
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

    if (isOpen) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const removeTag = (tag: string) => {
    setStagedMeta((s) => ({ ...s, tags: s.tags.filter((t) => t !== tag) }));
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

    setDesc,
    setActivePopover,
    setMenu,
    setTitle,
    setStagedMeta,

    processTextContent,
    applyToken,
    removeTag,
    handleClose,
    handleClearDraft,
    handleSave,
    activeWisdom,

    users,
    tags,
    projects,
    currentUser,

    trackUsedToken,
  };
}

