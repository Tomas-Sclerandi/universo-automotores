import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany } from "typeorm"
import { Sector } from "./Sector"
import { Task } from "./Task"
import { Comment } from "./Comment"
import { Meeting } from "./Meeting"

export enum UserRole {
    ADMIN = "ADMIN",
    EMPLOYEE = "EMPLOYEE"
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ unique: true })
    email: string

    @Column()
    password: string

    @Column({
        type: "enum",
        enum: ["ADMINISTRADOR", "EMPLEADO"],
        default: "EMPLEADO"
    })
    role: "ADMINISTRADOR" | "EMPLEADO"

    // Relación: Muchos Usuarios pertenecen a Un Sector
    @ManyToOne(() => Sector, (sector) => sector.users)
    sector: Sector

    // Relación: Un Usuario tiene muchas Tareas asignadas
    @OneToMany(() => Task, (task) => task.user)
    tasks: Task[]

    // Relación: Un Usuario escribe muchos comentarios
    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[]

    @OneToMany(() => Meeting, meeting => meeting.creator)
    createdMeetings: Meeting[]

    @ManyToMany(() => Meeting, meeting => meeting.attendees)
    meetings: Meeting[]
}