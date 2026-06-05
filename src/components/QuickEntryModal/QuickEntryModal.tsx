'use client';

import { useQuickEntryController } from '@/components/quick-entry/useQuickEntryController';
import QuickEntryShell from '@/components/quick-entry/QuickEntryShell/QuickEntryShell';
import QuickEntryEditor from '@/components/quick-entry/QuickEntryEditor/QuickEntryEditor';
import QuickEntryMetaRow from '@/components/quick-entry/QuickEntryMetaRow/QuickEntryMetaRow';
import QuickEntryFooter from '@/components/quick-entry/QuickEntryFooter/QuickEntryFooter';

export interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDueDate?: string | null;
  defaultProject?: string | null; // Added coordinate prop
}

export default function QuickEntryModal({
  isOpen,
  onClose,
  defaultDueDate = null,
  defaultProject = null, // Set default
}: QuickEntryModalProps) {
  const controller = useQuickEntryController({
    isOpen,
    onClose,
    defaultDueDate,
    defaultProject,
  });

  return (
    <QuickEntryShell
      isOpen={controller.isOpen}
      isClosing={controller.isClosing}
      modalRef={controller.modalRef}
      onRequestClose={controller.handleClose} // Passed down to handle the expanding morph
    >
      <QuickEntryEditor
        editor={controller.editor}
        EditorContent={controller.EditorContent}
        title={controller.title}
        desc={controller.desc}
        setDesc={controller.setDesc}
        stagedMeta={controller.stagedMeta}
        users={controller.users}
        tags={controller.tags}
        projects={controller.projects}
        menu={controller.menu}
        activePopover={controller.activePopover}
        setActivePopover={controller.setActivePopover}
        setMenu={controller.setMenu}
        applyToken={controller.applyToken}
        processTextContent={controller.processTextContent}
        removeTag={controller.removeTag}
        popoverRef={controller.popoverRef}
        datePickerRef={controller.datePickerRef}
        setStagedMeta={controller.setStagedMeta}
      />

      <QuickEntryMetaRow
        stagedMeta={controller.stagedMeta}
        users={controller.users}
        projects={controller.projects}
        activePopover={controller.activePopover}
        setActivePopover={controller.setActivePopover}
        setStagedMeta={controller.setStagedMeta}
        removeTag={controller.removeTag}
        trackUsedToken={controller.trackUsedToken}
      />

      <QuickEntryFooter
        activePopover={controller.activePopover}
        setActivePopover={controller.setActivePopover}
        stagedMeta={controller.stagedMeta}
        setStagedMeta={controller.setStagedMeta}
        projects={controller.projects}
        trackUsedToken={controller.trackUsedToken}
        title={controller.title}
        desc={controller.desc}
        onClear={controller.handleClearDraft}
        onCancel={controller.handleClose}
        onSave={controller.handleSave}
      />
    </QuickEntryShell>
  );
}