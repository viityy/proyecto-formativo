import dotenv from 'dotenv';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendOk, sendBadParam, sendUnauthorized, sendServerError, sendConflict } from '../utils/messages';
import jwt from 'jsonwebtoken';

dotenv.config();

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
export const addUser = async (req: Request, res: Response) => {
    const { username, password, email, role } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    if (!username || !password || !email || !role) {
        return sendBadParam(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
    }

    try {
        const [usernameRows] = await db.promise().query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE username = ?', [username]);
        if (usernameRows[0].count > 0) {
            return sendConflict(res, undefined, ip, 'El nombre de usuario ya está en uso', endpoint);
        }
        const [emailRows] = await db.promise().query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE email = ?', [email]);
        if (emailRows[0].count > 0) {
            return sendConflict(res, undefined, ip, 'El email ya está en uso', endpoint);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const created_at = Math.floor(Date.now() / 1000);
        const query = 'INSERT INTO users (username, password, email, role, created_at) VALUES (?, ?, ?, ?, ?)';
        await db.promise().query<ResultSetHeader>(query, [username, hashedPassword, email, role, created_at]);

        return sendOk(res, undefined, ip, { message: 'Usuario añadido correctamente' }, endpoint);

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};
 
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
export const loginUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    if (!username || !password) {
        return sendBadParam(res, undefined, ip, 'Username y password son obligatorios', endpoint);
    }

    try {
        const [results] = await db.promise().query<RowDataPacket[]>('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length === 0) {
            return sendUnauthorized(res, undefined, ip, 'Usuario no encontrado', endpoint);
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendUnauthorized(res, undefined, ip, 'Contraseña incorrecta', endpoint);
        }

        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined. Please set it in your environment variables.');
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        return sendOk(res, undefined, ip, { message: 'Inicio de sesión exitoso', token }, endpoint);
        
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};

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
export const changePassword = async (req: Request, res: Response) => {
    const { username, oldPassword, newPassword } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    if (!username || !oldPassword || !newPassword) {
        return sendBadParam(res, undefined, ip, 'Username, oldPassword y newPassword son obligatorios', endpoint);
    }

    try {
        const [results] = await db.promise().query<RowDataPacket[]>('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length === 0) {
            return sendUnauthorized(res, undefined, ip, 'Usuario no encontrado', endpoint);
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return sendUnauthorized(res, undefined, ip, 'Contraseña incorrecta', endpoint);
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = 'UPDATE users SET password = ? WHERE username = ?';
        const [updateResult] = await db.promise().query<ResultSetHeader>(updateQuery, [hashedNewPassword, username]);

        if (updateResult.affectedRows === 0) {
            return sendServerError(res, undefined, ip, 'No se pudo actualizar la contraseña', endpoint);
        }

        return sendOk(res, undefined, ip, { message: 'Contraseña actualizada correctamente' }, endpoint);

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};
