'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { FlowOrderItem } from '@/lib/types/api';

interface FlowOrderQuestionProps {
  questionId: string;
  items: FlowOrderItem[];
  currentSequence?: string[];
  onChange: (sequence: string[]) => void;
  disabled?: boolean;
}

export function FlowOrderQuestion({
  questionId,
  items,
  currentSequence,
  onChange,
  disabled = false,
}: FlowOrderQuestionProps) {
  // Order items based on currentSequence if present, or initial items order
  const [orderedItems, setOrderedItems] = useState<FlowOrderItem[]>(() => {
    if (currentSequence && currentSequence.length === items.length) {
      const byId = new Map(items.map((it) => [it.id, it]));
      const mapped = currentSequence
        .map((id) => byId.get(id))
        .filter((it): it is FlowOrderItem => !!it);
      if (mapped.length === items.length) return mapped;
    }
    return [...items];
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync internal state if questionId or items change
  const lastQuestionIdRef = useRef(questionId);
  useEffect(() => {
    if (lastQuestionIdRef.current !== questionId) {
      lastQuestionIdRef.current = questionId;
      const initial =
        currentSequence && currentSequence.length === items.length
          ? currentSequence
              .map((id) => items.find((it) => it.id === id))
              .filter((it): it is FlowOrderItem => !!it)
          : [...items];
      setOrderedItems(initial);
      onChange(initial.map((it) => it.id));
    }
  }, [questionId, items, currentSequence, onChange]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    if (toIndex < 0 || toIndex >= orderedItems.length) return;

    const next = [...orderedItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setOrderedItems(next);
    onChange(next.map((it) => it.id));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or minimal ghost image helper
    if (e.dataTransfer.setData) {
      e.dataTransfer.setData('text/plain', String(index));
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disabled || draggedIndex === null) return;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (disabled || draggedIndex === null) return;
    moveItem(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Arrange steps in the correct chronological execution order:</span>
        <span className="font-medium text-foreground">
          {orderedItems.length} steps to order
        </span>
      </div>

      <div className="relative pl-6">
        {/* Vertical timeline connecting line */}
        <div
          className="absolute left-2.5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-primary/30 via-primary/60 to-primary/30 rounded-full"
          aria-hidden="true"
        />

        <div className="space-y-3">
          {orderedItems.map((item, index) => {
            const isDragging = draggedIndex === index;
            const isDragTarget =
              dragOverIndex === index && draggedIndex !== index;

            return (
              <div
                key={item.id}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-sm transition-all duration-200 select-none',
                  !disabled && 'cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md',
                  isDragging && 'opacity-40 scale-95 border-dashed border-primary',
                  isDragTarget &&
                    'border-primary bg-primary/5 translate-y-1 shadow-md',
                  disabled && 'opacity-80',
                )}
              >
                {/* Timeline node badge */}
                <div
                  className={cn(
                    'absolute -left-6 flex size-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-200 shadow-sm ring-4 ring-background',
                    isDragging
                      ? 'bg-primary text-primary-foreground scale-110'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground',
                  )}
                >
                  {index + 1}
                </div>

                {/* Drag Handle */}
                <div
                  className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                  aria-hidden="true"
                >
                  <GripVertical className="size-4" />
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {item.text}
                  </p>
                </div>

                {/* Accessible Up/Down Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={disabled || index === 0}
                    onClick={() => moveItem(index, index - 1)}
                    aria-label={`Move step ${index + 1} up`}
                    className="size-7 rounded hover:bg-muted/80"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={disabled || index === orderedItems.length - 1}
                    onClick={() => moveItem(index, index + 1)}
                    aria-label={`Move step ${index + 1} down`}
                    className="size-7 rounded hover:bg-muted/80"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
