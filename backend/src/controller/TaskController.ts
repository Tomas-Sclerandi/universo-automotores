import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Task } from "../entity/Task"
import { validationResult } from "express-validator"

export class TaskController {

    // --- OBTENER TODAS LAS TAREAS ---
    static async getAll(req: Request, res: Response) {
        const taskRepository = AppDataSource.getRepository(Task)
        try {
            const tasks = await taskRepository.find({
                relations: ["sector", "user"]
            })
            return res.json(tasks)
        } catch (error) {
            return res.status(500).json({ message: "Error al buscar tareas", error })
        }
    }

    // --- OBTENER UNA TAREA ---
    static async getOne(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const taskRepository = AppDataSource.getRepository(Task)

        try {
            const task = await taskRepository.findOne({
                where: { id },
                relations: ["sector", "user"]
            })

            if (!task) return res.status(404).json({ message: "Tarea no encontrada" })
            return res.json(task)
        } catch (error) {
            return res.status(500).json({ message: "Error al buscar tarea", error })
        }
    }

    // --- CREAR TAREA ---
    static async createTask(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { title, description, priority, status, due_date, drive_link, sectorId, userId } = req.body
        const taskRepository = AppDataSource.getRepository(Task)

        // if (!title || !sectorId || !userId) { <-- Removed manual check in favor of validator
        //     return res.status(400).json({ message: "Faltan datos obligatorios (titulo, sector o usuario)" })
        // }

        try {
            const task = new Task()
            task.title = title
            task.description = description
            task.priority = priority
            task.status = status
            task.due_date = due_date
            task.drive_link = drive_link
            task.sector = { id: Number(sectorId) } as any
            task.user = { id: Number(userId) } as any

            await taskRepository.save(task)
            return res.status(201).json({ message: "Tarea creada correctamente", task })
        } catch (error) {
            return res.status(500).json({ message: "Error al guardar tarea", error })
        }
    }

    // --- EDITAR TAREA ---
    static async updateTask(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const id = parseInt(req.params.id)
        const { title, description, priority, status, due_date, drive_link, sectorId, userId } = req.body
        const taskRepository = AppDataSource.getRepository(Task)

        try {
            let task = await taskRepository.findOneBy({ id })
            if (!task) return res.status(404).json({ message: "Tarea no encontrada" })

            // Manually update fields
            task.title = title
            task.description = description
            task.priority = priority
            task.status = status
            task.due_date = due_date
            task.drive_link = drive_link

            if (sectorId) task.sector = { id: Number(sectorId) } as any
            if (userId) task.user = { id: Number(userId) } as any

            const results = await taskRepository.save(task)
            return res.json({ message: "Tarea actualizada", results })
        } catch (error) {
            return res.status(500).json({ message: "Error al actualizar", error })
        }
    }

    // --- ELIMINAR TAREA ---
    static async removeTask(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const taskRepository = AppDataSource.getRepository(Task)

        try {
            let taskToRemove = await taskRepository.findOneBy({ id })
            if (!taskToRemove) return res.status(404).json({ message: "La tarea no existe" })

            await taskRepository.remove(taskToRemove)
            return res.json({ message: "La tarea ha sido eliminada" })
        } catch (error) {
            return res.status(500).json({ message: "Error al eliminar", error })
        }
    }
}