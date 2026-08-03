'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  TrendUpIcon,
  DocumentIcon,
  InboxIcon,
  CalendarIcon,
  WarningIcon,
  StarIcon,
  InfoIcon,
  PlusIcon,
  GripIcon,
} from '@/components/icons';
import { MOCK_STATS, MOCK_PIPELINE, MOCK_RECOMMENDATIONS } from '@/lib/mock/dashboard';
import type { PipelineData, PipelineItem, Recommendation } from '@/types/dashboard';
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

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
}

/* ─────────────────────────────────────────────────────────────────
   StatusPill
───────────────────────────────────────────────────────────────── */
const PILL_MAP: Record<string, { label: string; cls: string }> = {
  not_applied: { label: 'Not applied', cls: 'pillNeutral' },
  pending:     { label: 'Pending',  cls: 'pillPending' },
  under_review:{ label: 'Under review',  cls: 'pillReview' },
  scheduled:   { label: 'Scheduled', cls: 'pillScheduled' },
  final_round: { label: 'Final round', cls: 'pillScheduled' },
  offer:       { label: 'Offer!',    cls: 'pillOffer' },
  rejected:    { label: 'Rejected',   cls: 'pillRejected' },
};

function StatusPill({ status }: { status: string }) {
  const p = PILL_MAP[status] ?? { label: status, cls: 'pillNeutral' };
  return <span className={`pill ${p.cls}`}>{p.label}</span>;
}

/* ─────────────────────────────────────────────────────────────────
   MetricCard
───────────────────────────────────────────────────────────────── */
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  iconVariant: 'green' | 'blue' | 'purple' | 'yellow';
}

