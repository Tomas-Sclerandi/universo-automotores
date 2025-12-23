import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Comment } from "../entity/Comment"
import { Task } from "../entity/Task"
import { User } from "../entity/User"

export class CommentController {

    static async getByTask(req: Request, res: Response) {
        try {
            const taskId = parseInt(req.params.taskId)
            const commentRepository = AppDataSource.getRepository(Comment)

            const comments = await commentRepository.find({
                where: { task: { id: taskId } },
                relations: ["user"],
                order: { created_at: "ASC" }
            })

            return res.json(comments)
        } catch (error) {
            return res.status(500).json({ message: "Error al obtener comentarios", error })
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { content, taskId, userId } = req.body

            const commentRepository = AppDataSource.getRepository(Comment)
            const taskRepository = AppDataSource.getRepository(Task)
            const userRepository = AppDataSource.getRepository(User)

            const task = await taskRepository.findOneBy({ id: taskId })
            const user = await userRepository.findOneBy({ id: userId })

            if (!task || !user) {
                return res.status(404).json({ message: "Tarea o Usuario no encontrado" })
            }

            const comment = new Comment()
            comment.content = content
            comment.task = task
            comment.user = user

            await commentRepository.save(comment)

            return res.status(201).json(comment)
        } catch (error) {
            return res.status(500).json({ message: "Error al crear comentario", error })
        }
    }
}
