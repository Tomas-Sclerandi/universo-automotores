import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany } from "typeorm"
import { User } from "./User"
import { Sector } from "./Sector"
import { Comment } from "./Comment"

export enum TaskPriority {
    LOW = "BAJA",
    MEDIUM = "MEDIA",
    HIGH = "ALTA"
}

export enum TaskStatus {
    PENDING = "PENDIENTE",
    IN_PROGRESS = "EN_PROGRESO",
    REVIEW = "REVISION",
    DONE = "COMPLETADA"
}

@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column("text")
    description: string

    @Column({
        type: "enum",
        enum: ["BAJA", "MEDIA", "ALTA"],
        default: "MEDIA"
    })
    priority: "BAJA" | "MEDIA" | "ALTA"

    @Column({
        type: "enum",
        enum: ["PENDIENTE", "EN_PROGRESO", "REVISION", "COMPLETADA"],
        default: "PENDIENTE"
    })
    status: "PENDIENTE" | "EN_PROGRESO" | "REVISION" | "COMPLETADA"

    @Column()
    due_date: Date // Fecha límite

    @Column("text", { nullable: true })
    drive_link: string // Acá pegan el link de Drive (Fase 1)

    @CreateDateColumn()
    created_at: Date

    // Relación: La tarea pertenece a un Sector
    @ManyToOne(() => Sector, (sector) => sector.tasks)
    sector: Sector

    // Relación: La tarea está asignada a un Usuario
    @ManyToOne(() => User, (user) => user.tasks)
    user: User

    // Relación: Una tarea tiene muchos comentarios
    @OneToMany(() => Comment, (comment) => comment.task, { cascade: true, onDelete: 'CASCADE' })
    comments: Comment[]
}