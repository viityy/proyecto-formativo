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
 * @param {number} running_time.body.required - Running time of the movie
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
    const { title, description, running_time, genre, poster_image, release_date } = req.body;
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

        if (!title || !description || !running_time || !genre || !poster_image || !release_date) {
            return sendBadParam(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }

        const checkMovieQuery = 'SELECT COUNT(*) as count FROM movies WHERE title = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(checkMovieQuery, [title]);

        if (rows[0].count > 0) {
            return sendConflict(res, undefined, ip, 'La película ya existe', endpoint);
        }

        const created_at = Math.floor(new Date().getTime() / 1000);
        const query = 'INSERT INTO movies (title, description, running_time, genre, poster_image, release_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [title, description, running_time * 60, genre, poster_image, release_date, created_at];

        db.query<ResultSetHeader>(query, values, (err) => {
            if (err) {
                console.error('Error al insertar la película:', err);
                return sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            return sendOk(res, undefined, ip, { message: 'Película añadida correctamente' }, endpoint);
        });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};

/**
 * Get all movies.
 * @route GET /api/movies
 * @group Movie
 * @returns {object} 200 - List of all movies with id and title
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 500 - Internal server error
 */
export const getAllMovies = async (req: Request, res: Response) => {
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

        const getAllMoviesQuery = 'SELECT id, title FROM movies';
        const [rows] = await db.promise().query<RowDataPacket[]>(getAllMoviesQuery);

        return sendOk(res, undefined, ip, { movies: rows }, endpoint);

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};


/**
 * Get one movie by ID.
 * @route GET /api/movies/{id}
 * @group Movie
 * @param {number} id.path.required - ID of the movie to retrieve
 * @returns {object} 200 - Movie details
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Movie not found
 * @returns {object} 500 - Internal server error
 */
export const getOneMovie = async (req: Request, res: Response) => {
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

        const { id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!id) {
            return sendBadParam(res, undefined, ip, 'ID de película no proporcionado', endpoint);
        }

        const getOneMovieQuery = 'SELECT * FROM movies WHERE id = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(getOneMovieQuery, [id]);

        if (rows.length === 0) {
            return sendBadParam(res, undefined, ip, 'Película no encontrada', endpoint);
        }

        return sendOk(res, undefined, ip, { movie: rows[0] }, endpoint);

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};


/**
 * Edit one movie by ID.
 * @route PATCH /api/movies/{id}
 * @group Movie
 * @param {string} id.path.required - ID of the movie to be edited
 * @param {string} title.body.required - New title of the movie
 * @param {string} description.body.required - New description of the movie
 * @param {number} running_time.body.required - Running time of the movie
 * @param {string} genre.body.required - New genre of the movie
 * @param {string} poster_image.body.required - New URL of the poster image
 * @param {string} release_date.body.required - New release date of the movie
 * @returns {object} 200 - Movie edited successfully
 * @returns {object} 400 - Bad request, invalid input data
 * @returns {object} 409 - Conflict, movie title already exists
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Movie not found
 * @returns {object} 500 - Internal server error
 */
export const editMovie = async (req: Request, res: Response) => {
    const { title, description, running_time , genre, poster_image, release_date } = req.body;
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
                return sendUnauthorized(res, undefined, ip, 'Solo los usuarios admin pueden editar películas', endpoint);
            }
        } else {
            console.error('Decodificación fallida, no es un objeto válido.');
            return sendUnauthorized(res, undefined, ip, 'Token inválido', endpoint);
        }

        const { id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!id) {
            return sendBadParam(res, undefined, ip, 'ID de película no proporcionado', endpoint);
        }

        if (!title || !description || !running_time || !genre || !poster_image || !release_date) {
            return sendBadParam(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }

        const checkMovieQuery = 'SELECT COUNT(*) as count FROM movies WHERE id = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(checkMovieQuery, [id]);

        if (rows[0].count <= 0) {
            return sendConflict(res, undefined, ip, 'La película no existe', endpoint);
        }

        const created_at = Math.floor(new Date().getTime() / 1000);
        const query = 'UPDATE movies SET title = ?, description = ?, running_time = ?, genre = ?, poster_image = ?, release_date = ?, created_at = ? WHERE id = ?';
        const values = [title, description, running_time * 60 ,genre, poster_image, release_date, created_at, id];

        db.query<ResultSetHeader>(query, values, (err) => {
            if (err) {
                console.error('Error al editar la película:', err);
                return sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            return sendOk(res, undefined, ip, { message: 'Película editada correctamente' }, endpoint);
        });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};


/**
 * Delete one movie by ID.
 * @route DELETE /api/movies/{id}
 * @group Movie
 * @param {number} id.path.required - ID of the movie to delete
 * @returns {object} 200 - Movie details
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Movie not found
 * @returns {object} 500 - Internal server error
 */
export const deleteMovie = async (req: Request, res: Response) => {
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
                return sendUnauthorized(res, undefined, ip, 'Solo los usuarios admin pueden editar películas', endpoint);
            }
        } else {
            console.error('Decodificación fallida, no es un objeto válido.');
            return sendUnauthorized(res, undefined, ip, 'Token inválido', endpoint);
        }

        const { id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!id) {
            return sendBadParam(res, undefined, ip, 'ID de película no proporcionado', endpoint);
        }

        const checkMovieQuery = 'SELECT COUNT(*) as count FROM movies WHERE id = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(checkMovieQuery, [id]);
        if (rows[0].count <= 0) {
            return sendConflict(res, undefined, ip, 'La película no existe', endpoint);
        }

        const deleteOneMovieQuery = 'DELETE FROM movies WHERE id = ?';

        db.query<ResultSetHeader>(deleteOneMovieQuery, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar la película:', err);
                return sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
            }

            if (result.affectedRows === 0) {
                return sendBadParam(res, undefined, ip, 'No se encontró la película para eliminar', endpoint);
            }

            return sendOk(res, undefined, ip, { message: 'Película eliminada correctamente' }, endpoint);
        });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};


/**
 * Get all movies by genre.
 * @route GET /api/movies/genre/{genre}
 * @group Movie
 * @param {string} genre.path.required - genre of the movies to retrieve 
 * @returns {object} 200 - List of movies with id and title by genre
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Movie not found
 * @returns {object} 500 - Internal server error
 */
export const getGenreMovies = async (req: Request, res: Response) => {
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

        const { genre } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!genre) {
            return sendBadParam(res, undefined, ip, 'Genero de película no proporcionado', endpoint);
        }

        const getGenreMoviesQuery = 'SELECT * FROM movies WHERE genre = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(getGenreMoviesQuery, [genre]);

        if (rows.length === 0) {
            return sendBadParam(res, undefined, ip, 'No hay películas con este género', endpoint);
        }

        return sendOk(res, undefined, ip, { movies: rows }, endpoint);

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};