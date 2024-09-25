import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendOk, sendBadParam, sendUnauthorized, sendServerError, sendConflict } from '../utils/messages';
import { verifyToken } from '../utils/tokenDecode';

/**
 * Add a new showtime.
 * @route POST /api/showtimes/add
 * @group Movie
 * @param {number} movie_id.body.required - ID of the movie
 * @param {number} room_id.body.required - ID of the room
 * @param {number} showtime_init.body.required - Timestamp of the movie date
 * @returns {object} 201 - Showtime added successfully
 * @returns {object} 400 - Bad request
 * @returns {object} 409 - Conflict, movie title already exists
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 500 - Internal server error
 */
export const addShowtime = async (req: Request, res: Response) => {
    const { movie_id, room_id, showtime_init } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    // Validación del token de autorización
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return sendUnauthorized(res, undefined, ip, 'Token no proporcionado', endpoint);
    }

    try {
        const decoded = await verifyToken(token);

        // Verificación del rol del usuario
        if (!decoded || typeof decoded !== 'object') {
            return sendUnauthorized(res, undefined, ip, 'Token inválido', endpoint);
        }
        if (decoded.role !== 'admin') {
            return sendUnauthorized(res, undefined, ip, 'Solo los usuarios admin pueden añadir horarios', endpoint);
        }

        // Validación de los parámetros requeridos
        if (!movie_id || !room_id || !showtime_init) {
            return sendBadParam(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }

        const created_at = Math.floor(new Date().getTime() / 1000); // Timestamp actual

        // Verificación del timestamp
        if (created_at >= showtime_init) {
            return sendConflict(res, undefined, ip, 'El timestamp del espectáculo no puede ser inferior al actual', endpoint);
        }

        // Verificación de la película
        const checkMovieQuery = 'SELECT COUNT(*) as count FROM movies WHERE id = ?';
        const [movieCheckRows] = await db.promise().query<RowDataPacket[]>(checkMovieQuery, [movie_id]);

        if (movieCheckRows[0].count <= 0) {
            return sendConflict(res, undefined, ip, 'La película no existe', endpoint);
        }

        // Verificación de la sala (room) y obtención de la capacidad
        const getAvailableSeatsQuery = 'SELECT capacity FROM rooms WHERE id = ?';
        const [roomRows] = await db.promise().query<RowDataPacket[]>(getAvailableSeatsQuery, [room_id]);

        if (roomRows.length === 0) {
            return sendBadParam(res, undefined, ip, 'No se encontró la sala con el ID proporcionado', endpoint);
        }

        // Obtención de la duración de la película para calcular la duración del espectáculo
        const getMovieTimeQuery = 'SELECT running_time FROM movies WHERE id = ?';
        const [movieRows] = await db.promise().query<RowDataPacket[]>(getMovieTimeQuery, [movie_id]);

        if (movieRows.length === 0) {
            return sendBadParam(res, undefined, ip, 'No se encontró la película con el ID proporcionado', endpoint);
        }

        const capacity = roomRows[0].capacity;
        const running_time = movieRows[0].running_time;
        const showtime_end = showtime_init + running_time + 1800; //sumamos 30 minutos (en segundos)

        const getShowtimesQuery = 'SELECT * FROM showtimes WHERE room_id = ?';
        const [showtimesRows] = await db.promise().query<RowDataPacket[]>(getShowtimesQuery, [room_id]);

        // Verifica si hay solapamiento entre los espectáculos.
        if (showtimesRows.length > 0) {
            for (let i = 0; i < showtimesRows.length; i++) {
                const existingShowtimeInit = showtimesRows[i].showtime_init;
                const existingShowtimeEnd = showtimesRows[i].showtime_end;

                let conflictType = null;

                // Determinamos el tipo de conflicto
                if (showtime_init >= existingShowtimeInit && showtime_init < existingShowtimeEnd) {
                    conflictType = 'startOverlap'; // Nuevo inicio dentro de un espectáculo existente
                } else if (showtime_end > existingShowtimeInit && showtime_end <= existingShowtimeEnd) {
                    conflictType = 'endOverlap'; // Nuevo fin dentro de un espectáculo existente
                } else if (showtime_init <= existingShowtimeInit && showtime_end >= existingShowtimeEnd) {
                    conflictType = 'fullOverlap'; // Nuevo espectáculo abarca a uno existente
                }

                // Verificamos el tipo de conflicto y enviamos el mensaje adecuado
                switch (conflictType) {
                    case 'startOverlap':
                        return sendConflict(res, undefined, ip, `El inicio del nuevo espectáculo se solapa con el espectáculo existente (ID: ${showtimesRows[i].id})`, endpoint);
                    case 'endOverlap':
                        return sendConflict(res, undefined, ip, `El fin del nuevo espectáculo se solapa con el espectáculo existente (ID: ${showtimesRows[i].id})`, endpoint);
                    case 'fullOverlap':
                        return sendConflict(res, undefined, ip, `El nuevo espectáculo abarca completamente el espectáculo existente (ID: ${showtimesRows[i].id})`, endpoint);
                }
            }
        }

        // Preparación e inserción del nuevo showtime en la base de datos
        const insertShowtimeQuery = `
            INSERT INTO showtimes (movie_id, room_id, showtime_init, showtime_end ,available_seats, total_seats, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const showtimeValues = [movie_id, room_id, showtime_init, showtime_end, capacity, capacity, created_at];

        const [result] = await db.promise().query<ResultSetHeader>(insertShowtimeQuery, showtimeValues);

        // Verificar si el showtime fue añadido correctamente
        if (result.affectedRows > 0) {
            return sendOk(res, undefined, ip, { message: 'Espectáculo añadido correctamente' }, endpoint);
        } else {
            return sendServerError(res, undefined, ip, 'Error al añadir el espectáculo', endpoint);
        }

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};
