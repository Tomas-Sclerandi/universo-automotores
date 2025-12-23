import "reflect-metadata"
import "dotenv/config"
import express from "express"
import * as bodyParser from "body-parser"
import cors from "cors"
import { AppDataSource } from "./data-source"
import { Routes } from "./routes"
import { Request, Response } from "express"
import { Sector } from "./entity/Sector"
import { User } from "./entity/User"
import * as bcrypt from "bcryptjs"

const app = express()
const PORT = 3000

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "https://universo-app.vercel.app"],
    credentials: true
}))
app.use(bodyParser.json())

// Initialize DB connection
AppDataSource.initialize()
    .then(async () => {
        console.log("🔥 Base de Datos conectada con éxito (PostgreSQL) 🔥")

        // Verify if data already exists
        const sectorRepo = AppDataSource.getRepository(Sector)
        const userRepo = AppDataSource.getRepository(User)

        const adminSector = await sectorRepo.findOneBy({ name: "Administración" })

        if (!adminSector) {
            console.log("Insertando datos de prueba...")

            // Create Sectors
            const sec1 = new Sector(); sec1.name = "Administración"; await sectorRepo.save(sec1)
            const sec2 = new Sector(); sec2.name = "Recursos Humanos"; await sectorRepo.save(sec2)
            const sec3 = new Sector(); sec3.name = "Marketing"; await sectorRepo.save(sec3)
            const sec4 = new Sector(); sec4.name = "Ventas"; await sectorRepo.save(sec4)

            // Create Admin
            const admin = new User()
            admin.name = "Admin"
            admin.email = "admin@universo.com"
            admin.password = await bcrypt.hash("admin123", 10)
            admin.role = "ADMINISTRADOR"
            admin.sector = sec1
            await userRepo.save(admin)

            console.log("Datos de prueba insertados correctamente")
        } else {
            console.log("Los datos ya existen, omitiendo seed inicial.")
        }

        // Ensure Admin password is hashed (Fix for existing DBs)
        const adminUser = await userRepo.findOneBy({ email: "admin@universo.com" })
        if (adminUser) {
            // Check if password looks hashed (bcrypt hashes start with $2a$ or similar, and are long)
            // Or just force update it to be safe and ensure it matches known credentials
            const hashedPassword = await bcrypt.hash("admin123", 10)
            // Retrieve current password to compare? No, just overwrite to ensure access.
            // But we don't want to re-hash every restart if not needed, though it's cheap.
            // Let's just overwrite it to 'admin123' (hashed) to guarantee access.
            adminUser.password = hashedPassword
            await userRepo.save(adminUser)
            console.log("✅ Password de Admin actualizado/verificado.")
        }
        // register express routes from defined application routes
        Routes.forEach((route: any) => {
            (app as any)[route.method](route.route, ...(route.middlewares || []), (req: Request, res: Response, next: Function) => {
                const result = (route.controller as any)[route.action](req, res, next)
                if (result instanceof Promise) {
                    result.then(result => {
                        // If the controller already sent the response (res.json returned res), do nothing
                        if (result !== null && result !== undefined && result !== res) {
                            res.send(result)
                        }
                    })
                } else if (result !== null && result !== undefined && result !== res) {
                    res.json(result)
                }
            })
        })

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server corriendo en http://localhost:${PORT}`)
        })
    })
    .catch((error) => {
        console.error("❌ Error al conectar con la Base de Datos:", error)
    })
