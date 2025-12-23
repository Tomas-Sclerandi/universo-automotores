import { useEffect, useState, useCallback } from 'react'
import { api, type Task } from '../services/api'
import { Clock, PlayCircle, CheckCircle, Plus, Activity, ChevronLeft, ChevronRight, X, Users, Link as LinkIcon, MapPin, Calendar as CalendarIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts'

const locales = {
    'es': es,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})



const formatStatus = (status: string) => {
    switch (status) {
        case 'PENDIENTE': return 'Pendiente'
        case 'EN_PROGRESO': return 'En Progreso'
        case 'REVISION': return 'Revisión'
        case 'COMPLETADA': return 'Completada'
        default: return status
    }
}

// Custom List View Component
const CustomListView = ({ events, onSelectEvent }: any) => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
            {sortedEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No hay eventos próximos.</p>
            ) : (
                sortedEvents.map((event: any) => (
                    <div
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[var(--color-accent-orange)] transition-all cursor-pointer group flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-lg ${event.type === 'MEETING' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                            {event.type === 'MEETING' ? <Users size={24} /> : <CheckCircle size={24} />}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="text-lg font-bold text-gray-800 group-hover:text-[var(--color-accent-orange)] transition-colors">{event.title}</h4>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
                                    {format(event.start, "d MMM, HH:mm", { locale: es })}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 font-medium">
                                {event.type === 'MEETING' ? 'Reunión' : 'Tarea'} • {event.type === 'MEETING' ? `${event.attendees?.length || 0} asistentes` : formatStatus(event.status)}
                            </p>
                        </div>
                        <ChevronRight className="text-gray-400 group-hover:text-[var(--color-accent-orange)] transition-colors" />
                    </div>
                ))
            )}
        </div>
    )
}

