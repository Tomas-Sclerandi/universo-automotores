import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { User } from "./User"
import { Task } from "./Task"

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number

    @Column("text")
    content: string

    @CreateDateColumn()
    created_at: Date

    // Relación: El comentario pertenece a una Tarea
    @ManyToOne(() => Task, (task) => task.comments)
    task: Task

    // Relación: El comentario fue escrito por un Usuario
    @ManyToOne(() => User, (user) => user.comments)
    user: User
}
