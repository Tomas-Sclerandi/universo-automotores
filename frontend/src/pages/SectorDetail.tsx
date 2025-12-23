import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, type Task, type Sector, type User } from '../services/api'
import { TaskBoard } from '../components/TaskBoard'
import { TaskCommentsDrawer } from '../components/TaskCommentsDrawer'
import { Plus, X, AlertCircle, CheckSquare, AlertTriangle, ArrowLeft } from 'lucide-react'

export const SectorDetail = () => {
    const { id } = useParams()
    const [tasks, setTasks] = useState<Task[]>([])
    const [sector, setSector] = useState<Sector | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<'ADMINISTRADOR' | 'EMPLEADO'>('EMPLEADO')
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [deleteModal, setDeleteModal] = useState<{ show: boolean, taskId: number | null }>({ show: false, taskId: null })
    const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

    // Comments Drawer State
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIA' as 'BAJA' | 'MEDIA' | 'ALTA',
        status: 'PENDIENTE' as 'PENDIENTE' | 'EN_PROGRESO' | 'REVISION' | 'COMPLETADA',
        due_date: '',
        sectorId: 0,
        userId: ''
    })

    const fetchSectorData = async () => {
        try {
            setLoading(true)
            const [allTasks, allSectors, allUsers] = await Promise.all([
                api.getTasks(),
                api.getSectors(),
                api.getUsers()
            ])

            let targetSectorId = Number(id)

            // If route is "my-sector", find the user's sector
            if (window.location.pathname.includes('my-sector')) {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
                const userFull = allUsers.find(u => u.id === storedUser.id)
                if (userFull && userFull.sector) {
                    targetSectorId = userFull.sector.id
                }
            }

            const currentSector = allSectors.find(s => s.id === targetSectorId)
            setSector(currentSector || null)

            if (currentSector) {
                setTasks(allTasks.filter(t => t.sector.id === targetSectorId))
                setUsers(allUsers.filter(u => u.sector?.id === targetSectorId))
                setFormData(prev => ({ ...prev, sectorId: targetSectorId }))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            const parsed = JSON.parse(storedUser)
            setCurrentUser(parsed)
            setCurrentUserRole(parsed.role)
        }

        fetchSectorData()
    }, [id])

    const handleEdit = (task: Task) => {
        setEditingTask(task)
        setFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
            sectorId: task.sector.id,
            userId: String(task.user.id)
        })
        setShowForm(true)
    }

    const handleStatusChange = async (taskId: number, newStatus: 'PENDIENTE' | 'EN_PROGRESO' | 'REVISION' | 'COMPLETADA') => {
        try {
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            )
            setTasks(updatedTasks as Task[])

            await api.updateTask(taskId, { status: newStatus })
        } catch (error) {
            console.error('Error updating status:', error)
            setNotification({ show: true, message: 'Error al actualizar estado', type: 'error' })
            fetchSectorData() // Refresh to revert
        }
    }

    const handleOpenComments = (task: Task) => {
        setSelectedTaskForComments(task)
        setIsCommentsOpen(true)
    }

    const confirmDelete = (id: number) => {
        setDeleteModal({ show: true, taskId: id })
    }

    const handleDelete = async () => {
        if (!deleteModal.taskId) return
        try {
            await api.deleteTask(deleteModal.taskId)
            setTasks(prev => prev.filter(t => t.id !== deleteModal.taskId))
            setNotification({ show: true, message: 'Tarea eliminada', type: 'success' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } catch (error) {
            console.error(error)
            setNotification({ show: true, message: 'Error al eliminar', type: 'error' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } finally {
            setDeleteModal({ show: false, taskId: null })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingTask) {
                await api.updateTask(editingTask.id, formData)
                const updatedTask = {
                    ...editingTask,
                    ...formData,
                    sector: sector!,
                    user: users.find(u => u.id === formData.userId)
                }
                setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask as Task : t))
                setNotification({ show: true, message: 'Tarea actualizada', type: 'success' })
            } else {
                const newTaskResponse = await api.createTask(formData)
                const newTaskWithRelations = {
                    ...newTaskResponse,
                    sector: sector!,
                    user: users.find(u => u.id === formData.userId)
                }
                setTasks(prev => [...prev, newTaskWithRelations as any])
                setNotification({ show: true, message: 'Tarea creada correctamente', type: 'success' })
            }
            setShowForm(false)
            setEditingTask(null)
            setFormData(prev => ({ ...prev, title: '', description: '' }))
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } catch (error) {
            console.error(error)
            setNotification({ show: true, message: 'Error al guardar', type: 'error' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        }
    }

    if (loading) return <div className="text-white">Cargando...</div>
    if (!sector) return <div className="text-white">Sector no encontrado</div>

    return (
        <div className="animate-fade-in h-full flex flex-col relative">
            <header className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        {currentUserRole === 'ADMINISTRADOR' && !window.location.pathname.includes('my-sector') && (
                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span>Volver a Sectores</span>
                            </button>
                        )}
                        <h2 className="text-4xl font-bold text-gray-800 uppercase tracking-wider mb-2">{sector.name}</h2>
                        <p className="text-gray-500">Gestión de tareas del equipo.</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingTask(null)
                            setFormData(prev => ({ ...prev, title: '', description: '' }))
                            setShowForm(!showForm)
                        }}
                        className="flex items-center gap-2 bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5"
                    >
                        {showForm ? <X size={20} /> : <Plus size={20} />}
                        {showForm ? 'Cancelar' : 'Nueva Tarea'}
                    </button>
                </div>

                {/* Team Section */}
                <div className="mt-6 flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {users.map(user => (
                            <div key={user.id} className="relative group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white border-2 border-white shadow-sm">
                                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                                    {user.name} (Online)
                                </div>
                            </div>
                        ))}
                    </div>
                    <span className="text-gray-500 text-sm font-medium">{users.length} miembros</span>
                </div>
            </header>

            {/* Notification */}
            {notification.show && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-down ${notification.type === 'success'
                    ? 'bg-white border-green-200 text-green-600 shadow-green-100'
                    : 'bg-white border-red-200 text-red-600 shadow-red-100'
                    }`}>
                    <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {notification.type === 'success' ? <CheckSquare size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{notification.type === 'success' ? '¡Éxito!' : 'Error'}</h4>
                        <p className="text-xs opacity-90">{notification.message}</p>
                    </div>
                </div>
            )}

            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar tarea?</h3>
                            <p className="text-gray-500">Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteModal({ show: false, taskId: null })}
                                className="px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white p-8 rounded-xl border border-gray-100 mb-8 animate-slide-down relative shadow-xl">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <label className="block text-gray-600 text-sm font-semibold mb-2">Título</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none transition-all shadow-inner focus:ring-2 focus:ring-orange-100"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="Ej: Rediseñar Home"
                                />
                            </div>
                            <div className="h-full">
                                <label className="block text-gray-600 text-sm font-semibold mb-2">Descripción</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none h-32 resize-none transition-all shadow-inner focus:ring-2 focus:ring-orange-100"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    placeholder="Detalles de la tarea..."
                                />
                            </div>
                        </div>

                        {/* Right Column: Meta */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-600 text-sm font-semibold mb-2">Prioridad</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none shadow-sm cursor-pointer"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                >
                                    <option value="BAJA">Baja</option>
                                    <option value="MEDIA">Media</option>
                                    <option value="ALTA">Alta</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm font-semibold mb-2">Estado</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none shadow-sm cursor-pointer"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="EN_PROGRESO">En Progreso</option>
                                    <option value="REVISION">Revisión</option>
                                    <option value="COMPLETADA">Completada</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm font-semibold mb-2">Fecha Límite</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none shadow-sm"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm font-semibold mb-2">Asignar a</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none shadow-sm cursor-pointer"
                                    value={formData.userId}
                                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar Usuario</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex justify-end mt-4 gap-3 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors font-medium bg-gray-50 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <TaskBoard
                tasks={tasks}
                onEdit={handleEdit}
                onDelete={confirmDelete}
                onOpenComments={handleOpenComments}
                onStatusChange={handleStatusChange}
                currentUserRole={currentUserRole}
                showActions={true} // Employees can edit/delete in their own sector
            />
            <TaskCommentsDrawer
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                task={selectedTaskForComments}
                currentUser={currentUser}
            />
        </div>
    )
}
