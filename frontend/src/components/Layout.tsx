import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export const Layout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-[var(--color-primary-bg)] text-gray-800 font-sans transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
