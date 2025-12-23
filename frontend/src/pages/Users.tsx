import { useEffect, useState } from 'react'
import { api, type User, type Sector } from '../services/api'
import { UserPlus, Mail, Briefcase, Pencil, Trash2, X, CheckSquare, AlertCircle, AlertTriangle } from 'lucide-react'

export const Users = () => {
    const [users, setUsers] = useState<User[]>([])
    const [sectors, setSectors] = useState<Sector[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    // Notification & Modal State
    const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
    const [deleteModal, setDeleteModal] = useState<{ show: boolean, userId: string | null }>({ show: false, userId: null })

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'EMPLEADO' as 'ADMINISTRADOR' | 'EMPLEADO',
        sectorId: 1
    })

    const [currentUserRole, setCurrentUserRole] = useState<'ADMINISTRADOR' | 'EMPLEADO'>('EMPLEADO')

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            const parsed = JSON.parse(storedUser)
            setCurrentUserRole(parsed.role)
        }

        Promise.all([api.getUsers(), api.getSectors()])
            .then(([usersData, sectorsData]) => {
                setUsers(usersData)
                setSectors(sectorsData)
                if (sectorsData.length > 0) {
                    setFormData(prev => ({ ...prev, sectorId: sectorsData[0].id }))
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't populate password
            role: user.role,
            sectorId: user.sector?.id || sectors[0]?.id || 1
        })
        setShowForm(true)
    }

    const confirmDelete = (id: string) => {
        setDeleteModal({ show: true, userId: id })
    }

    const handleDelete = async () => {
        if (!deleteModal.userId) return
        try {
            await api.deleteUser(deleteModal.userId)
            setUsers(prev => prev.filter(u => u.id !== deleteModal.userId))
            setNotification({ show: true, message: 'Usuario eliminado', type: 'success' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || 'Error al eliminar usuario'
            setNotification({ show: true, message: message, type: 'error' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } finally {
            setDeleteModal({ show: false, userId: null })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingUser) {
                // Update
                const updateData = { ...formData }
                if (!updateData.password) delete (updateData as any).password // Don't send empty password

                const updatedUser = await api.updateUser(editingUser.id, updateData)

                // Manually update local state to reflect changes immediately including sector
                const fullUpdatedUser = {
                    ...updatedUser,
                    sector: sectors.find(s => s.id === formData.sectorId) || updatedUser.sector
                }

                setUsers(prev => prev.map(u => u.id === editingUser.id ? fullUpdatedUser : u))

                // Check if we updated the current user
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
                if (currentUser.id === Number(editingUser.id)) {
                    const newUserData = { ...currentUser, ...fullUpdatedUser }
                    localStorage.setItem('user', JSON.stringify(newUserData))
                    window.dispatchEvent(new Event('user-updated'))
                }

                setNotification({ show: true, message: 'Usuario actualizado', type: 'success' })
            } else {
                // Create
                const newUser = await api.createUser(formData)
                // Ensure sector relation is present for display
                const fullNewUser = {
                    ...newUser,
                    sector: sectors.find(s => s.id === formData.sectorId) || newUser.sector
                }
                setUsers([...users, fullNewUser])
                setNotification({ show: true, message: 'Usuario creado con éxito', type: 'success' })
            }

            setShowForm(false)
            setEditingUser(null)
            setFormData({ ...formData, name: '', email: '', password: '' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        } catch (error) {
            console.error(error)
            setNotification({ show: true, message: 'Error al guardar usuario', type: 'error' })
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
        }
    }

    if (loading) return <div className="text-white p-8">Cargando usuarios...</div>

    return (
        <div className="animate-fade-in relative">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Usuarios</h2>
                    <p className="text-gray-500 mt-2">Gestión del equipo de trabajo.</p>
                </div>
                {currentUserRole === 'ADMINISTRADOR' && (
                    <button
                        onClick={() => {
                            setEditingUser(null)
                            setFormData(prev => ({ ...prev, name: '', email: '', password: '' }))
                            setShowForm(!showForm)
                        }}
                        className="flex items-center gap-2 bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5"
                    >
                        {showForm ? <X size={20} /> : <UserPlus size={20} />}
                        {showForm ? 'Cancelar' : 'Nuevo Usuario'}
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
                        {notification.type === 'success' ? <CheckSquare size={20} /> : <AlertCircle size={20} />}
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
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar usuario?</h3>
                            <p className="text-gray-500">Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteModal({ show: false, userId: null })}
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
                <div className="bg-white p-8 rounded-xl border border-gray-100 mb-8 animate-slide-down shadow-xl">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-600 text-sm font-semibold mb-2">Nombre</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none transition-all shadow-inner focus:ring-2 focus:ring-orange-100"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-sm font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none transition-all shadow-inner focus:ring-2 focus:ring-orange-100"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-sm font-semibold mb-2">Contraseña {editingUser && '(Dejar en blanco para mantener)'}</label>
                            <input
                                type="password"
                                className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none transition-all shadow-inner focus:ring-2 focus:ring-orange-100"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-sm font-semibold mb-2">Rol</label>
                            <select
                                className="w-full bg-white border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none shadow-sm cursor-pointer"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="EMPLEADO">Empleado</option>
                                <option value="ADMINISTRADOR">Administrador</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-600 text-sm font-semibold mb-2">Sector</label>
                            <select
                                className="w-full bg-white border border-gray-200 rounded p-3 text-gray-800 focus:border-[var(--color-accent-orange)] outline-none shadow-sm cursor-pointer"
                                value={formData.sectorId}
                                onChange={e => setFormData({ ...formData, sectorId: Number(e.target.value) })}
                            >
                                {sectors.map(sector => (
                                    <option key={sector.id} value={sector.id}>{sector.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-4 gap-3 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors font-medium bg-gray-50 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                {editingUser ? 'Guardar Cambios' : 'Guardar Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-all group relative transform hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-md">
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.role === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {user.role}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{user.name}</h3>
                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Mail size={16} className="text-gray-400" />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Briefcase size={16} className="text-gray-400" />
                                <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                    {user.sector?.name || 'Sin Sector'}
                                </span>
                            </div>
                        </div>

                        {/* Admin Actions */}
                        {currentUserRole === 'ADMINISTRADOR' && (
                            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded-lg transition-colors border border-gray-200"
                                    title="Editar"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => confirmDelete(user.id)}
                                    className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors border border-gray-200"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
