import { useState, useEffect } from 'react'
import { api, type Resource } from '../services/api'
import { Plus, Folder, FileText, FileSpreadsheet, Link, Trash2, Edit2, ExternalLink, Lock, Globe } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export const Resources = () => {
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingResource, setEditingResource] = useState<Resource | null>(null)
    const [currentUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'))

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ show: boolean, resourceId: number | null }>({ show: false, resourceId: null })

    const { showToast } = useToast()

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        url: '',
        type: 'OTHER',
        visibility: 'PUBLIC'
    })

    const fetchResources = async () => {
        try {
            const data = await api.getResources()
            setResources(data)
        } catch (error) {
            console.error(error)
            showToast('Error al cargar recursos', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchResources()
    }, [])

    const handleOpenModal = (resource?: Resource) => {
        if (resource) {
            setEditingResource(resource)
            setFormData({
                title: resource.title,
                description: resource.description || '',
                url: resource.url,
                type: resource.type,
                visibility: resource.visibility
            })
        } else {
            setEditingResource(null)
            setFormData({ title: '', description: '', url: '', type: 'OTHER', visibility: 'PUBLIC' })
        }
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingResource) {
                await api.updateResource(editingResource.id, formData as any)
                showToast('Recurso actualizado', 'success')
            } else {
                await api.createResource(formData as any)
                showToast('Recurso creado', 'success')
            }
            setShowModal(false)
            fetchResources()
        } catch (error) {
            console.error(error)
            showToast('Error al guardar', 'error')
        }
    }

    const confirmDelete = (id: number) => {
        setDeleteModal({ show: true, resourceId: id })
    }

    const handleDelete = async () => {
        if (!deleteModal.resourceId) return
        try {
            await api.deleteResource(deleteModal.resourceId)
            setResources(prev => prev.filter(r => r.id !== deleteModal.resourceId))
            showToast('Recurso eliminado', 'success')
        } catch (error) {
            console.error(error)
            showToast('Error al eliminar', 'error')
        } finally {
            setDeleteModal({ show: false, resourceId: null })
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'FOLDER': return <Folder size={32} className="text-blue-500" />
            case 'DOCUMENT': return <FileText size={32} className="text-blue-400" />
            case 'SPREADSHEET': return <FileSpreadsheet size={32} className="text-green-500" />
            default: return <Link size={32} className="text-gray-400" />
        }
    }

    return (
        <div className="animate-fade-in h-full flex flex-col relative">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Recursos</h2>
                    <p className="text-gray-500 mt-1">Enlaces y documentación compartida.</p>
                </div>
                {currentUser.role === 'ADMINISTRADOR' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Nuevo Recurso
                    </button>
                )}
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : resources.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Folder size={64} className="mb-4 opacity-50" />
                    <p>No hay recursos disponibles.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {resources.map(resource => (
                        <div key={resource.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 p-5 group flex flex-col relative">
                            {/* Card Content (Clickable) */}
                            <a
                                href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex flex-col gap-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                        {getIcon(resource.type)}
                                    </div>
                                    <div className="flex gap-2">
                                        {resource.visibility === 'ADMIN_ONLY' && (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1">
                                                <Lock size={10} /> Admin
                                            </span>
                                        )}
                                        <ExternalLink size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {resource.title}
                                    </h3>
                                    {resource.description && (
                                        <p className="text-gray-500 text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                                            {resource.description}
                                        </p>
                                    )}
                                </div>
                            </a>

                            {/* Admin Controls */}
                            {currentUser.role === 'ADMINISTRADOR' && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(resource); }}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); confirmDelete(resource.id); }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar recurso?</h3>
                            <p className="text-gray-500">Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteModal({ show: false, resourceId: null })}
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

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}>
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">
                            {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej: Carpeta de Ventas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">URL (Link)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción (Opcional)</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-20"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="FOLDER">Carpeta</option>
                                        <option value="DOCUMENT">Documento</option>
                                        <option value="SPREADSHEET">Excel/Sheet</option>
                                        <option value="OTHER">Otro Link</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Visibilidad</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.visibility}
                                        onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                    >
                                        <option value="PUBLIC">Público</option>
                                        <option value="ADMIN_ONLY">Solo Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold shadow-lg shadow-blue-500/30"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
