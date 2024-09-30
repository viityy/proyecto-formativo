import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendOk, sendBadParam, sendUnauthorized, sendServerError, sendConflict } from '../utils/messages';
import { verifyToken } from '../utils/tokenDecode';

/**
 * Add a new room.
 * @route POST /api/rooms/add
 * @group Room
 * @param {string} name.body.required - Name of the room
 * @param {number} capacity.body.required - Capacity of the room
 * @returns {object} 200 - Room added successfully
 * @returns {object} 400 - Bad request
 * @returns {object} 409 - Conflict, room name already exists
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
export const addRoom = async (req: Request, res: Response) => {
    const { name, capacity } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return sendUnauthorized(res, undefined, ip, 'Token no proporcionado', endpoint);
    }

    try {
        const decoded = await verifyToken(token);

        if (typeof decoded === 'object' && decoded !== null) {
            if (decoded.role === 'user') {
                return sendUnauthorized(res, undefined, ip, 'Solo los usuarios admin pueden añadir salas', endpoint);
            }
        } else {
            console.error('Decodificación fallida, no es un objeto válido.');
            return sendUnauthorized(res, undefined, ip, 'Token inválido', endpoint);
        }

        if (!name || !capacity) {
            return sendBadParam(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }

        const checkRoomQuery = 'SELECT COUNT(*) as count FROM rooms WHERE name = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(checkRoomQuery, [name]);

        if (rows[0].count > 0) {
            return sendConflict(res, undefined, ip, 'La sala ya existe', endpoint);
        }

        const created_at = Math.floor(new Date().getTime() / 1000);
        const query = 'INSERT INTO rooms (name, capacity, created_at) VALUES (?, ?, ?)';
        const values = [name, capacity, created_at];

        db.query<ResultSetHeader>(query, values, (err) => {
            if (err) {
                console.error('Error al insertar la sala:', err);
                return sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            return sendOk(res, undefined, ip, { message: 'Sala añadida correctamente' }, endpoint);
        });

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};