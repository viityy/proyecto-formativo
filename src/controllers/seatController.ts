import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendOk, sendBadParam, sendUnauthorized, sendServerError, sendConflict } from '../utils/messages';
import { verifyToken } from '../utils/tokenDecode';

/**
 * Get all reserved seats by showtime.
 * @route GET /api/seats/showtime/{showtime_id}
 * @group Seats
 * @param {number} showtime_id.path.required - ID of the showtime to retrieve seats
 * @returns {object} 200 - List of seats with id and number by showtime
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Showtime not found
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
export const getShowtimeSeats = async (req: Request, res: Response) => {
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return sendUnauthorized(res, undefined, ip, 'Token no proporcionado', endpoint);
    }

    try {
        
        const decoded = await verifyToken(token);

        if (typeof decoded !== 'object' || decoded === null) {
            console.error('Decodificación fallida, no es un objeto válido.');
            return sendUnauthorized(res, undefined, ip, 'Token inválido', endpoint);
        }

        const { showtime_id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!showtime_id) {
            return sendBadParam(res, undefined, ip, 'ID del espectáculo no proporcionado', endpoint);
        }

        //Verificar si el showtime existe
        const checkShowtimeQuery = 'SELECT * FROM showtimes WHERE id = ?';
        const [showtimeRows] = await db.promise().query<RowDataPacket[]>(checkShowtimeQuery, [showtime_id]);

        if (showtimeRows.length === 0) {
            return sendBadParam(res, undefined, ip, 'No existe el espectáculo', endpoint);
        }

        const getShowtimeSeatsQuery = 'SELECT id, seat_number FROM seats WHERE showtime_id = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(getShowtimeSeatsQuery, [showtime_id]);

        return sendOk(res, undefined, ip, { seats: rows }, endpoint);

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};
