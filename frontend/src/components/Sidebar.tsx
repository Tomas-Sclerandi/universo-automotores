import { LayoutDashboard, Users, CheckSquare, LogOut, Briefcase, Calendar, Folder } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

export const Sidebar = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'))
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    useEffect(() => {
        const handleUserUpdate = () => {
            setUser(JSON.parse(localStorage.getItem('user') || '{}'))
        }

        window.addEventListener('user-updated', handleUserUpdate)
        return () => window.removeEventListener('user-updated', handleUserUpdate)
    }, [])

    const handleLogoutClick = () => {
        setShowLogoutModal(true)
    }

    const confirmLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
        setShowLogoutModal(false)
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: CheckSquare, label: 'Tareas', path: '/tasks' },
        { icon: Folder, label: 'Recursos', path: '/resources' },
        { icon: Users, label: 'Usuarios', path: '/users', role: 'ADMINISTRADOR' },
        { icon: Calendar, label: 'Reuniones', path: '/meetings' },
        { icon: Briefcase, label: 'Sectores', path: '/sectors', role: 'ADMINISTRADOR' },
        { icon: Briefcase, label: 'Mi Sector', path: '/sectors/my-sector', role: 'EMPLEADO' },
    ]

    return (
        <>
            <aside className="w-64 bg-[var(--color-sidebar-bg)] text-white flex flex-col h-screen shadow-2xl z-10 transition-colors duration-300">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-[var(--color-accent-orange)] flex items-center justify-center text-white text-lg">U</span>
                        Universo
                    </h1>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2 uppercase tracking-wider font-semibold">Gestión de Cuentas</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        if (item.role && item.role !== user.role) return null

                        const Icon = item.icon
                        const isActive = item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.path)

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-white text-[var(--color-sidebar-bg)] shadow-md translate-x-1 font-bold"
                                        : "text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent-orange)]"></div>}
                                <Icon size={20} className={clsx(isActive ? "text-[var(--color-accent-orange)]" : "text-current")} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 m-2 mt-0 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center text-white font-bold shadow-lg">
                            {user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                                {user.name || 'Usuario'}
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)] truncate">
                                {user.email || ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogoutClick}
                        className="flex items-center gap-2 px-3 py-2 w-full text-xs font-bold text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer uppercase tracking-wider"
                    >
                        <LogOut size={16} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-2xl max-w-sm w-full mx-4 animate-scale-in">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
                                <LogOut size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Cerrar sesión?</h3>
                            <p className="text-gray-500 text-sm">Tendrás que ingresar tus credenciales nuevamente.</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-md text-sm"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
