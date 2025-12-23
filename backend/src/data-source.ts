import "reflect-metadata"
import "dotenv/config"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Sector } from "./entity/Sector"
import { Task } from "./entity/Task"
import { Comment } from "./entity/Comment"
import { Meeting } from "./entity/Meeting"
import { Resource } from "./entity/Resource"

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: true,
    logging: false,
    entities: [User, Sector, Task, Comment, Meeting, Resource],
    migrations: [],
    subscribers: [],
})
