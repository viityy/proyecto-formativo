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
exports.getShowtimeSeats = void 0;
const db_1 = __importDefault(require("../config/db"));
const messages_1 = require("../utils/messages");
const tokenDecode_1 = require("../utils/tokenDecode");
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
const getShowtimeSeats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { showtime_id } = req.params; // Extraer el ID de los parámetros de la ruta
        if (!showtime_id) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'ID del espectáculo no proporcionado', endpoint);
        }
        //Verificar si el showtime existe
        const checkShowtimeQuery = 'SELECT * FROM showtimes WHERE id = ?';
        const [showtimeRows] = yield db_1.default.promise().query(checkShowtimeQuery, [showtime_id]);
        if (showtimeRows.length === 0) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'No existe el espectáculo', endpoint);
        }
        const getShowtimeSeatsQuery = 'SELECT id, seat_number FROM seats WHERE showtime_id = ?';
        const [rows] = yield db_1.default.promise().query(getShowtimeSeatsQuery, [showtime_id]);
        return (0, messages_1.sendOk)(res, undefined, ip, { seats: rows }, endpoint);
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.getShowtimeSeats = getShowtimeSeats;
