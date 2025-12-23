import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from "typeorm"
import { User } from "./User"

@Entity()
export class Meeting {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    date: Date

    @Column({ nullable: true })
    link: string

    @ManyToOne(() => User, user => user.createdMeetings)
    creator: User

    @ManyToMany(() => User, user => user.meetings)
    @JoinTable()
    attendees: User[]
}
