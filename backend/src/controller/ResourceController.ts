import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Resource } from "../entity/Resource"

export class ResourceController {

    static async getAll(req: Request, res: Response) {
        const resourceRepository = AppDataSource.getRepository(Resource)
        const { role } = res.locals.jwtPayload

        try {
            const whereClause = role === 'ADMINISTRADOR' ? {} : { visibility: 'PUBLIC' }

            const resources = await resourceRepository.find({
                where: whereClause as any,
                relations: ["sector"],
                order: { created_at: "DESC" }
            })
            return res.json(resources)
        } catch (error) {
            return res.status(500).json({ message: "Error al buscar recursos", error })
        }
    }

    static async create(req: Request, res: Response) {
        const { title, description, url, type, visibility, sectorId } = req.body
        const resourceRepository = AppDataSource.getRepository(Resource)

        try {
            const resource = new Resource()
            resource.title = title
            resource.description = description
            resource.url = url
            resource.type = type
            resource.visibility = visibility || 'PUBLIC'
            if (sectorId) resource.sector = { id: Number(sectorId) } as any

            await resourceRepository.save(resource)
            return res.status(201).json({ message: "Recurso creado", resource })
        } catch (error) {
            return res.status(500).json({ message: "Error al crear recurso", error })
        }
    }

    static async update(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const { title, description, url, type, visibility, sectorId } = req.body
        const resourceRepository = AppDataSource.getRepository(Resource)

        try {
            let resource = await resourceRepository.findOneBy({ id })
            if (!resource) return res.status(404).json({ message: "Recurso no encontrado" })

            resource.title = title
            resource.description = description
            resource.url = url
            resource.type = type
            resource.visibility = visibility

            if (sectorId) resource.sector = { id: Number(sectorId) } as any

            await resourceRepository.save(resource)
            return res.json({ message: "Recurso actualizado", resource })
        } catch (error) {
            return res.status(500).json({ message: "Error al actualizar", error })
        }
    }

    static async delete(req: Request, res: Response) {
        const id = parseInt(req.params.id)
        const resourceRepository = AppDataSource.getRepository(Resource)

        try {
            let resource = await resourceRepository.findOneBy({ id })
            if (!resource) return res.status(404).json({ message: "Recurso no encontrado" })

            await resourceRepository.remove(resource)
            return res.json({ message: "Recurso eliminado" })
        } catch (error) {
            return res.status(500).json({ message: "Error al eliminar", error })
        }
    }
}
