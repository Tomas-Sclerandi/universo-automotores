import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Sector } from "../entity/Sector"

export class SectorController {

    static async getAll(req: Request, res: Response) {
        const sectorRepository = AppDataSource.getRepository(Sector)
        try {
            const sectors = await sectorRepository.find()
            return res.json(sectors)
        } catch (error) {
            return res.status(500).json({ message: "Error al obtener sectores", error })
        }
    }

    static async getOne(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const sectorRepository = AppDataSource.getRepository(Sector)

        try {
            const sector = await sectorRepository.findOne({ where: { id } })
            if (!sector) return res.status(404).json({ message: "Sector no encontrado" })
            return res.json(sector)
        } catch (error) {
            return res.status(500).json({ message: "Error interno", error })
        }
    }

    static async createSector(req: Request, res: Response) {
        const { name } = req.body
        const sectorRepository = AppDataSource.getRepository(Sector)

        if (!name) return res.status(400).json({ message: "El nombre es obligatorio" })

        try {
            const sector = new Sector()
            sector.name = name
            await sectorRepository.save(sector)
            return res.status(201).json({ message: "Sector creado", sector })
        } catch (error) {
            return res.status(500).json({ message: "Error al crear sector", error })
        }
    }

    static async updateSector(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const { name } = req.body
        const sectorRepository = AppDataSource.getRepository(Sector)

        try {
            let sector = await sectorRepository.findOneBy({ id })
            if (!sector) return res.status(404).json({ message: "Sector no encontrado" })

            sector.name = name
            await sectorRepository.save(sector)
            return res.json({ message: "Sector actualizado", sector })
        } catch (error) {
            return res.status(500).json({ message: "Error al actualizar sector", error })
        }
    }

    static async removeSector(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const sectorRepository = AppDataSource.getRepository(Sector)

        try {
            let sectorToRemove = await sectorRepository.findOne({
                where: { id },
                relations: ["users"]
            })

            if (!sectorToRemove) return res.status(404).json({ message: "El sector no existe" })

            if (sectorToRemove.users && sectorToRemove.users.length > 0) {
                return res.status(400).json({ message: "No se puede eliminar el sector porque tiene usuarios asignados." })
            }

            await sectorRepository.remove(sectorToRemove)
            return res.json({ message: "Sector eliminado" })
        } catch (error) {
            return res.status(500).json({ message: "Error al eliminar", error })
        }
    }
}