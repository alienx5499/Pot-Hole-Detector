import { Request } from "express"

export interface CustomRequest extends Request {
    userId?: string;
}

export interface JwtPayload {
    userId: string;
}

export interface Location {
    latitude: number;
    longitude: number;
    address?: string;
}

export interface PotholeReport {
    userId: string;
    imageUrl: string;
    location: Location;
    detectionResult?: any;
    status: 'Pending' | 'Verified' | 'Fixed';
    createdAt: Date;
}