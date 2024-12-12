import { JWT_SECRET } from "../config";
import jwt from "jsonwebtoken"
import { CustomRequest, JwtPayload } from "../interfaces";
import { NextFunction, Response } from "express";

const userMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
    const words = req.headers.authorization;
    const token = words?.split(' ')[1];
    
    if (!token) {
        res.status(401).json({
            message: "Please provide a token"
        });
        return;
    }
    
    if (!JWT_SECRET) {
        res.status(500).json({
            message: "JWT_SECRET not provided"
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({
            message: "Invalid token"
        });
    }
}

export default userMiddleware;