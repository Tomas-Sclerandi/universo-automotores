import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { Sector } from "./Sector"

export enum ResourceType {
    FOLDER = "FOLDER",
    DOCUMENT = "DOCUMENT",
    SPREADSHEET = "SPREADSHEET",
    OTHER = "OTHER"
}

export enum ResourceVisibility {
    PUBLIC = "PUBLIC",
    ADMIN_ONLY = "ADMIN_ONLY"
}

@Entity()
export class Resource {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column("text", { nullable: true })
    description: string

    @Column("text")
    url: string

    @Column({
        type: "enum",
        enum: ["FOLDER", "DOCUMENT", "SPREADSHEET", "OTHER"],
        default: "OTHER"
    })
    type: "FOLDER" | "DOCUMENT" | "SPREADSHEET" | "OTHER"

    @Column({
        type: "enum",
        enum: ["PUBLIC", "ADMIN_ONLY"],
        default: "PUBLIC"
    })
    visibility: "PUBLIC" | "ADMIN_ONLY"

    @CreateDateColumn()
    created_at: Date

    // Relation: Resource optionally belongs to a Sector
    @ManyToOne(() => Sector, (sector) => sector.resources)
    sector: Sector
}
