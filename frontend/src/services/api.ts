import { axiosInstance } from './axiosInstance'
import { API_URL } from '../config'
export { API_URL }

export interface Sector {
    id: number
    name: string
}

export interface User {
    id: string
    name: string
    email: string
    role: 'ADMINISTRADOR' | 'EMPLEADO'
    sector: Sector
}

export interface Comment {
    id: number
    content: string
    created_at: string
    user: User
}

export interface Task {
    id: number
    title: string
    description: string
    priority: 'BAJA' | 'MEDIA' | 'ALTA'
    status: 'PENDIENTE' | 'EN_PROGRESO' | 'REVISION' | 'COMPLETADA'
    due_date: string
    drive_link?: string
    created_at: string
    sector: Sector
    user: User
    comments: Comment[]
}

export interface Meeting {
    id: number
    title: string
    date: string
    link?: string
    creator: User
    attendees: User[]
}

export interface Resource {
    id: number
    title: string
    description?: string
    url: string
    type: 'FOLDER' | 'DOCUMENT' | 'SPREADSHEET' | 'OTHER'
    visibility: 'PUBLIC' | 'ADMIN_ONLY'
    sector?: Sector
    created_at: string
}

export const api = {
    // Tasks
    getTasks: async (): Promise<Task[]> => {
        const response = await axiosInstance.get<Task[]>('/tasks')
        return response.data
    },

    createTask: async (task: Partial<Task> & { sectorId: number, userId: string }): Promise<Task> => {
        const response = await axiosInstance.post<{ task: Task }>('/tasks', task)
        return response.data.task
    },

    updateTask: async (id: number, task: Partial<Task> & { sectorId?: number, userId?: string }): Promise<Task> => {
        const response = await axiosInstance.put<{ results: Task }>(`/tasks/${id}`, task)
        return response.data.results
    },

    deleteTask: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/tasks/${id}`)
    },

    // Users
    getUsers: async (): Promise<User[]> => {
        const response = await axiosInstance.get<User[]>('/users')
        return response.data
    },

    createUser: async (user: Partial<User> & { sectorId: number }): Promise<User> => {
        const response = await axiosInstance.post<{ user: User }>('/users', user)
        return response.data.user
    },

    updateUser: async (id: string, user: Partial<User> & { sectorId?: number }): Promise<User> => {
        const response = await axiosInstance.put<{ user: User }>(`/users/${id}`, user)
        return response.data.user
    },

    deleteUser: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/users/${id}`)
    },

    // Auth
    login: async (email: string, password: string): Promise<{ token: string, user: User }> => {
        const response = await axiosInstance.post<{ token: string, user: User }>('/auth/login', { email, password })
        return response.data
    },

    // Sectors
    getSectors: async (): Promise<Sector[]> => {
        const response = await axiosInstance.get<Sector[]>('/sectors')
        return response.data
    },

    createSector: async (name: string): Promise<Sector> => {
        const response = await axiosInstance.post<{ sector: Sector }>('/sectors', { name })
        return response.data.sector
    },

    updateSector: async (id: number, name: string): Promise<Sector> => {
        const response = await axiosInstance.put<{ sector: Sector }>(`/sectors/${id}`, { name })
        return response.data.sector
    },

    deleteSector: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/sectors/${id}`)
    },

    // Meetings
    getMeetings: async (): Promise<Meeting[]> => {
        const response = await axiosInstance.get<Meeting[]>('/meetings')
        return response.data
    },

    createMeeting: async (meetingData: { title: string, date: string, link: string, creatorId: string | number, attendeeIds: (string | number)[] }) => {
        const response = await axiosInstance.post('/meetings', meetingData)
        return response.data
    },

    updateMeeting: async (id: number, meetingData: { title?: string, date?: string, link?: string, attendeeIds?: (string | number)[] }) => {
        const response = await axiosInstance.put(`/meetings/${id}`, meetingData)
        return response.data
    },

    deleteMeeting: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/meetings/${id}`)
    },

    // Comments
    getComments: async (taskId: number): Promise<Comment[]> => {
        const response = await axiosInstance.get<Comment[]>(`/tasks/${taskId}/comments`)
        return response.data
    },

    createComment: async (content: string, taskId: number, userId: number): Promise<Comment> => {
        const response = await axiosInstance.post<Comment>('/comments', { content, taskId, userId })
        return response.data
    },

    // Resources
    getResources: async (): Promise<Resource[]> => {
        const response = await axiosInstance.get<Resource[]>('/resources')
        return response.data
    },

    createResource: async (resource: Partial<Resource>): Promise<Resource> => {
        const response = await axiosInstance.post<{ resource: Resource }>('/resources', resource)
        return response.data.resource
    },

    updateResource: async (id: number, resource: Partial<Resource>): Promise<Resource> => {
        const response = await axiosInstance.put<{ resource: Resource }>(`/resources/${id}`, resource)
        return response.data.resource
    },

    deleteResource: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/resources/${id}`)
    }
}
