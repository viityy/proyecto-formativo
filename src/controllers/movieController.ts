import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendOk, sendBadParam, sendUnauthorized, sendServerError, sendConflict } from '../utils/messages';
import { verifyToken } from '../utils/tokenDecode';


/**
 * Add a new movie.
 * @route POST /api/movies/add
 * @group Movie
 * @param {string} title.body.required - Title of the movie
 * @param {string} description.body.required - Description of the movie
 * @param {string} genre.body.required - Genre of the movie
 * @param {string} poster_image.body.required - URL of the poster image
 * @param {string} release_date.body.required - Release date of the movie
 * @returns {object} 201 - Movie added successfully
 * @returns {object} 400 - Bad request
 * @returns {object} 409 - Conflict, movie title already exists
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 500 - Internal server error
 */
export const addMovie = async (req: Request, res: Response) => {
    const { title, description, genre, poster_image, release_date } = req.body;
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
                return sendUnauthorized(res, undefined, ip, 'Solo los usuarios admin pueden añadir películas', endpoint);
            }
        } else {
            console.error('Decodificación fallida, no es un objeto válido.');
            return sendUnauthorized(res, undefined, ip, 'Token inválido', endpoint);
        }

        if (!title || !description || !genre || !poster_image || !release_date) {
            return sendBadParam(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }

        const checkMovieQuery = 'SELECT COUNT(*) as count FROM movies WHERE title = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(checkMovieQuery, [title]);

        if (rows[0].count > 0) {
            return sendConflict(res, undefined, ip, 'La película ya existe', endpoint);
        }

        const created_at = Math.floor(new Date().getTime() / 1000);
        const query = 'INSERT INTO movies (title, description, genre, poster_image, release_date, created_at) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [title, description, genre, poster_image, release_date, created_at];

        db.query<ResultSetHeader>(query, values, (err) => {
            if (err) {
                console.error('Error al insertar la película:', err);
                return sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            return sendOk(res, undefined, ip, { message: 'Película añadida correctamente' }, endpoint);
        });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendUnauthorized(res, undefined, ip, 'Token inválido', endpoint);
    }
};
