import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config/config";

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
    // Get the jwt token from the head
    const token = <string>req.headers["auth-token"];
    let jwtPayload;

    try {
        jwtPayload = <any>jwt.verify(token, config.jwtSecret);
        res.locals.jwtPayload = jwtPayload;
    } catch (error) {
        // If token is not valid, respond with 401 (unauthorized)
        res.status(401).send({ message: "No autorizado, token inválido o ausente" });
        return;
    }

    // Call the next middleware or controller
    next();
};
