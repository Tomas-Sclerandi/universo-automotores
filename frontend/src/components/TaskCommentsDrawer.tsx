import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageSquare } from 'lucide-react'
import { api, type Task, type Comment } from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TaskCommentsDrawerProps {
    isOpen: boolean
    onClose: () => void
    task: Task | null
    currentUser: any
}

export const TaskCommentsDrawer = ({ isOpen, onClose, task, currentUser }: TaskCommentsDrawerProps) => {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && task) {
            loadComments()
        }
    }, [isOpen, task])

    useEffect(() => {
        scrollToBottom()
    }, [comments])

    const loadComments = async () => {
        if (!task) return
        setLoading(true)
        try {
            const data = await api.getComments(task.id)
            setComments(data)
        } catch (error) {
            console.error("Error loading comments:", error)
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !task) return

        try {
            const comment = await api.createComment(newComment, task.id, currentUser.id)
            setComments(prev => [...prev, comment])
            setNewComment('')
        } catch (error) {
            console.error("Error creating comment:", error)
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white border-l border-gray-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col animate-slide-in">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare size={18} className="text-[var(--color-accent-orange)]" />
                            Comentarios
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[250px] font-medium">
                            {task?.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            <p>No hay comentarios aún.</p>
                            <p className="text-xs mt-2">Sé el primero en escribir algo.</p>
                        </div>
                    ) : (
                        comments.map(comment => {
                            const isMe = comment.user.id === currentUser.id
                            return (
                                <div
                                    key={comment.id}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${isMe
                                        ? 'bg-[var(--color-accent-orange)] text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}>
                                        {!isMe && (
                                            <p className="text-xs font-bold text-orange-500 mb-1">
                                                {comment.user.name}
                                            </p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                        <p className={`text-[10px] mt-1 ${isMe ? 'text-orange-100' : 'text-gray-400'} text-right`}>
                                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-[var(--color-accent-orange)] placeholder-gray-400 text-sm transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="p-3 bg-[var(--color-accent-orange)] hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
