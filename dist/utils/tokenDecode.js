"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Cargar las variables de entorno desde .env
dotenv_1.default.config();
const SECRET_KEY = process.env.JWT_SECRET;
const verifyToken = (token) => {
    if (!SECRET_KEY) {
        throw new Error('Secret key is not defined.');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        return decoded; // Devuelve el objeto decoded entero
    }
    catch (error) {
        throw error; // Propaga el error si la verificación falla
    }
};
exports.verifyToken = verifyToken;
