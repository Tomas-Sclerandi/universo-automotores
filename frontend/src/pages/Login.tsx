import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Loader2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Basic Client Validation
        if (!email || !password) {
            showToast('Por favor completa todos los campos', 'error')
            setLoading(false)
            return
        }

        try {
            const { token, user } = await api.login(email, password)
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            showToast('¡Bienvenido de nuevo!', 'success')

            // Aesthetic delay for "logging in" animation
            setTimeout(() => {
                navigate('/')
            }, 1000)
        } catch (err) {
            setLoading(false)
            showToast('Email o contraseña incorrectos', 'error')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-200 text-gray-800 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-white/50 z-10 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Universo
                    </h1>
                    <p className="text-gray-500">Gestión de Cuentas</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-accent-orange)] focus:ring-2 focus:ring-orange-500/20 transition-all text-gray-800 placeholder-gray-400"
                            placeholder="tu@email.com"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-accent-orange)] focus:ring-2 focus:ring-orange-500/20 transition-all text-gray-800 placeholder-gray-400"
                            placeholder="••••••"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-[var(--color-accent-orange)] hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Iniciando sesión...
                            </>
                        ) : (
                            'Ingresar'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