export const Dashboard = () => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [meetings, setMeetings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date())
    const [view, setView] = useState<any>(Views.MONTH) // Changed type to allow custom 'list' view
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tasksData = await api.getTasks()
                setTasks(tasksData)
            } catch (error) {
                console.error("Error fetching tasks:", error)
            }

            try {
                const meetingsData = await api.getMeetings()
                setMeetings(meetingsData)
            } catch (error) {
                console.error("Error fetching meetings:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const onNavigate = useCallback((newDate: Date) => setDate(newDate), [setDate])
    const onView = useCallback((newView: any) => setView(newView), [setView])

    const pendingCount = tasks.filter(t => t.status === 'PENDIENTE').length
    const inProgressCount = tasks.filter(t => t.status === 'EN_PROGRESO').length
    const doneCount = tasks.filter(t => t.status === 'COMPLETADA').length

    // Calendar Events
    const taskEvents = tasks
        .filter(t => t.due_date)
        .map(t => ({
            id: t.id,
            title: t.title,
            start: new Date(t.due_date),
            end: new Date(t.due_date),
            priority: t.priority,
            status: t.status,
            type: 'TASK'
        }))

    const meetingEvents = meetings.map(m => ({
        id: m.id,
        title: m.title,
        start: new Date(m.date),
        end: new Date(new Date(m.date).getTime() + 60 * 60 * 1000), // 1 hour duration default
        type: 'MEETING',
        link: m.link,
        attendees: m.attendees
    }))

    const events = [...taskEvents, ...meetingEvents]

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3b82f6' // Blue default (Meeting)

        if (event.type === 'TASK') {
            if (event.priority === 'ALTA') backgroundColor = '#ef4444' // Red
            else if (event.status === 'COMPLETADA') backgroundColor = '#047857' // Green (Darker)
            else backgroundColor = '#f59e0b' // Yellow/Orange for others
        } else {
            backgroundColor = '#6366f1' // Indigo for Meetings
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        }
    }

    // Activity Feed (Recent Tasks)
    const recentTasks = [...tasks].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    }).slice(0, 5)

    return (
        <div className="animate-fade-in h-full flex flex-col relative">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    {/* Clean header, just title dark */}
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard</h2>
                    <p className="text-gray-500 mt-1">Visión general de tareas y eventos.</p>
                </div>
                {JSON.parse(localStorage.getItem('user') || '{}').role === 'ADMINISTRADOR' && (
                    <button
                        onClick={() => navigate('/tasks', { state: { openForm: true } })}
                        className="bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5 hover:shadow-orange-500/40"
                    >
                        <Plus size={20} />
                        Nueva Tarea
                    </button>
                )}
            </header>

            {/* Stats Cards - Creative Tim Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 mt-8">
                {/* Pending Card */}
                <div className="bg-white rounded-xl shadow-lg p-4 relative overflow-visible">
                    <div className="absolute -top-6 left-4 bg-gradient-to-br from-[var(--color-accent-orange)] to-orange-600 text-white p-4 rounded-xl shadow-xl shadow-orange-900/20">
                        <Clock size={24} />
                    </div>
                    <div className="text-right pt-2 pb-4 border-b border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">Pendientes</p>
                        <h3 className="text-3xl font-bold text-gray-800">{loading ? '-' : pendingCount}</h3>
                    </div>
                    <div className="pt-3">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="text-red-500 font-bold">-2%</span> que ayer
                        </p>
                    </div>
                </div>

                {/* In Progress Card */}
                <div className="bg-white rounded-xl shadow-lg p-4 relative overflow-visible">
                    <div className="absolute -top-6 left-4 bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4 rounded-xl shadow-xl shadow-blue-900/20">
                        <PlayCircle size={24} />
                    </div>
                    <div className="text-right pt-2 pb-4 border-b border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">En Progreso</p>
                        <h3 className="text-3xl font-bold text-gray-800">{loading ? '-' : inProgressCount}</h3>
                    </div>
                    <div className="pt-3">
                        <p className="text-xs text-gray-400">Actualizado hace instantes</p>
                    </div>
                </div>

                {/* Completed Card */}
                <div className="bg-white rounded-xl shadow-lg p-4 relative overflow-visible">
                    <div className="absolute -top-6 left-4 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-4 rounded-xl shadow-xl shadow-emerald-900/20">
                        <CheckCircle size={24} />
                    </div>
                    <div className="text-right pt-2 pb-4 border-b border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">Completadas</p>
                        <h3 className="text-3xl font-bold text-gray-800">{loading ? '-' : doneCount}</h3>
                    </div>
                    <div className="pt-3">
                        <p className="text-xs text-gray-400 text-right">+5% semana pasada</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 flex-1 min-h-0">

                {/* Charts Section (New Row) - Updated to 3 columns */}
                <div className="lg:col-span-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 mt-4">
                    {/* Status Distribution (Pie Chart) */}
                    <div className="bg-white rounded-xl shadow-lg p-6 pt-12 relative flex flex-col items-center justify-center min-h-[300px]">
                        <div className="absolute -top-6 bg-gradient-to-tr from-[#313131] to-[#4e4e4e] w-[90%] left-[5%] rounded-lg shadow-xl shadow-gray-900/30 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity size={18} />
                                Distribución
                            </h3>
                            <span className="text-xs text-gray-300">Estado</span>
                        </div>

                        <div className="w-full h-[200px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Pendientes', value: pendingCount, color: '#CB5529' },
                                            { name: 'En Progreso', value: inProgressCount, color: '#E3A957' },
                                            { name: 'Completadas', value: doneCount, color: '#10b981' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Pendientes', value: pendingCount, color: '#CB5529' },
                                            { name: 'En Progreso', value: inProgressCount, color: '#E3A957' },
                                            { name: 'Completadas', value: doneCount, color: '#047857' }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pending Tasks by Priority (Bar Chart) */}
                    <div className="bg-white rounded-xl shadow-lg p-6 pt-12 relative flex flex-col justify-center min-h-[300px]">
                        <div className="absolute -top-6 bg-gradient-to-tr from-[var(--color-accent-gold)] to-yellow-500 w-[90%] left-[5%] rounded-lg shadow-xl shadow-yellow-900/20 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Clock size={18} />
                                Prioridades
                            </h3>
                            <span className="text-xs text-white/80">Pendientes</span>
                        </div>

                        <div className="w-full h-[200px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: 'Alta', cantidad: tasks.filter(t => t.priority === 'ALTA' && t.status !== 'COMPLETADA').length, fill: '#ef4444' },
                                        { name: 'Media', cantidad: tasks.filter(t => t.priority === 'MEDIA' && t.status !== 'COMPLETADA').length, fill: '#E3A957' },
                                        { name: 'Baja', cantidad: tasks.filter(t => t.priority === 'BAJA' && t.status !== 'COMPLETADA').length, fill: '#047857' },
                                    ]}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                                        {[{ fill: '#ef4444' }, { fill: '#E3A957' }, { fill: '#047857' }].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Workload by Sector (New Chart) */}
                    <div className="bg-white rounded-xl shadow-lg p-6 pt-12 relative flex flex-col justify-center min-h-[300px]">
                        <div className="absolute -top-6 bg-gradient-to-tr from-indigo-500 to-indigo-700 w-[90%] left-[5%] rounded-lg shadow-xl shadow-indigo-900/20 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users size={18} />
                                Sectores
                            </h3>
                            <span className="text-xs text-white/80">Carga total</span>
                        </div>

                        <div className="w-full h-[200px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={Object.entries(tasks.reduce((acc, task) => {
                                        const name = task.sector?.name || 'S/Sector'
                                        acc[name] = (acc[name] || 0) + 1
                                        return acc
                                    }, {} as Record<string, number>)).map(([name, count]) => ({ name, cantidad: count }))}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={10} interval={0} />
                                    <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="cantidad" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Calendar Section (70%) */}
                {/* Calendar Section (70%) */}
                <div className="lg:col-span-7 bg-white rounded-xl shadow-lg p-6 flex flex-col mt-4 pt-8 relative">
                    <div className="absolute -top-6 bg-gradient-to-tr from-[#313131] to-[#4e4e4e] w-[95%] left-[2.5%] rounded-lg shadow-xl shadow-gray-900/30 p-4 flex items-center justify-between z-10">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <CalendarIcon size={18} /> {/* Using custom alias if needed or generic Calendar */}
                            Calendario
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={() => setView('month')} className={`text-xs px-2 py-1 rounded ${view === 'month' ? 'bg-white text-gray-800' : 'text-gray-300'}`}>Mes</button>
                            <button onClick={() => setView('list')} className={`text-xs px-2 py-1 rounded ${view === 'list' ? 'bg-white text-gray-800' : 'text-gray-300'}`}>Lista</button>
                        </div>
                    </div>

                    {/* Custom Toolbar inside the container */}
                    <div className="flex justify-between items-center mb-6 mt-6 p-2 rounded-lg">
                        <div className="flex items-center gap-4">
                            <button onClick={() => onNavigate(new Date(date.setMonth(date.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-2xl font-bold text-gray-700 capitalize min-w-[150px] text-center">
                                {format(date, 'MMMM yyyy', { locale: es })}
                            </span>
                            <button onClick={() => onNavigate(new Date(date.setMonth(date.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <button onClick={() => onNavigate(new Date())} className="px-4 py-2 text-sm bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white rounded-md shadow-md shadow-orange-500/30 transition-all transform hover:-translate-y-0.5">
                            Hoy
                        </button>
                    </div>

                    <div className="flex-1 min-h-[500px] text-gray-600 relative">
                        {view === 'list' ? (
                            <CustomListView events={events} onSelectEvent={setSelectedTask} />
                        ) : (
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                                culture='es'
                                eventPropGetter={eventStyleGetter}
                                toolbar={false} // Hide default toolbar since we have a custom one outside
                                messages={{
                                    noEventsInRange: "No hay eventos en este rango.",
                                    date: "Fecha",
                                    time: "Hora",
                                    event: "Evento",
                                    allDay: "Todo el día"
                                }}
                                onSelectEvent={(event) => setSelectedTask(event)}
                                date={date}
                                view={view}
                                onNavigate={onNavigate}
                                onView={onView}
                            />
                        )}
                    </div>
                </div>

                {/* Activity Feed Section (30%) */}
                <div className="lg:col-span-3 bg-white rounded-xl shadow-lg p-6 flex flex-col mt-4 pt-8 relative">
                    <div className="absolute -top-6 bg-gradient-to-tr from-purple-600 to-purple-400 w-[90%] left-[5%] rounded-lg shadow-xl shadow-purple-900/20 p-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity size={18} />
                            Actividad
                        </h3>
                    </div>

                    <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 mt-4">
                        {recentTasks.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No hay actividad reciente.</p>
                        ) : (
                            recentTasks.map(task => (
                                <div key={task.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-[var(--color-accent-orange)] transition-colors">{task.title}</span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Reciente'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Creada por <span className="font-semibold">{task.user?.name || 'Usuario'}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${task.priority === 'ALTA' ? 'bg-red-100 text-red-600' :
                                            task.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-emerald-100 text-emerald-800'
                                            }`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                                            {task.sector?.name}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTask(null)}>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xl max-w-md w-full mx-4 animate-scale-in relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedTask(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {selectedTask.type === 'TASK' ? (
                            <>
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${selectedTask.priority === 'ALTA' ? 'bg-red-50 text-red-600 border-red-200' :
                                            selectedTask.priority === 'MEDIA' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                            {selectedTask.priority}
                                        </span>
                                        <span className="text-xs text-gray-500">{formatStatus(selectedTask.status)}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedTask.title}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                        <Clock size={14} />
                                        <span>Vence: {format(selectedTask.end, 'dd/MM/yyyy', { locale: es })}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-6">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2">Descripción</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {tasks.find(t => t.id === selectedTask.id)?.description || 'Sin descripción.'}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            navigate('/tasks')
                                        }}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Ver en Tareas
                                    </button>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-bold"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-indigo-50 text-indigo-600 border-indigo-200">
                                            REUNIÓN
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedTask.title}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                        <Clock size={14} />
                                        <span>{format(selectedTask.start, 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                                    </div>
                                    {selectedTask.link && (
                                        <div className="flex items-center gap-2 text-blue-600 text-sm mb-4">
                                            {selectedTask.link.startsWith('http') ? (
                                                <a href={selectedTask.link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate flex items-center gap-2">
                                                    <LinkIcon size={14} />
                                                    Link de reunión
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    <span>{selectedTask.link}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-6">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2">Asistentes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTask.attendees?.map((a: any) => (
                                            <span key={a.id} className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-full shadow-sm">
                                                {a.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-bold"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Custom CSS for Calendar Dark Mode overrides */}
            <style>{`
                .rbc-calendar { color: #4b5563; }
                .rbc-toolbar button { color: #4b5563; border-color: #e5e7eb; }
                .rbc-toolbar button:hover { background-color: #f3f4f6; }
                .rbc-toolbar button.rbc-active { background-color: var(--color-accent-orange); color: white; border-color: var(--color-accent-orange); }
                .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: #e5e7eb; }
                .rbc-header { border-bottom-color: #e5e7eb;  background-color: #f9fafb; font-weight: 600; color: #374151; padding: 12px 0; }
                .rbc-day-bg + .rbc-day-bg { border-left-color: #e5e7eb; }
                .rbc-off-range-bg { background-color: #f3f4f6; }
                .rbc-today { background-color: #fff7ed; } /* Orange tint for today */
                .rbc-event { border-radius: 4px; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            `}</style>
        </div>
    )
}