function MetricCard({ label, value, trend, icon, iconVariant }: MetricCardProps) {
  return (
    <div className={`metric-card`}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <div className={`metric-icon mi-${iconVariant}`}>{icon}</div>
      </div>
      <div>
        <span className="metric-value">{value}</span>
        {trend && <span className="metric-trend">{trend}</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PipelineJobCard (drag source)
───────────────────────────────────────────────────────────────── */
function PipelineJobCard({
  item,
  isOverlay,
}: {
  item: PipelineItem;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: 'Job', item } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  if (isOverlay) {
    style.opacity = 1;
    style.transform = undefined;
    style.cursor = 'grabbing';
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`pipe-job-card ${isOverlay ? 'pipe-job-card--overlay' : ''}`}
      {...attributes}
      {...listeners}
      title="Drag to move to another column or position"
    >
      <div className="pipe-grip" style={{ cursor: isOverlay ? 'grabbing' : 'grab' }}>
        <GripIcon />
      </div>
      <div className="pipe-job-body">
        <div className="pipe-job-role">{item.jobTitle}</div>
        <div className="pipe-job-company">
          {item.company}
          {item.location ? ` · ${item.location}` : ''}
        </div>
        <div className="pipe-job-meta">
          <StatusPill status={item.applicationStatus} />
          {item.interviewDate && (
            <span className="pipe-job-date">{formatDate(item.interviewDate)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PipelineColumn (drop target)
───────────────────────────────────────────────────────────────── */
const COL_META: Record<string, { label: string; dotCls: string }> = {
  saved:       { label: 'Saved',       dotCls: 'dot-saved' },
  applied:     { label: 'Applied',     dotCls: 'dot-applied' },
  interviewing:{ label: 'Interviewing',   dotCls: 'dot-interview' },
};


function PipelineColumn({
  colId,
  items,
}: {
  colId: string;
  items: PipelineItem[];
}) {
  const { label, dotCls } = COL_META[colId];
  const { setNodeRef, isOver } = useDroppable({
    id: colId,
    data: { type: 'Column', colId },
  });

  const { over } = useDndContext();
  const isOverContainer = isOver || (over ? items.some(i => i.id === over.id) : false);

  return (
    <div
      ref={setNodeRef}
      className={`pipe-col ${isOverContainer ? 'pipe-col--over' : ''}`}
    >
      <div className="pipe-col-head">
        <span className={`pipe-dot ${dotCls}`} />
        {label} ({items.length})
      </div>

      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.length === 0 && (
          <div className="pipe-empty">Drag card here</div>
        )}
        {items.map((item) => (
          <PipelineJobCard key={item.id} item={item} />
        ))}
      </SortableContext>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RecommendationItem
───────────────────────────────────────────────────────────────── */
function RecommendationItem({ rec }: { rec: Recommendation }) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  const Icon = rec.type === 'warning' ? WarningIcon
    : rec.type === 'action' ? StarIcon
    : InfoIcon;

  const iconCls = rec.type === 'warning' ? 'rec-icon warn'
    : rec.type === 'action' ? 'rec-icon act'
    : 'rec-icon info';

  return (
    <div className="rec-item">
      <div className={iconCls}>
        <Icon />
      </div>
      <div className="rec-text">
        <div className="rec-title">{rec.title}</div>
        <div
          className="rec-body"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: rec.body }}
        />
      </div>
      <div className="rec-actions">
        <button
          className="rec-action-btn"
          onClick={() => router.push(rec.actionHref)}
          type="button"
        >
          {rec.actionLabel}
        </button>
        <button
          className="rec-dismiss-btn"
          onClick={() => setDismissed(true)}
          title="Dismiss recommendation"
          aria-label="Dismiss recommendation"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   New Target Modal (mock)
───────────────────────────────────────────────────────────────── */
function NewTargetModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!value.trim()) return;
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">+ Add New Target</h3>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        {saved ? (
          <div className="modal-success">✅ Target saved! (mock — no API call)</div>
        ) : (
          <>
            <label className="modal-label">
              Role / Company Name
              <input
                className="modal-input"
                type="text"
                placeholder="e.g. Senior Backend Engineer at Shopee"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </label>
            <div className="modal-footer">
              <button className="btn-secondary-sm" onClick={onClose} type="button">Cancel</button>
              <button className="btn-primary-sm" onClick={handleSave} type="button">Save target</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Dashboard Page
───────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { session } = useAuth();
  const [pipeline, setPipeline] = useState<PipelineData>(MOCK_PIPELINE);
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState<PipelineItem | null>(null);

  const firstName = session?.firstName ?? 'there';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: UniqueIdentifier) => {
    if (id in pipeline) return id as keyof PipelineData;
    return (Object.keys(pipeline) as Array<keyof PipelineData>).find((key) =>
      pipeline[key].some((item) => item.id === id)
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Job') {
      setActiveItem(active.data.current.item);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) {
      setPipeline((prev) => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];
        const activeIndex = activeItems.findIndex((i) => i.id === activeId);
        const overIndex = overItems.findIndex((i) => i.id === overId);

        let newIndex;
        if (overId in prev) {
          newIndex = overItems.length + 1;
        } else {
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height;
          const modifier = isBelowOverItem ? 1 : 0;
          newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        return {
          ...prev,
          [activeContainer]: prev[activeContainer].filter((item) => item.id !== activeId),
          [overContainer]: [
            ...prev[overContainer].slice(0, newIndex),
            activeItems[activeIndex],
            ...prev[overContainer].slice(newIndex, prev[overContainer].length),
          ],
        };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      const activeIndex = pipeline[activeContainer].findIndex((i) => i.id === activeId);
      const overIndex = pipeline[overContainer].findIndex((i) => i.id === overId);

      if (activeIndex !== overIndex) {
        setPipeline((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
        }));
      }
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  };

  const totalApps =
    pipeline.saved.length + pipeline.applied.length + pipeline.interviewing.length;

  return (
    <main className="dash-main">
      {/* Page Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-h1">Welcome back, {firstName} 👋</h1>
          <p className="dash-subtitle">
            Track your career targets — here is today&apos;s overview.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          type="button"
          id="btn-new-target"
        >
          <PlusIcon /> New Target
        </button>
      </div>

      {/* Metrics */}
      <section className="metrics" aria-label="Metrics Overview">
        <MetricCard
          label="Avg ATS Score"
          value={`${MOCK_STATS.avgAtsScore}%`}
          trend={`↑ ${MOCK_STATS.atsTrend}%`}
          icon={<TrendUpIcon />}
          iconVariant="green"
        />
        <MetricCard
          label="Tailored CVs"
          value={MOCK_STATS.tailoredCvCount}
          icon={<DocumentIcon />}
          iconVariant="blue"
        />
        <MetricCard
          label="Applied"
          value={totalApps}
          icon={<InboxIcon />}
          iconVariant="purple"
        />
        <MetricCard
          label="Interviewing"
          value={pipeline.interviewing.length}
          icon={<CalendarIcon />}
          iconVariant="yellow"
        />
      </section>

      {/* Pipeline */}
      <section className="dash-section" aria-label="Application Pipeline">
        <div className="section-head">
          <h2 className="section-title">Active Application Pipeline</h2>
          <span className="section-badge">Drag & drop to move</span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="pipeline">
            {(['saved', 'applied', 'interviewing'] as const).map((colId) => (
              <PipelineColumn
                key={colId}
                colId={colId}
                items={pipeline[colId]}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem ? <PipelineJobCard item={activeItem} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </section>

      {/* AI Recommendations */}
      <section className="dash-section" aria-label="AI Recommendations">
        <div className="section-head">
          <h2 className="section-title">AI Agent Recommendations</h2>
          <span className="section-hint">Mock — backend not connected</span>
        </div>
        <div className="rec-panel">
          {MOCK_RECOMMENDATIONS.map((rec) => (
            <RecommendationItem key={rec.id} rec={rec} />
          ))}
        </div>
      </section>

      {/* New Target Modal */}
      {showModal && <NewTargetModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
