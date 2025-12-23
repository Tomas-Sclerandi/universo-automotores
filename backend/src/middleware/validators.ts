import { body, validationResult } from "express-validator"
import { Request, Response, NextFunction } from "express"

export const validateResult = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Datos de entrada inválidos",
            errors: errors.array()
        })
    }
    next()
}

export const taskValidation = [
    body('title').notEmpty().withMessage('El título es obligatorio'),
    body('priority').isIn(['BAJA', 'MEDIA', 'ALTA']).withMessage('Prioridad inválida'),
    body('due_date').isDate().withMessage('Fecha inválida o formato incorrecto'),
    body('sectorId').isNumeric().withMessage('Sector ID debe ser numérico'),
    body('userId').isNumeric().withMessage('User ID debe ser numérico')
]

export const taskUpdateValidation = [
    body('title').optional().notEmpty().withMessage('El título es obligatorio'),
    body('priority').optional().isIn(['BAJA', 'MEDIA', 'ALTA']).withMessage('Prioridad inválida'),
    body('due_date').optional().isDate().withMessage('Fecha inválida o formato incorrecto'),
    body('sectorId').optional().isNumeric().withMessage('Sector ID debe ser numérico'),
    body('userId').optional().isNumeric().withMessage('User ID debe ser numérico'),
    body('status').optional().isIn(['PENDIENTE', 'EN_PROGRESO', 'REVISION', 'COMPLETADA']).withMessage('Estado inválido')
]

export const userValidation = [
    body('email').isEmail().withMessage('Email inválido'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    // Password might be optional on update, so handle conditionally in controller or split validation
]

export const userCreateValidation = [
    body('email').isEmail().withMessage('Email inválido'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role').isIn(['ADMINISTRADOR', 'EMPLEADO']).withMessage('Rol inválido'),
    body('sectorId').isNumeric().withMessage('Sector ID debe ser numérico')
]
