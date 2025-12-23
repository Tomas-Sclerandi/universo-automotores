import { Calendar, Pencil, Trash2, MessageSquare } from 'lucide-react'
import { type Task } from '../services/api'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'

interface TaskBoardProps {
    tasks: Task[]
    onEdit: (task: Task) => void
    onDelete: (id: number) => void
    onOpenComments: (task: Task) => void
    onStatusChange?: (taskId: number, newStatus: 'PENDIENTE' | 'EN_PROGRESO' | 'REVISION' | 'COMPLETADA') => void
    currentUserRole: 'ADMINISTRADOR' | 'EMPLEADO'
    showActions?: boolean
}

export const TaskBoard = ({ tasks, onEdit, onDelete, onOpenComments, onStatusChange, currentUserRole, showActions = true }: TaskBoardProps) => {

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'ALTA': return 'bg-red-100 text-red-700 border-red-200'
            case 'MEDIA': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'BAJA': return 'bg-emerald-50 text-emerald-800 border-emerald-200'
            default: return 'bg-gray-100 text-gray-600'
        }
    }

    const columns = [
        { id: 'PENDIENTE', title: 'Pendientes', color: 'border-l-4 border-l-blue-500' },
        { id: 'EN_PROGRESO', title: 'En Progreso', color: 'border-l-4 border-l-purple-500' },
        { id: 'REVISION', title: 'Revisión', color: 'border-l-4 border-l-amber-500' },
        { id: 'COMPLETADA', title: 'Completadas', color: 'border-l-4 border-l-emerald-600' }
    ]

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const newStatus = destination.droppableId as any
        if (onStatusChange) {
            onStatusChange(parseInt(draggableId), newStatus)
        }
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-[1000px] h-full pb-4">
                    {columns.map(col => (
                        <div key={col.id} className="flex-1 bg-gray-50/50 rounded-xl flex flex-col h-full max-h-full">
                            <div className={`p-4 bg-white rounded-t-xl shadow-sm border-b border-gray-100 ${col.color}`}>
                                <h3 className="font-bold text-gray-800 flex justify-between items-center text-sm uppercase tracking-wide">
                                    {col.title}
                                    <span className="bg-gray-100 text-xs px-2.5 py-0.5 rounded-full text-gray-600 font-medium">
                                        {tasks.filter(t => t.status === col.id).length}
                                    </span>
                                </h3>
                            </div>

                            <Droppable droppableId={col.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar min-h-[100px]"
                                    >
                                        {tasks
                                            .filter(t => t.status === col.id)
                                            .map((task, index) => (
                                                <Draggable
                                                    key={task.id}
                                                    draggableId={task.id.toString()}
                                                    index={index}
                                                    isDragDisabled={!onStatusChange}
                                                >
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group relative"
                                                            style={{
                                                                ...provided.draggableProps.style
                                                            }}
                                                        >

                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                                                    {task.priority}
                                                                </span>
                                                                {task.due_date && (
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                                                        <Calendar size={12} />
                                                                        {new Date(task.due_date).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="font-bold text-gray-800 mb-1 group-hover:text-[var(--color-accent-orange)] transition-colors pr-6 text-sm">{task.title}</h4>
                                                            <p className="text-gray-500 text-xs line-clamp-2 mb-3">{task.description}</p>

                                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                                                        {task.user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400 font-medium uppercase truncate max-w-[80px]">{task.sector?.name}</span>
                                                                </div>
                                                            </div>

                                                            <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-gray-100 rounded-lg p-0.5 z-10">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onOpenComments(task); }}
                                                                    className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                                                    title="Comentarios"
                                                                >
                                                                    <MessageSquare size={14} />
                                                                </button>
                                                                {showActions && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                                                            className="p-1 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded transition-colors"
                                                                            title="Editar"
                                                                        >
                                                                            <Pencil size={14} />
                                                                        </button>
                                                                        {currentUserRole === 'ADMINISTRADOR' && (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                                                                className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors"
                                                                                title="Eliminar"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </div>
        </DragDropContext>
    )
}
