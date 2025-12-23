import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Sector, type User, type Task } from '../services/api'
import { Users, CheckSquare, Plus, Pencil, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react'

export const Sectors = () => {
    const [sectors, setSectors] = useState<Sector[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [currentUserRole, setCurrentUserRole] = useState<'ADMINISTRADOR' | 'EMPLEADO'>('EMPLEADO')
    const navigate = useNavigate()

    // Modal & Form State
    const [showModal, setShowModal] = useState(false)
    const [editingSector, setEditingSector] = useState<Sector | null>(null)
    const [sectorName, setSectorName] = useState('')
    const [deleteModal, setDeleteModal] = useState<{ show: boolean, sectorId: number | null }>({ show: false, sectorId: null })

    // Notification State
    const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            const parsed = JSON.parse(storedUser)
            setCurrentUserRole(parsed.role)
        }

        Promise.all([api.getSectors(), api.getUsers(), api.getTasks()])
            .then(([sectorsData, usersData, tasksData]) => {
                setSectors(sectorsData)
                setUsers(usersData)
                setTasks(tasksData)
            })
            .catch(console.error)
    }, [])

    const handleEdit = (e: React.MouseEvent, sector: Sector) => {
        e.stopPropagation()
        setEditingSector(sector)
        setSectorName(sector.name)
        setShowModal(true)
    }

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        setDeleteModal({ show: true, sectorId: id })
    }

    const confirmDelete = async () => {
        if (!deleteModal.sectorId) return

        try {
            await api.deleteSector(deleteModal.sectorId)
            setSectors(prev => prev.filter(s => s.id !== deleteModal.sectorId))
            setNotification({ show: true, message: 'Sector eliminado correctamente', type: 'success' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } catch (error: any) {
            console.error(error)
            setNotification({ show: true, message: error.response?.data?.message || 'Error al eliminar sector', type: 'error' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000)
        } finally {
            setDeleteModal({ show: false, sectorId: null })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingSector) {
                const updatedSector = await api.updateSector(editingSector.id, sectorName)
                setSectors(prev => prev.map(s => s.id === editingSector.id ? updatedSector : s))
                setNotification({ show: true, message: 'Sector actualizado', type: 'success' })
            } else {
                const newSector = await api.createSector(sectorName)
                setSectors([...sectors, newSector])
                setNotification({ show: true, message: 'Sector creado', type: 'success' })
            }
            setShowModal(false)
            setEditingSector(null)
            setSectorName('')
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } catch (error) {
            console.error(error)
            setNotification({ show: true, message: 'Error al guardar sector', type: 'error' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        }
    }

    const openCreateModal = () => {
        setEditingSector(null)
        setSectorName('')
        setShowModal(true)
    }

    return (
        <div className="animate-fade-in relative">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Sectores</h2>
                    <p className="text-gray-500 mt-2">Visión general de los sectores.</p>
                </div>
                {currentUserRole === 'ADMINISTRADOR' && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Nuevo Sector
                    </button>
                )}
            </header>

            {/* Notification */}
            {notification.show && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-down ${notification.type === 'success'
                    ? 'bg-white border-green-200 text-green-600 shadow-green-100'
                    : 'bg-white border-red-200 text-red-600 shadow-red-100'
                    }`}>
                    <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{notification.type === 'success' ? '¡Éxito!' : 'Error'}</h4>
                        <p className="text-xs opacity-90">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar sector?</h3>
                            <p className="text-gray-500">Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteModal({ show: false, sectorId: null })}
                                className="px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-800">{editingSector ? 'Editar Sector' : 'Nuevo Sector'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-gray-600 text-sm font-semibold mb-2">Nombre del Sector</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none transition-all shadow-inner focus:ring-2 focus:ring-orange-100"
                                    value={sectorName}
                                    onChange={e => setSectorName(e.target.value)}
                                    placeholder="Ej: Recursos Humanos"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors font-medium bg-gray-50 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    {editingSector ? 'Guardar Cambios' : 'Crear Sector'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectors.map(sector => {
                    const sectorUsers = users.filter(u => u.sector?.id === sector.id)
                    const sectorTasks = tasks.filter(t => t.sector?.id === sector.id)
                    const pendingTasks = sectorTasks.filter(t => t.status !== 'COMPLETADA').length

                    return (
                        <div
                            key={sector.id}
                            onClick={() => navigate(`/sectors/${sector.id}`)}
                            className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-all cursor-pointer group relative transform hover:-translate-y-1"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-[var(--color-accent-orange)] transition-colors">
                                    {sector.name}
                                </h3>
                                {currentUserRole === 'ADMINISTRADOR' && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleEdit(e, sector)}
                                            className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded-lg transition-colors border border-gray-200"
                                            title="Editar"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, sector.id)}
                                            className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors border border-gray-200"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-500">
                                    <Users size={18} className="text-gray-400" />
                                    <span className="font-medium">{sectorUsers.length} Empleados</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500">
                                    <CheckSquare size={18} className="text-[var(--color-accent-gold)]" />
                                    <span className="font-medium">{pendingTasks} Tareas Pendientes</span>
                                </div>
                            </div>

                            <div className="mt-6 flex -space-x-2">
                                {sectorUsers.slice(0, 5).map(user => (
                                    <div key={user.id} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-blue-600 font-bold shadow-sm" title={user.name}>
                                        {user.name.charAt(0)}
                                    </div>
                                ))}
                                {sectorUsers.length > 5 && (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500 font-bold shadow-sm">
                                        +{sectorUsers.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
