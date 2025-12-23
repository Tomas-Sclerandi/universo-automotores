import { useEffect, useState } from 'react'
import { api, type Task, type Sector } from '../services/api'
import { Plus, AlertCircle, CheckSquare, X, AlertTriangle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { TaskBoard } from '../components/TaskBoard'
import { TaskCommentsDrawer } from '../components/TaskCommentsDrawer'

export const Tasks = () => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [sectors, setSectors] = useState<Sector[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [currentUserRole, setCurrentUserRole] = useState<'ADMINISTRADOR' | 'EMPLEADO'>('EMPLEADO')
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    // Comments Drawer State
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null)

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ show: boolean, taskId: number | null }>({ show: false, taskId: null })

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIA' as 'BAJA' | 'MEDIA' | 'ALTA',
        status: 'PENDIENTE' as 'PENDIENTE' | 'EN_PROGRESO' | 'REVISION' | 'COMPLETADA',
        due_date: '',
        sectorId: 1,
        userId: ''
    })
    const [users, setUsers] = useState<any[]>([])
    const location = useLocation()

    // Filter State - MOVED TOP to avoid Hooks error
    const [searchTerm, setSearchTerm] = useState('')
    const [filterPriority, setFilterPriority] = useState<'TODAS' | 'ALTA' | 'MEDIA' | 'BAJA'>('TODAS')
    const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false)

    const fetchData = () => {
        Promise.all([api.getTasks(), api.getSectors(), api.getUsers()])
            .then(([tasksData, sectorsData, usersData]) => {
                setTasks(tasksData)
                setSectors(sectorsData)
                setUsers(usersData)
                // Only set initial sector if not already set or editing
                if (sectorsData.length > 0 && !formData.sectorId) {
                    setFormData(prev => ({ ...prev, sectorId: sectorsData[0].id }))
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            const parsed = JSON.parse(storedUser)
            setCurrentUser(parsed)
            setCurrentUserRole(parsed.role)
            setFormData(prev => ({ ...prev, userId: parsed.id }))
        }

        // Check for auto-open form
        if (location.state?.openForm) {
            setShowForm(true)
            window.history.replaceState({}, document.title)
        }

        fetchData()
    }, [location.state])

    const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

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
                // Update existing task
                await api.updateTask(editingTask.id, formData)

                // Manually update local state
                const updatedTask = {
                    ...editingTask,
                    ...formData,
                    sector: sectors.find(s => s.id === formData.sectorId),
                    user: users.find(u => u.id === Number(formData.userId))
                }

                setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask as Task : t))
                setNotification({ show: true, message: 'Tarea actualizada', type: 'success' })
            } else {
                // Create new task
                const newTaskResponse = await api.createTask(formData)

                const newTaskWithRelations = {
                    ...newTaskResponse,
                    sector: sectors.find(s => s.id === formData.sectorId),
                    user: users.find(u => u.id === Number(formData.userId))
                }

                setTasks(prev => [...prev, newTaskWithRelations as any])
                setNotification({ show: true, message: 'Tarea creada correctamente', type: 'success' })
            }

            setShowForm(false)
            setEditingTask(null)
            setFormData({ ...formData, title: '', description: '' }) // Reset basic fields but keep context
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } catch (error) {
            console.error(error)
            setNotification({ show: true, message: 'Error al guardar', type: 'error' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        }
    }

    if (loading) return <div className="text-white p-8">Cargando tareas...</div>

    // Derived State (Filtered Tasks)
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPriority = filterPriority === 'TODAS' || task.priority === filterPriority
        const matchesUser = !showOnlyMyTasks || (currentUser && task.user?.id === currentUser.id)

        return matchesSearch && matchesPriority && matchesUser
    })

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
            fetchData()
        }
    }

    return (
        <div className="h-full flex flex-col relative animate-fade-in">
            <header className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-800 tracking-wider mb-2">Tareas</h2>
                        <p className="text-gray-500">Gestiona y organiza el flujo de trabajo.</p>
                    </div>
                    {currentUserRole === 'ADMINISTRADOR' && (
                        <button
                            onClick={() => {
                                setEditingTask(null)
                                setFormData({ title: '', description: '', priority: 'MEDIA', status: 'PENDIENTE', due_date: '', sectorId: 0, userId: '' })
                                setShowForm(!showForm)
                            }}
                            className="flex items-center gap-2 bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5"
                        >
                            {showForm ? <X size={20} /> : <Plus size={20} />}
                            {showForm ? 'Cancelar' : 'Nueva Tarea'}
                        </button>
                    )}
                </div>

                {/* Filters Section */}
                {/* Filters Section */}
                <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between mt-4">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Buscar tareas..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <select
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none cursor-pointer"
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as any)}
                        >
                            <option value="TODAS">Todas las Prioridades</option>
                            <option value="ALTA">Alta Prioridad</option>
                            <option value="MEDIA">Media Prioridad</option>
                            <option value="BAJA">Baja Prioridad</option>
                        </select>

                        <button
                            onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
                            className={`px-4 py-2 rounded-lg border transition-colors whitespace-nowrap font-medium ${showOnlyMyTasks
                                ? 'bg-[var(--color-accent-orange)] border-[var(--color-accent-orange)] text-white shadow-md'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                                }`}
                        >
                            {showOnlyMyTasks ? 'Viendo Mis Tareas' : 'Ver Mis Tareas'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Custom Notification */}
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

            {/* Custom Delete Modal */}
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

            {showForm && (
                <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100 mb-8 animate-slide-down relative">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Content */}
                        <div className="lg:col-span-2 space-y-4">
                            <div>
                                <label className="block text-gray-500 text-sm font-semibold mb-1">Título</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none transition-all focus:ring-2 focus:ring-orange-100"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="Ej: Rediseñar Home"
                                />
                            </div>
                            <div className="h-full">
                                <label className="block text-gray-500 text-sm font-semibold mb-1">Descripción</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none h-32 resize-none transition-all focus:ring-2 focus:ring-orange-100"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    placeholder="Detalles de la tarea..."
                                />
                            </div>
                        </div>

                        {/* Right Column: Meta */}
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-gray-500 text-sm font-semibold mb-1">Prioridad</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                >
                                    <option value="BAJA">Baja</option>
                                    <option value="MEDIA">Media</option>
                                    <option value="ALTA">Alta</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-sm font-semibold mb-1">Estado</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none"
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
                                <label className="block text-gray-500 text-sm font-semibold mb-1">Fecha Límite</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-500 text-sm font-semibold mb-1">Asignar a Sector</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none"
                                    value={formData.sectorId}
                                    onChange={e => setFormData({ ...formData, sectorId: Number(e.target.value) })}
                                    required
                                >
                                    <option value={0}>Seleccionar Sector</option>
                                    {sectors.map(sector => (
                                        <option key={sector.id} value={sector.id}>{sector.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-sm font-semibold mb-1">Asignar a Usuario</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none"
                                    value={formData.userId}
                                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                                    required
                                    disabled={!formData.sectorId}
                                >
                                    <option value="">Seleccionar Usuario</option>
                                    {users
                                        .filter(u => u.sector?.id === formData.sectorId)
                                        .map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex justify-end mt-4 gap-3 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in mt-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <CheckSquare size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No hay tareas encontradas</h3>
                    <p className="text-gray-500 max-w-sm">
                        No hay tareas que coincidan con tus filtros o aún no se han creado tareas.
                    </p>
                </div>
            ) : (
                <TaskBoard
                    tasks={filteredTasks}
                    onEdit={handleEdit}
                    onDelete={confirmDelete}
                    onOpenComments={handleOpenComments}
                    onStatusChange={currentUserRole === 'ADMINISTRADOR' ? handleStatusChange : undefined}
                    currentUserRole={currentUserRole}
                    showActions={currentUserRole === 'ADMINISTRADOR'}
                />
            )}

            <TaskCommentsDrawer
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                task={selectedTaskForComments}
                currentUser={currentUser}
            />
        </div>
    )
}
