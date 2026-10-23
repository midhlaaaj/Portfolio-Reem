'use client';

import { createContext, useContext, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import css from '../admin.module.css';

const MoveContext = createContext<(id: string, delta: number) => void>(() => {});

/**
 * Drag-to-reorder list. Pointer and touch drag via dnd-kit; focus a handle and press Up/Down to move the row,
 * as in the design.
 */
export function SortableList({
  ids,
  onReorder,
  disabled,
  children,
}: {
  ids: string[];
  onReorder: (next: string[]) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );
  const commit = (from: number, to: number) => {
    if (from < 0 || to < 0 || to >= ids.length || from === to) return;
    onReorder(arrayMove(ids, from, to));
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) commit(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };
  return (
    <MoveContext.Provider value={(id, delta) => commit(ids.indexOf(id), ids.indexOf(id) + delta)}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={disabled ? undefined : onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
          {children}
        </SortableContext>
      </DndContext>
    </MoveContext.Provider>
  );
}

/** Wraps one row. `children` receives the node props for the row and a ready-made handle button. */
export function SortableRow({
  id,
  handleLabel,
  disabled,
  className,
  children,
}: {
  id: string;
  handleLabel: string;
  disabled?: boolean;
  className?: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const move = useContext(MoveContext);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style: CSSProperties = { transform: CSS.Translate.toString(transform), transition };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(id, -1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(id, 1);
    }
  };
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className={css.handle}
      aria-label={handleLabel}
      disabled={disabled}
      {...attributes}
      aria-describedby={undefined}
      {...listeners}
      onKeyDown={onKeyDown}
    >
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style} className={`${className ?? ''} ${isDragging ? css.dragging : ''}`}>
      {children(handle)}
    </div>
  );
}
