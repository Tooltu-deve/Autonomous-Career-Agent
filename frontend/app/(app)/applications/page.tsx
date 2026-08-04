'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  useDroppable,
  useDndContext,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MOCK_PIPELINE } from '@/lib/mock/dashboard';
import type { PipelineData, PipelineItem } from '@/types/dashboard';

/* ─────────────────────────────────────────────────────────────────
   Column configuration
───────────────────────────────────────────────────────────────── */
const COL_META: Record<string, { label: string; dotCls: string; emptyMsg: string }> = {
  saved:        { label: 'Saved',       dotCls: 'appdot-saved',     emptyMsg: 'No saved positions' },
  applied:      { label: 'Applied',     dotCls: 'appdot-applied',   emptyMsg: 'Drag card here to mark as applied' },
  interviewing: { label: 'Interviewing',dotCls: 'appdot-interview', emptyMsg: 'No interviews scheduled' },
  offer:        { label: 'Offer',       dotCls: 'appdot-offer',     emptyMsg: 'No offers yet' },
  rejected:     { label: 'Rejected',    dotCls: 'appdot-rejected',  emptyMsg: 'No rejections yet' },
};

const COLS = ['saved', 'applied', 'interviewing', 'offer', 'rejected'] as const;
type ColId = typeof COLS[number];

/* ─────────────────────────────────────────────────────────────────
   ATS Score badge
───────────────────────────────────────────────────────────────── */
function AtsBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'appbadge-good' : score >= 65 ? 'appbadge-mid' : 'appbadge-bad';
  return <span className={`appbadge ${cls}`}>{score}%</span>;
}

