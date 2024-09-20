import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Cargar las variables de entorno desde .env
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

export const verifyToken = (token: string) => {
    if (!SECRET_KEY) {
        throw new Error('Secret key is not defined.');
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded; // Devuelve el objeto decoded entero
    } catch (error) {
        throw error; // Propaga el error si la verificación falla
    }
};
