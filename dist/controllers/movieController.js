"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenreMovies = exports.deleteMovie = exports.editMovie = exports.getOneMovie = exports.getAllMovies = exports.addMovie = void 0;
const db_1 = __importDefault(require("../config/db"));
const messages_1 = require("../utils/messages");
const tokenDecode_1 = require("../utils/tokenDecode");
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
 * @returns {object} 200 - Movie added successfully
 * @returns {object} 400 - Bad request
 * @returns {object} 409 - Conflict, movie title already exists
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
const addMovie = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, description, running_time, genre, poster_image, release_date } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token no proporcionado', endpoint);
    }
    try {
        const decoded = yield (0, tokenDecode_1.verifyToken)(token);
        if (typeof decoded === 'object' && decoded !== null) {
            if (decoded.role === 'user') {
                return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Solo los usuarios admin pueden añadir películas', endpoint);
            }
        }
        else {
            console.error('Decodificación fallida, no es un objeto válido.');
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token inválido', endpoint);
        }
        if (!title || !description || !running_time || !genre || !poster_image || !release_date) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }
        const checkMovieQuery = 'SELECT COUNT(*) as count FROM movies WHERE title = ?';
        const [rows] = yield db_1.default.promise().query(checkMovieQuery, [title]);
        if (rows[0].count > 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'La película ya existe', endpoint);
        }
        const created_at = Math.floor(new Date().getTime() / 1000);
        const query = 'INSERT INTO movies (title, description, running_time, genre, poster_image, release_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [title, description, running_time * 60, genre, poster_image, release_date, created_at];
        db_1.default.query(query, values, (err) => {
            if (err) {
                console.error('Error al insertar la película:', err);
                return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Película añadida correctamente' }, endpoint);
        });
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.addMovie = addMovie;
/**
 * Get all movies.
 * @route GET /api/movies
 * @group Movie
 * @returns {object} 200 - List of all movies with id and title
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
const getAllMovies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token no proporcionado', endpoint);
    }
    try {
        const decoded = yield (0, tokenDecode_1.verifyToken)(token);
        if (typeof decoded !== 'object' || decoded === null) {
            console.error('Decodificación fallida, no es un objeto válido.');
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token inválido', endpoint);
        }
        const getAllMoviesQuery = 'SELECT id, title FROM movies';
        const [rows] = yield db_1.default.promise().query(getAllMoviesQuery);
        return (0, messages_1.sendOk)(res, undefined, ip, { movies: rows }, endpoint);
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.getAllMovies = getAllMovies;
/**
 * Get one movie by ID.
 * @route GET /api/movies/{id}
 * @group Movie
 * @param {number} id.path.required - ID of the movie to retrieve
 * @returns {object} 200 - Movie details
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Movie not found
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
const getOneMovie = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token no proporcionado', endpoint);
    }
    try {
        const decoded = yield (0, tokenDecode_1.verifyToken)(token);
        if (typeof decoded !== 'object' || decoded === null) {
            console.error('Decodificación fallida, no es un objeto válido.');
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token inválido', endpoint);
        }
        const { id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!id) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'ID de película no proporcionado', endpoint);
        }
        const getOneMovieQuery = 'SELECT * FROM movies WHERE id = ?';
        const [rows] = yield db_1.default.promise().query(getOneMovieQuery, [id]);
        if (rows.length === 0) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'Película no encontrada', endpoint);
        }
        return (0, messages_1.sendOk)(res, undefined, ip, { movie: rows[0] }, endpoint);
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.getOneMovie = getOneMovie;
/**
 * Edit one movie by ID.
 * @route PATCH /api/movies/{id}
 * @group Movie
 * @param {number} id.path.required - ID of the movie to be edited
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
 * @security Bearer token
 */
const editMovie = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, description, running_time, genre, poster_image, release_date } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token no proporcionado', endpoint);
    }
    try {
        const decoded = yield (0, tokenDecode_1.verifyToken)(token);
        if (typeof decoded === 'object' && decoded !== null) {
            if (decoded.role === 'user') {
                return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Solo los usuarios admin pueden editar películas', endpoint);
            }
        }
        else {
            console.error('Decodificación fallida, no es un objeto válido.');
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token inválido', endpoint);
        }
        const { id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!id) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'ID de película no proporcionado', endpoint);
        }
        if (!title || !description || !running_time || !genre || !poster_image || !release_date) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }
        const checkMovieQuery = 'SELECT COUNT(*) as count FROM movies WHERE id = ?';
        const [rows] = yield db_1.default.promise().query(checkMovieQuery, [id]);
        if (rows[0].count <= 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'La película no existe', endpoint);
        }
        const created_at = Math.floor(new Date().getTime() / 1000);
        const query = 'UPDATE movies SET title = ?, description = ?, running_time = ?, genre = ?, poster_image = ?, release_date = ?, created_at = ? WHERE id = ?';
        const values = [title, description, running_time * 60, genre, poster_image, release_date, created_at, id];
        db_1.default.query(query, values, (err) => {
            if (err) {
                console.error('Error al editar la película:', err);
                return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Película editada correctamente' }, endpoint);
        });
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.editMovie = editMovie;
/**
 * Delete one movie by ID.
 * @route DELETE /api/movies/{id}
 * @group Movie
 * @param {number} id.path.required - ID of the movie to delete
 * @returns {object} 200 - Movie deleted successfully
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Movie not found
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
const deleteMovie = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token no proporcionado', endpoint);
    }
    try {
        const decoded = yield (0, tokenDecode_1.verifyToken)(token);
        if (typeof decoded === 'object' && decoded !== null) {
            if (decoded.role === 'user') {
                return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Solo los usuarios admin pueden eliminar películas', endpoint);
            }
        }
        else {
            console.error('Decodificación fallida, no es un objeto válido.');
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token inválido', endpoint);
        }
        const { id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!id) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'ID de película no proporcionado', endpoint);
        }
        const checkMovieQuery = 'SELECT COUNT(*) as count FROM movies WHERE id = ?';
        const [rows] = yield db_1.default.promise().query(checkMovieQuery, [id]);
        if (rows[0].count <= 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'La película no existe', endpoint);
        }
        const deleteOneMovieQuery = 'DELETE FROM movies WHERE id = ?';
        db_1.default.query(deleteOneMovieQuery, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar la película:', err);
                return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            if (result.affectedRows === 0) {
                return (0, messages_1.sendBadParam)(res, undefined, ip, 'No se encontró la película para eliminar', endpoint);
            }
            return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Película eliminada correctamente' }, endpoint);
        });
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.deleteMovie = deleteMovie;
/**
 * Get all movies by genre.
 * @route GET /api/movies/genre/{genre}
 * @group Movie
 * @param {string} genre.path.required - genre of the movies to retrieve
 * @returns {object} 200 - List of movies with id and title by genre
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Movie not found
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
const getGenreMovies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token no proporcionado', endpoint);
    }
    try {
        const decoded = yield (0, tokenDecode_1.verifyToken)(token);
        if (typeof decoded !== 'object' || decoded === null) {
            console.error('Decodificación fallida, no es un objeto válido.');
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token inválido', endpoint);
        }
        const { genre } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!genre) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'Genero de película no proporcionado', endpoint);
        }
        const getGenreMoviesQuery = 'SELECT * FROM movies WHERE genre = ?';
        const [rows] = yield db_1.default.promise().query(getGenreMoviesQuery, [genre]);
        if (rows.length === 0) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'No hay películas con este género', endpoint);
        }
        return (0, messages_1.sendOk)(res, undefined, ip, { movies: rows }, endpoint);
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.getGenreMovies = getGenreMovies;
