import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isSectionEmpty, SECTION_LABELS, SECTIONS } from '../generator/sections';
import { useBuilder } from '../store';
import type { PageKey, Section, SectionType } from '../types';
import { inputCls } from './fields';

const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent';

function SortableSection(props: { page: PageKey; section: Section; index: number; count: number }) {
  const { page, section, index, count } = props;
  const { setSectionVariant, removeSection, moveSection } = useBuilder.getState();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const label = SECTION_LABELS[section.type];
  const empty = useBuilder((s) => isSectionEmpty(section, s.info));
  const variants = Object.entries(SECTIONS[section.type]).map(([value, v]) => ({ value, label: v.label }));

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-slate-50 p-2 ${isDragging ? 'relative z-10 border-blue-500 shadow-lg' : 'border-slate-200'}`}
    >
      <div className="flex items-center gap-1">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className={`${iconBtn} cursor-grab touch-none active:cursor-grabbing`}
          aria-label={`Drag to reorder ${label}`}
          {...attributes}
          {...listeners}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="currentColor">
            {[2, 7, 12].flatMap((y) => [4, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />))}
          </svg>
        </button>
        <span className="flex-1 text-sm font-medium text-slate-800">
          {index + 1}. {label}
        </span>
        <button
          type="button"
          className={iconBtn}
          aria-label={`Move ${label} up`}
          disabled={index === 0}
          onClick={() => moveSection(page, index, index - 1)}
        >
          ↑
        </button>
        <button
          type="button"
          className={iconBtn}
          aria-label={`Move ${label} down`}
          disabled={index === count - 1}
          onClick={() => moveSection(page, index, index + 1)}
        >
          ↓
        </button>
        <button
          type="button"
          className={`${iconBtn} hover:text-red-700`}
          aria-label={`Remove ${label}`}
          onClick={() => removeSection(page, section.id)}
        >
          ✕
        </button>
      </div>
      {empty && (
        <p className="mt-1 pl-8 text-xs text-amber-800">
          Nothing to show yet: the preview uses sample content, and your theme leaves this out. Fill it in under 1. Info.
        </p>
      )}
      {variants.length > 1 && (
        <label className="mt-1 block pl-8 text-xs text-slate-600">
          <span className="sr-only">{label} design</span>
          <select
            className={`${inputCls} mt-0 py-1.5`}
            value={section.variant}
            onChange={(e) => setSectionVariant(page, section.id, e.target.value)}
          >
            {variants.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </li>
  );
}

/**
 * A page's sections: drag (or use the arrow buttons or keyboard) to reorder,
 * pick each one's design, remove it, or add a new one at the end.
 */
export function SectionList({ page }: { page: PageKey }) {
  const sections = useBuilder((s) => s.pages[page]);
  const { moveSection, addSection } = useBuilder.getState();
  const [toAdd, setToAdd] = useState<SectionType>('projects');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = sections.findIndex((s) => s.id === e.active.id);
    const to = sections.findIndex((s) => s.id === e.over!.id);
    moveSection(page, from, to);
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {sections.map((s, i) => (
              <SortableSection key={s.id} page={page} section={s} index={i} count={sections.length} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {sections.length === 0 && <p className="text-xs text-slate-500">This page is empty. Add a section below.</p>}
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Section to add</span>
          <select className={`${inputCls} mt-0`} value={toAdd} onChange={(e) => setToAdd(e.target.value as SectionType)}>
            {(Object.keys(SECTION_LABELS) as SectionType[]).map((t) => (
              <option key={t} value={t}>
                {SECTION_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => addSection(page, toAdd)}
          className="shrink-0 rounded-md border border-dashed border-slate-400 px-3 text-sm text-slate-700 hover:bg-slate-100"
        >
          + Add section
        </button>
      </div>
    </div>
  );
}
