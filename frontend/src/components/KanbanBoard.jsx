import { useState, useEffect, useRef } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { id: 'pending',     label: 'Pending',     headerCls: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400' },
  { id: 'in-progress', label: 'In Progress', headerCls: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-400'   },
  { id: 'done',        label: 'Done',        headerCls: 'bg-green-50 border-green-200',   dot: 'bg-green-400'  },
];

const CARD_STYLES = {
  'pending':     'bg-yellow-50 border-yellow-200',
  'in-progress': 'bg-blue-50 border-blue-200',
  'done':        'bg-green-50 border-green-200',
};

const fmt = (dateStr) => dateStr
  ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : null;

const SortableCard = ({ task, onView, onEdit, onDelete }) => {
  const { user } = useAuth();
  const canDelete = user?.role === 'admin' || task.user_id === user?.id || task.assigned_to_user_id === user?.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? 'none' : undefined,
  };

  const isOverdue = task.deadline && task.status !== 'done' && new Date(task.deadline) < new Date();

  return (
    <div ref={setNodeRef} style={style}
      className={`border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing select-none ${CARD_STYLES[task.status] || 'bg-white border-gray-200'}`}
      {...attributes} {...listeners}
    >
      <p className="text-sm font-medium text-gray-800 break-words">{task.title}</p>
      {task.assignee_name && (
        <p className="text-xs text-indigo-500 mt-1.5">Assigned: {task.assignee_name}</p>
      )}
      <div className="mt-1.5 space-y-0.5">
        {task.created_at && (
          <p className="text-xs text-gray-400">Created: {fmt(task.created_at)}</p>
        )}
        {task.deadline && (
          <p className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
            {isOverdue ? '⚠ Overdue: ' : 'Due: '}{fmt(task.deadline)}
          </p>
        )}
      </div>
      <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-gray-200"
        onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => onView(task)} className="flex-1 text-xs text-gray-600 hover:text-indigo-600 transition-colors">View</button>
        <button onClick={() => onEdit(task)} className="flex-1 text-xs text-indigo-600 hover:underline">Edit</button>
        {canDelete && (
          <button onClick={() => onDelete(task)} className="flex-1 text-xs text-red-400 hover:underline">Delete</button>
        )}
      </div>
    </div>
  );
};

const MiniCard = ({ task }) => (
  <div className="bg-white border border-indigo-300 rounded-lg p-3 shadow-lg w-56 cursor-grabbing opacity-95">
    <p className="text-sm font-medium text-gray-800 line-clamp-2">{task.title}</p>
    {task.assignee_name && <p className="text-xs text-gray-400 mt-1">→ {task.assignee_name}</p>}
  </div>
);

const DroppableColumn = ({ column, ids, tasks, onView, onEdit, onDelete }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col min-w-0">
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-b-2 ${column.headerCls}`}>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${column.dot}`} />
        <span className="text-sm font-semibold text-gray-700">{column.label}</span>
        <span className="ml-auto text-xs bg-white border border-gray-200 text-gray-500 font-medium px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div ref={setNodeRef}
        className={`flex-1 min-h-[200px] p-2 rounded-b-xl border border-t-0 border-gray-200 space-y-2 transition-colors ${isOver ? 'bg-indigo-50/60' : 'bg-gray-50'}`}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className={`h-16 flex items-center justify-center text-xs text-gray-400 border-2 border-dashed rounded-lg transition-colors ${isOver ? 'border-indigo-300 text-indigo-400' : 'border-gray-200'}`}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanBoard = ({ tasks, onView, onEdit, onDelete, onStatusChange, onReorder }) => {
  const [items, setItems] = useState({});
  const [activeTask, setActiveTask] = useState(null);
  const dragOriginCol = useRef(null);

  useEffect(() => {
    const map = {};
    COLUMNS.forEach((col) => {
      map[col.id] = tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id)
        .map((t) => String(t.id));
    });
    setItems(map);
  }, [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const findContainer = (id) => {
    const sid = String(id);
    if (items[sid]) return sid; // id is a column id
    for (const [col, ids] of Object.entries(items)) {
      if (ids.includes(sid)) return col;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => String(t.id) === String(active.id));
    setActiveTask(task || null);
    dragOriginCol.current = findContainer(active.id);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeCol = findContainer(active.id);
    const overCol   = findContainer(over.id);
    if (!activeCol || !overCol || activeCol === overCol) return;

    setItems((prev) => {
      const activeIds = prev[activeCol];
      const overIds   = prev[overCol];
      const activeIdx = activeIds.indexOf(String(active.id));
      const overIdx   = overIds.indexOf(String(over.id));
      const insertAt  = overIdx >= 0 ? overIdx : overIds.length;

      return {
        ...prev,
        [activeCol]: activeIds.filter((id) => id !== String(active.id)),
        [overCol]:   [
          ...overIds.slice(0, insertAt),
          String(active.id),
          ...overIds.slice(insertAt),
        ],
      };
    });
  };

  const handleDragEnd = ({ active, over }) => {
    const originCol = dragOriginCol.current;
    dragOriginCol.current = null;
    setActiveTask(null);

    if (!originCol || !over) return;

    const overCol = findContainer(over.id);
    if (!overCol) return;

    if (originCol === overCol) {
      // Within same column — reorder
      const colIds    = items[originCol];
      const activeIdx = colIds.indexOf(String(active.id));
      const overIdx   = colIds.indexOf(String(over.id));
      if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
        const newOrder = arrayMove(colIds, activeIdx, overIdx);
        setItems((prev) => ({ ...prev, [originCol]: newOrder }));

        if (onReorder) {
          // Redistribute the column's existing sort_orders to the new order
          const colTasks = colIds
            .map((id) => tasks.find((t) => String(t.id) === id))
            .filter(Boolean);
          const sortedOrders = colTasks
            .map((t) => t.sort_order || 0)
            .sort((a, b) => a - b);
          onReorder(newOrder.map((id, idx) => ({ id: Number(id), sort_order: sortedOrders[idx] })));
        }
      }
    } else {
      // Cross-column — status change (card already moved visually by handleDragOver)
      const task = tasks.find((t) => String(t.id) === String(active.id));
      if (task) onStatusChange(task.id, overCol);
    }
  };

  const getColTasks = (colId) =>
    (items[colId] || []).map((id) => tasks.find((t) => String(t.id) === id)).filter(Boolean);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <DroppableColumn key={col.id} column={col}
            ids={items[col.id] || []}
            tasks={getColTasks(col.id)}
            onView={onView} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask && <MiniCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
