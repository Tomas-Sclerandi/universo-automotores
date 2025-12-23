import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entity/User"
import { Task } from "../entity/Task"
import * as jwt from "jsonwebtoken"
import * as bcrypt from "bcryptjs"
import config from "../config/config"
import { validationResult } from "express-validator"

export class UserController {

    // --- GET ALL USERS ---
    static async getAll(req: Request, res: Response) {
        const userRepository = AppDataSource.getRepository(User)
        try {
            const users = await userRepository.find({ relations: ["sector"] })
            return res.json(users)
        } catch (error) {
            return res.status(500).json({ message: "Error al buscar usuarios", error })
        }
    }

    // --- GET USER BY ID ---
    static async getOne(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const userRepository = AppDataSource.getRepository(User)
        try {
            const user = await userRepository.findOne({
                where: { id },
                relations: ["sector"]
            })

            if (!user) return res.status(404).json({ message: "Usuario no encontrado" })
            return res.json(user)
        } catch (error) {
            return res.status(500).json({ message: "Error al buscar usuario", error })
        }
    }

    // --- CREATE USER ---
    static async createUser(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { name, email, password, role, sectorId } = req.body
        const userRepository = AppDataSource.getRepository(User)

        try {
            const user = new User()
            user.name = name
            user.email = email
            user.password = await bcrypt.hash(password, 10)
            user.role = role
            user.sector = { id: sectorId } as any

            await userRepository.save(user)
            return res.status(201).json({ message: "Usuario creado", user })
        } catch (error) {
            return res.status(500).json({ message: "Error al crear", error })
        }
    }

    // --- UPDATE USER ---
    static async updateUser(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const id = parseInt(req.params.id)
        const { name, email, password, role, sectorId } = req.body
        const userRepository = AppDataSource.getRepository(User)

        try {
            let user = await userRepository.findOneBy({ id })
            if (!user) return res.status(404).json({ message: "Usuario no encontrado" })

            user.name = name
            user.email = email
            if (password) {
                user.password = await bcrypt.hash(password, 10)
            }
            user.role = role
            if (sectorId) user.sector = { id: sectorId } as any

            await userRepository.save(user)
            return res.json({ message: "Usuario actualizado", user })
        } catch (error) {
            return res.status(500).json({ message: "Error al actualizar", error })
        }
    }

    // --- DELETE USER ---
    static async removeUser(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const userRepository = AppDataSource.getRepository(User)
        const taskRepository = AppDataSource.getRepository(Task)

        try {
            let userToRemove = await userRepository.findOneBy({ id })
            if (!userToRemove) return res.status(404).json({ message: "Usuario no existe" })

            // Check if user has assigned tasks before deleting
            const taskCount = await taskRepository.count({
                where: { user: { id: id } }
            })

            if (taskCount > 0) {
                return res.status(400).json({ message: "No se puede eliminar el usuario porque tiene tareas asignadas" })
            }

            await userRepository.remove(userToRemove)
            return res.json({ message: "Usuario eliminado correctamente" })
        } catch (error: any) {
            console.error("Error al eliminar usuario:", error)
            return res.status(500).json({ message: "Error al eliminar", error })
        }
    }

    // --- LOGIN ---
    static async login(req: Request, res: Response) {
        const { email, password } = req.body
        const userRepository = AppDataSource.getRepository(User)

        try {
            const user = await userRepository.findOne({ where: { email } })

            if (!user) {
                return res.status(401).json({ message: "Credenciales inválidas" })
            }

            // Check if password matches
            const isValidPassword = await bcrypt.compare(password, user.password)
            if (!isValidPassword) {
                return res.status(401).json({ message: "Credenciales inválidas" })
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                config.jwtSecret,
                { expiresIn: "8h" }
            )

            return res.json({ token, user })
        } catch (error) {
            return res.status(500).json({ message: "Error en el login", error })
        }
    }
}