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
exports.editReservation = exports.deleteReservation = exports.addReservation = void 0;
const db_1 = __importDefault(require("../config/db"));
const messages_1 = require("../utils/messages");
const tokenDecode_1 = require("../utils/tokenDecode");
/**
 * Add a new reservation.
 * @route POST /api/reservations/add
 * @group Showtime
 * @param {number} showtime_id.body.required - ID of the showtime
 * @param {number} seat_number.body.required - Number of the seat
 * @returns {object} 200 - Showtime added successfully
 * @returns {object} 400 - Bad request
 * @returns {object} 409 - Conflict, showtime date conflict
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
const addReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { showtime_id, seat_number } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    // Validación del token de autorización
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
        const user_id = decoded.id;
        // Validación de los parámetros requeridos
        if (!showtime_id || !seat_number) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }
        // Verificación del espectáculo
        const checkShowtimeQuery = 'SELECT COUNT(*) as count FROM showtimes WHERE id = ?';
        const [showtimeCheckRows] = yield db_1.default.promise().query(checkShowtimeQuery, [showtime_id]);
        if (showtimeCheckRows[0].count <= 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El espectáculo no existe', endpoint);
        }
        const getShowtimeEndQuery = 'SELECT room_id, showtime_init, showtime_end, available_seats FROM showtimes WHERE id = ?';
        const [showtimeRows] = yield db_1.default.promise().query(getShowtimeEndQuery, [showtime_id]);
        const reservation_date = Math.floor(new Date().getTime() / 1000); // Timestamp actual
        const showtime_init = showtimeRows[0].showtime_init;
        const showtime_end = showtimeRows[0].showtime_end;
        const available_seats = showtimeRows[0].available_seats;
        const showtimeToCompare = ((showtime_end - showtime_init) / 2) + showtime_init;
        // Si la película ya va por la mitad que no se pueda hacer la reserva
        if (reservation_date >= showtimeToCompare) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'La película ya está muy empezada', endpoint);
        }
        // Verificación de que el asiento seleccionado no exceda el rango de la sala
        const getRoomQuery = 'SELECT room_id FROM showtimes WHERE id = ?';
        const [roomRows] = yield db_1.default.promise().query(getRoomQuery, [showtime_id]);
        if (roomRows[0].count > 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El espectáculo no existe', endpoint);
        }
        const getCapacityQuery = 'SELECT capacity FROM rooms WHERE id = ?';
        const [capacityRows] = yield db_1.default.promise().query(getCapacityQuery, [roomRows[0].room_id]);
        if (seat_number > capacityRows[0].capacity || seat_number <= 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El asiento seleccionado está fuera de rango', endpoint);
        }
        // Verificación de que el asiento no esté ocupado
        const getSeatCheckQuery = 'SELECT COUNT(*) as count FROM seats WHERE showtime_id = ? and seat_number = ?';
        const [seatRows] = yield db_1.default.promise().query(getSeatCheckQuery, [showtime_id, seat_number]);
        if (seatRows[0].count > 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El asiento está ocupado', endpoint);
        }
        const insertQuery = 'INSERT INTO seats (showtime_id, seat_number) VALUES (?, ?)';
        const [insertResult] = yield db_1.default.promise().query(insertQuery, [showtime_id, seat_number]);
        if (insertResult.affectedRows <= 0) {
            return (0, messages_1.sendServerError)(res, undefined, ip, 'Error al reservar el asiento', endpoint);
        }
        const selectIdQuery = 'SELECT id FROM seats WHERE showtime_id = ? and seat_number = ?';
        const [idResult] = yield db_1.default.promise().query(selectIdQuery, [showtime_id, seat_number]);
        const seat_id = idResult[0].id;
        // Inserción de la reserva en la base de datos
        const insertReservationQuery = 'INSERT INTO reservations (user_id, showtime_id, seat_id, reservation_date) VALUES (?, ?, ?, ?)';
        const reservationValues = [user_id, showtime_id, seat_id, reservation_date];
        const [result] = yield db_1.default.promise().query(insertReservationQuery, reservationValues);
        if (result.affectedRows > 0) {
            // Actualizar los asientos disponibles en el showtime
            const updateSeatsQuery = 'UPDATE showtimes SET available_seats = ? WHERE id = ?';
            const newAvailableSeats = available_seats - 1;
            yield db_1.default.promise().query(updateSeatsQuery, [newAvailableSeats, showtime_id]);
            return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Reserva hecha correctamente' }, endpoint);
        }
        else {
            return (0, messages_1.sendServerError)(res, undefined, ip, 'Error al añadir el espectáculo', endpoint);
        }
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.addReservation = addReservation;
/**
 * Delete one reservation by ID.
 * @route DELETE /api/reservations/{id}
 * @group Movie
 * @param {number} id.path.required - ID of the reservation to delete
 * @returns {object} 200 - Reservation and seat deleted successfully
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Reservation not found
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
const deleteReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user_id = decoded.id;
        const { id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!id) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'ID de la reserva no proporcionado', endpoint);
        }
        // Verificar que el usuario que está intentando eliminar la reserva es el mismo que la creó
        const checkUserQuery = 'SELECT user_id, seat_id, showtime_id FROM reservations WHERE id = ?';
        const [rows] = yield db_1.default.promise().query(checkUserQuery, [id]);
        if (rows.length === 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'La reserva no existe', endpoint);
        }
        if (user_id != rows[0].user_id) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El usuario que intenta eliminar la reserva no es el mismo que el que hizo la reserva', endpoint);
        }
        const seat_id = rows[0].seat_id;
        const showtime_id = rows[0].showtime_id;
        // Eliminar la reserva
        const deleteReservationQuery = 'DELETE FROM reservations WHERE id = ?';
        const deleteSeatQuery = 'DELETE FROM seats WHERE id = ?';
        db_1.default.query(deleteReservationQuery, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar la reserva:', err);
                return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            if (result.affectedRows === 0) {
                return (0, messages_1.sendBadParam)(res, undefined, ip, 'No se encontró la reserva para eliminar', endpoint);
            }
            // Eliminar el asiento
            db_1.default.query(deleteSeatQuery, [seat_id], (err, result) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    console.error('Error al eliminar el asiento:', err);
                    return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en la base de datos', endpoint);
                }
                if (result.affectedRows === 0) {
                    return (0, messages_1.sendBadParam)(res, undefined, ip, 'No se encontró el asiento para eliminar', endpoint);
                }
                // Incrementar los asientos disponibles del showtime
                const getAvailableSeatsQuery = 'SELECT available_seats FROM showtimes WHERE id = ?';
                const [showtimeRows] = yield db_1.default.promise().query(getAvailableSeatsQuery, [showtime_id]);
                if (showtimeRows.length > 0) {
                    const available_seats = showtimeRows[0].available_seats + 1;
                    const updateSeatsQuery = 'UPDATE showtimes SET available_seats = ? WHERE id = ?';
                    yield db_1.default.promise().query(updateSeatsQuery, [available_seats, showtime_id]);
                    return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Reserva y asiento eliminados correctamente. Se actualizó el número de asientos disponibles.' }, endpoint);
                }
                else {
                    return (0, messages_1.sendServerError)(res, undefined, ip, 'No se pudo encontrar el showtime para actualizar los asientos', endpoint);
                }
            }));
        });
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.deleteReservation = deleteReservation;
/**
 * Edit one reservation by ID.
 * @route PATCH /api/reservations/{id}
 * @group Reservation
 * @param {number} id.path.required - ID of the reservation to be edited
 * @param {number} seat_number.body.required - Number of the new seat
 * @returns {object} 200 - Reservation edited successfully
 * @returns {object} 400 - Bad request, invalid input data
 * @returns {object} 409 - Conflict, seat already in use
 * @returns {object} 401 - Unauthorized, token not provided or invalid
 * @returns {object} 404 - Reservation not found
 * @returns {object} 500 - Internal server error
 * @security Bearer token
 */
const editReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { seat_number } = req.body;
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
        const user_id = decoded.id;
        const { id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!id) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'ID de la reserva no proporcionado', endpoint);
        }
        //Verificar que el usuario que está intentando editar la reserva es el mismo que la creó
        const checkUserQuery = 'SELECT user_id, showtime_id, seat_id FROM reservations WHERE id = ?';
        const [rows] = yield db_1.default.promise().query(checkUserQuery, [id]);
        if (rows.length === 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'La reserva no existe', endpoint);
        }
        if (user_id != rows[0].user_id) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El usuario que intenta editar la reserva no es el mismo que el que hizo la reserva', endpoint);
        }
        // Verificación de que el asiento no esté ocupado
        const showtime_id = rows[0].showtime_id;
        const getSeatCheckQuery = 'SELECT COUNT(*) as count FROM seats WHERE showtime_id = ? and seat_number = ?';
        const [seatRows] = yield db_1.default.promise().query(getSeatCheckQuery, [showtime_id, seat_number]);
        if (seatRows[0].count > 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El asiento está ocupado', endpoint);
        }
        //Actualizar el asiento
        const seat_id = rows[0].seat_id;
        const deleteSeatQuery = 'UPDATE seats SET seat_number = ? WHERE id = ?';
        db_1.default.query(deleteSeatQuery, [seat_number, seat_id], (err, result) => {
            if (err) {
                console.error('Error al editar el asiento:', err);
                return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            if (result.affectedRows === 0) {
                return (0, messages_1.sendBadParam)(res, undefined, ip, 'No se encontró el asiento para editar', endpoint);
            }
            return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Asiento editado correctamente' }, endpoint);
        });
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.editReservation = editReservation;
//get reservas de un usuario