/* ─────────────────────────────────────────────────────────────────
   Application Card (drag source)
───────────────────────────────────────────────────────────────── */
function AppCard({
  item,
  isOverlay,
  isRejected,
}: {
  item: PipelineItem;
  isOverlay?: boolean;
  isRejected?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { type: 'Card', item } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };
  if (isOverlay) {
    style.opacity = 1;
    style.transform = undefined;
    style.cursor = 'grabbing';
  }

  const letter = item.logoLetter ?? item.company[0].toUpperCase();
  const color  = item.logoColor  ?? '#9ca1a8';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`appcard${isRejected ? ' appcard--rejected' : ''}${isOverlay ? ' appcard--overlay' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Top row: logo + title */}
      <div className="appcard-top">
        <span className="appcard-logo" style={{ background: color }}>{letter}</span>
        <div className="appcard-info">
          <b className="appcard-role">{item.jobTitle}</b>
          <small className="appcard-company">
            {item.company}{item.location ? ` · ${item.location}` : ''}
          </small>
        </div>
      </div>

      {/* Mid row: ATS score + CV link */}
      <div className="appcard-mid">
        {item.atsScore !== undefined && <AtsBadge score={item.atsScore} />}
        {item.cvLabel && (
          <a className="appcard-cvlink" href="#">{item.cvLabel}</a>
        )}
      </div>

      {/* Footer: date + grip hint */}
      <div className="appcard-foot">
        <small className="appcard-date">{item.dateLabel ?? ''}</small>
        <span className="appcard-grip-hint" aria-hidden="true">&#xFE19;</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Kanban Column (drop target)
───────────────────────────────────────────────────────────────── */
function KanbanColumn({ colId, items }: { colId: ColId; items: PipelineItem[] }) {
  const meta = COL_META[colId];
  const { setNodeRef, isOver } = useDroppable({ id: colId, data: { type: 'Column', colId } });
  const { over } = useDndContext();
  const isOverContainer = isOver || (over ? items.some((i) => i.id === over.id) : false);

  return (
    <div ref={setNodeRef} className={`kancol${isOverContainer ? ' kancol--over' : ''}`}>
      {/* Column header */}
      <div className="kancol-head">
        <span className={`kancol-dot ${meta.dotCls}`} />
        <b className="kancol-label">{meta.label}</b>
        <span className="kancol-count">{items.length}</span>
      </div>

      {/* Cards */}
      <div className="kancol-stack">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && <div className="kancol-empty">{meta.emptyMsg}</div>}
          {items.map((item) => (
            <AppCard key={item.id} item={item} isRejected={colId === 'rejected'} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Summary Funnel Strip
───────────────────────────────────────────────────────────────── */
function SummaryStrip({ pipeline }: { pipeline: PipelineData }) {
  const total = COLS.reduce((s, k) => s + pipeline[k].length, 0);
  const applied =
    pipeline.applied.length +
    pipeline.interviewing.length +
    pipeline.offer.length +
    pipeline.rejected.length;
  const responded = pipeline.interviewing.length + pipeline.offer.length + pipeline.rejected.length;
  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;

  return (
    <section className="app-summary">
      <div className="app-stile">
        <span className="app-stile-n">{total}</span>
        <span className="app-stile-l">Total Targets</span>
      </div>
      <div className="app-stile">
        <span className="app-stile-n">{applied}</span>
        <span className="app-stile-l">Applied</span>
      </div>
      <div className="app-stile">
        <span className="app-stile-n app-stile-n--good">{responseRate}%</span>
        <span className="app-stile-l">Response Rate</span>
      </div>

      {/* Funnel bars */}
      <div className="app-funnel">
        <div className="app-fseg" style={{ flex: Math.max(applied, 1) }}>
          <div className="app-fbar app-fbar--blue" />
          <span className="app-fcap">Applied <b>{applied}</b></span>
        </div>
        <span className="app-farrow">›</span>
        <div className="app-fseg" style={{ flex: Math.max(pipeline.interviewing.length, 1) }}>
          <div className="app-fbar app-fbar--purple" />
          <span className="app-fcap">Interviewing <b>{pipeline.interviewing.length}</b></span>
        </div>
        <span className="app-farrow">›</span>
        <div className="app-fseg" style={{ flex: Math.max(pipeline.offer.length, 1) }}>
          <div className="app-fbar app-fbar--green" />
          <span className="app-fcap">Offer <b>{pipeline.offer.length}</b></span>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Applications Page
───────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [pipeline, setPipeline] = useState<PipelineData>(MOCK_PIPELINE);
  const [activeItem, setActiveItem] = useState<PipelineItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: UniqueIdentifier): ColId | undefined => {
    if (COLS.includes(id as ColId)) return id as ColId;
    return COLS.find((key) => pipeline[key].some((item) => item.id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Card') {
      setActiveItem(event.active.data.current.item);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId   = over.id;
    if (activeId === overId) return;
    const activeContainer = findContainer(activeId);
    const overContainer   = findContainer(overId);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setPipeline((prev) => {
      const activeItems = prev[activeContainer];
      const overItems   = prev[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === activeId);
      const overIndex   = overItems.findIndex((i)  => i.id === overId);
      let newIndex: number;
      if (COLS.includes(overId as ColId)) {
        newIndex = overItems.length;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        newIndex = overIndex >= 0 ? overIndex + (isBelowOverItem ? 1 : 0) : overItems.length;
      }
      return {
        ...prev,
        [activeContainer]: prev[activeContainer].filter((i) => i.id !== activeId),
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex),
        ],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;
    const activeId = active.id;
    const overId   = over.id;
    const activeContainer = findContainer(activeId);
    const overContainer   = findContainer(overId);
    if (!activeContainer || !overContainer || activeContainer !== overContainer) return;
    const activeIndex = pipeline[activeContainer].findIndex((i) => i.id === activeId);
    const overIndex   = pipeline[overContainer].findIndex((i)  => i.id === overId);
    if (activeIndex !== overIndex) {
      setPipeline((prev) => ({
        ...prev,
        [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
      }));
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.3' } } }),
  };

  return (
    <main className="apppage">
      {/* Page Header */}
      <div className="apppage-head">
        <div>
          <h1 className="apppage-h1">Applications</h1>
          <p className="apppage-sub">
            Track each position you are aiming for. Drag cards across columns to change status.
          </p>
        </div>
        <span className="apppage-hint">&#x2194; Drag & drop to change status</span>
      </div>

      {/* Summary Strip */}
      <SummaryStrip pipeline={pipeline} />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanboard">
          {COLS.map((colId) => (
            <KanbanColumn key={colId} colId={colId} items={pipeline[colId]} />
          ))}
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem ? <AppCard item={activeItem} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}
