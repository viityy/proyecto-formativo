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
exports.addRoom = void 0;
const db_1 = __importDefault(require("../config/db"));
const messages_1 = require("../utils/messages");
const tokenDecode_1 = require("../utils/tokenDecode");
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
const addRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, capacity } = req.body;
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
                return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Solo los usuarios admin pueden añadir salas', endpoint);
            }
        }
        else {
            console.error('Decodificación fallida, no es un objeto válido.');
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Token inválido', endpoint);
        }
        if (!name || !capacity) {
            return (0, messages_1.sendBadParam)(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        }
        const checkRoomQuery = 'SELECT COUNT(*) as count FROM rooms WHERE name = ?';
        const [rows] = yield db_1.default.promise().query(checkRoomQuery, [name]);
        if (rows[0].count > 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'La sala ya existe', endpoint);
        }
        const created_at = Math.floor(new Date().getTime() / 1000);
        const query = 'INSERT INTO rooms (name, capacity, created_at) VALUES (?, ?, ?)';
        const values = [name, capacity, created_at];
        db_1.default.query(query, values, (err) => {
            if (err) {
                console.error('Error al insertar la sala:', err);
                return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en la base de datos', endpoint);
            }
            return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Sala añadida correctamente' }, endpoint);
        });
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.addRoom = addRoom;
