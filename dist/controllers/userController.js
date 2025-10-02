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
exports.changePassword = exports.loginUser = exports.addUser = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const messages_1 = require("../utils/messages");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
/**
 * Add a new user.
 * @route POST /api/users/add
 * @group User
 * @param {string} username.body.required - User's username
 * @param {string} password.body.required - User's password
 * @param {string} email.body.required - User's email
 * @param {string} role.body.required - Type of the user
 * @returns {object} 200 - User added successfully
 * @returns {object} 400 - Bad request
 * @returns {object} 409 - Conflict, username already exists
 * @returns {object} 500 - Internal server error
 */
const addUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email, role } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (!username || !password || !email || !role) {
        return (0, messages_1.sendBadParam)(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
    }
    try {
        const [usernameRows] = yield db_1.default.promise().query('SELECT COUNT(*) as count FROM users WHERE username = ?', [username]);
        if (usernameRows[0].count > 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El nombre de usuario ya está en uso', endpoint);
        }
        const [emailRows] = yield db_1.default.promise().query('SELECT COUNT(*) as count FROM users WHERE email = ?', [email]);
        if (emailRows[0].count > 0) {
            return (0, messages_1.sendConflict)(res, undefined, ip, 'El email ya está en uso', endpoint);
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const created_at = Math.floor(Date.now() / 1000);
        const query = 'INSERT INTO users (username, password, email, role, created_at) VALUES (?, ?, ?, ?, ?)';
        yield db_1.default.promise().query(query, [username, hashedPassword, email, role, created_at]);
        return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Usuario añadido correctamente' }, endpoint);
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.addUser = addUser;
/**
 * Login a user.
 * @route POST /api/users/login
 * @group User
 * @param {string} username.body.required - User's username
 * @param {string} password.body.required - User's password
 * @returns {object} 200 - Login successful with token
 * @returns {object} 400 - Bad request
 * @returns {object} 401 - Unauthorized
 * @returns {object} 500 - Internal server error
 */
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (!username || !password) {
        return (0, messages_1.sendBadParam)(res, undefined, ip, 'Username y password son obligatorios', endpoint);
    }
    try {
        const [results] = yield db_1.default.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length === 0) {
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Usuario no encontrado', endpoint);
        }
        const user = results[0];
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Contraseña incorrecta', endpoint);
        }
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined. Please set it in your environment variables.');
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Inicio de sesión exitoso', token }, endpoint);
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.loginUser = loginUser;
/**
 * Change the password for a user.
 * @route PATCH /api/users/changepassword
 * @group User
 * @param {string} username.body.required - User's username
 * @param {string} oldPassword.body.required - User's oldPassword
 * @param {string} newPassword.body.required - User's newPassword
 * @returns {object} 200 - Password updated successfully
 * @returns {object} 400 - Bad request
 * @returns {object} 401 - Unauthorized, incorrect username or old password
 * @returns {object} 500 - Internal server error
 */
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, oldPassword, newPassword } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (!username || !oldPassword || !newPassword) {
        return (0, messages_1.sendBadParam)(res, undefined, ip, 'Username, oldPassword y newPassword son obligatorios', endpoint);
    }
    try {
        const [results] = yield db_1.default.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length === 0) {
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Usuario no encontrado', endpoint);
        }
        const user = results[0];
        const isMatch = yield bcrypt_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            return (0, messages_1.sendUnauthorized)(res, undefined, ip, 'Contraseña incorrecta', endpoint);
        }
        const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, 10);
        const updateQuery = 'UPDATE users SET password = ? WHERE username = ?';
        const [updateResult] = yield db_1.default.promise().query(updateQuery, [hashedNewPassword, username]);
        if (updateResult.affectedRows === 0) {
            return (0, messages_1.sendServerError)(res, undefined, ip, 'No se pudo actualizar la contraseña', endpoint);
        }
        return (0, messages_1.sendOk)(res, undefined, ip, { message: 'Contraseña actualizada correctamente' }, endpoint);
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return (0, messages_1.sendServerError)(res, undefined, ip, 'Error en el servidor', endpoint);
    }
});
exports.changePassword = changePassword;
