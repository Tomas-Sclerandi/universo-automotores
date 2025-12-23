import { useState, useEffect } from 'react'
import { api, type Meeting, type User, type Sector } from '../services/api'
import { Calendar, Clock, MapPin, Link as LinkIcon, Plus, X, Users, Check, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '../context/ToastContext'

export const Meetings = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [sectors, setSectors] = useState<Sector[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
    const [currentUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'))
    const { showToast } = useToast()

    // Confirmation Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [meetingToDelete, setMeetingToDelete] = useState<number | null>(null)

    // Form State
    const [title, setTitle] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [link, setLink] = useState('')
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchData = async () => {
        try {
            const [meetingsData, usersData, sectorsData] = await Promise.all([
                api.getMeetings(),
                api.getUsers(),
                api.getSectors()
            ])
            setMeetings(meetingsData)
            setUsers(usersData)
            setSectors(sectorsData)
        } catch (error) {
            console.error("Error fetching data:", error)
            showToast('Error al cargar los datos', 'error')
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenModal = (meeting?: Meeting) => {
        if (meeting) {
            setEditingMeeting(meeting)
            setTitle(meeting.title)
            const meetingDate = new Date(meeting.date)
            setDate(format(meetingDate, 'yyyy-MM-dd'))
            setTime(format(meetingDate, 'HH:mm'))
            setLink(meeting.link || '')
            setSelectedAttendees(meeting.attendees.map(a => a.id.toString()))
        } else {
            setEditingMeeting(null)
            setTitle('')
            setDate('')
            setTime('')
            setLink('')
            setSelectedAttendees([])
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            const dateTime = new Date(`${date}T${time}`)
            const meetingData = {
                title,
                date: dateTime.toISOString(),
                link,
                creatorId: currentUser.id,
                attendeeIds: selectedAttendees.map(id => parseInt(id))
            }

            if (editingMeeting) {
                await api.updateMeeting(editingMeeting.id, meetingData)
                showToast('Reunión actualizada con éxito', 'success')
            } else {
                await api.createMeeting(meetingData)
                showToast('Reunión creada con éxito', 'success')
            }

            setIsModalOpen(false)
            fetchData()
        } catch (error) {
            console.error("Error saving meeting:", error)
            showToast('Error al guardar la reunión', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmDelete = (id: number) => {
        setMeetingToDelete(id)
        setIsConfirmOpen(true)
    }

    const handleDelete = async () => {
        if (meetingToDelete) {
            try {
                await api.deleteMeeting(meetingToDelete)
                showToast('Reunión eliminada con éxito', 'success')
                fetchData()
            } catch (error) {
                console.error("Error deleting meeting:", error)
                showToast('Error al eliminar la reunión', 'error')
            }
            setIsConfirmOpen(false)
            setMeetingToDelete(null)
        }
    }

    const toggleAttendee = (userId: string) => {
        setSelectedAttendees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const toggleSectorAttendees = (sectorId: number) => {
        const sectorUsers = users.filter(u => u.sector.id === sectorId).map(u => u.id)
        const allSelected = sectorUsers.every(id => selectedAttendees.includes(id))

        if (allSelected) {
            setSelectedAttendees(prev => prev.filter(id => !sectorUsers.includes(id)))
        } else {
            setSelectedAttendees(prev => [...new Set([...prev, ...sectorUsers])])
        }
    }

    return (
        <div className="h-full flex flex-col relative animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-wider mb-2">Reuniones</h2>
                    <p className="text-gray-500">Gestiona y visualiza tus próximas reuniones.</p>
                </div>
                {currentUser.role === 'ADMINISTRADOR' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Nueva Reunión
                    </button>
                )}
            </header>

            {meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Ninguna reunión programada</h3>
                    <p className="text-gray-500 max-w-sm">
                        Aquí verás las próximas reuniones de tu equipo. ¡Programa una nueva para empezar!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {meetings.map(meeting => (
                        // ... (rest of the map content stays same, just ensuring indentation)
                        <div key={meeting.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group relative overflow-visible transform hover:-translate-y-1">
                            {currentUser.role === 'ADMINISTRADOR' && (
                                <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(meeting); }}
                                        className="p-2 bg-white border border-gray-200 text-blue-500 hover:text-blue-700 rounded-lg shadow-md transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); confirmDelete(meeting.id); }}
                                        className="p-2 bg-white border border-gray-200 text-red-500 hover:text-red-700 rounded-lg shadow-md transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Calendar size={24} />
                                </div>
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 border border-gray-200">
                                    {format(new Date(meeting.date), 'd MMM', { locale: es })}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-2">{meeting.title}</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-gray-500/90 font-medium">
                                    <Clock size={16} />
                                    <span>{format(new Date(meeting.date), 'HH:mm')} hs</span>
                                </div>
                                {meeting.link && (
                                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                                        {meeting.link.startsWith('http') ? (
                                            <>
                                                <LinkIcon size={16} />
                                                <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                                                    Link de reunión
                                                </a>
                                            </>
                                        ) : (
                                            <>
                                                <MapPin size={16} className="text-gray-400" />
                                                <span className="text-gray-600 truncate">{meeting.link}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Users size={16} />
                                    <span>{meeting.attendees.length} asistentes</span>
                                </div>
                            </div>

                            <div className="flex -space-x-2 pt-4 border-t border-gray-50">
                                {meeting.attendees.slice(0, 5).map((attendee, i) => (
                                    <div key={i} className="relative z-10 inline-flex items-center justify-center h-9 w-9 rounded-full ring-2 ring-white bg-gray-100 text-xs text-gray-600 font-bold border border-gray-200 flex-shrink-0" title={attendee.name}>
                                        {attendee.name.charAt(0)}
                                    </div>
                                ))}
                                {meeting.attendees.length > 5 && (
                                    <div className="relative z-0 inline-flex items-center justify-center h-9 w-9 rounded-full ring-2 ring-white bg-gray-50 text-xs text-gray-500 font-medium flex-shrink-0 border border-gray-200">
                                        +{meeting.attendees.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar reunión?</h3>
                            <p className="text-gray-500">Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => { setIsConfirmOpen(false); setMeetingToDelete(null); }}
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in relative">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {editingMeeting ? 'Editar Reunión' : 'Nueva Reunión'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[var(--color-accent-orange)] focus:ring-2 focus:ring-orange-100 transition-all placeholder-gray-400"
                                    placeholder="Ej: Daily Meeting"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:border-[var(--color-accent-orange)]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hora</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:border-[var(--color-accent-orange)]"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Link o Lugar</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={link}
                                        onChange={e => setLink(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-800 focus:outline-none focus:border-[var(--color-accent-orange)] placeholder-gray-400"
                                        placeholder="https://meet.google.com/... o Sala 1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Asistentes</label>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                    {/* Sectors Quick Select */}
                                    <div className="mb-4 space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Por Sector</p>
                                        <div className="flex flex-wrap gap-2">
                                            {sectors.map(sector => (
                                                <button
                                                    key={sector.id}
                                                    type="button"
                                                    onClick={() => toggleSectorAttendees(sector.id)}
                                                    className="px-3 py-1 bg-white border border-gray-200 hover:border-gray-300 rounded-full text-xs text-gray-600 transition-colors shadow-sm"
                                                >
                                                    Todo {sector.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Individual Users */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Usuarios</p>
                                        {users.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => toggleAttendee(user.id)}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedAttendees.includes(user.id) ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-100 border border-transparent'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs shadow-sm">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.sector.name}</p>
                                                    </div>
                                                </div>
                                                {selectedAttendees.includes(user.id) && (
                                                    <Check size={16} className="text-[var(--color-accent-orange)]" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right font-medium">
                                    {selectedAttendees.length} seleccionados
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md shadow-orange-500/20 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Guardando...' : (editingMeeting ? 'Guardar Cambios' : 'Crear Reunión')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
