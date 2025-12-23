import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Task } from "./Task"
import { User } from "./User"
import { Resource } from "./Resource"

@Entity()
export class Sector {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    // Un Sector tiene muchos Empleados
    @OneToMany(() => User, (user) => user.sector)
    users: User[]

    // Un Sector tiene muchas Tareas
    @OneToMany(() => Task, (task) => task.sector)
    tasks: Task[]

    // Un Sector tiene muchos Recursos
    @OneToMany(() => Resource, (resource) => resource.sector)
    resources: Resource[]
}