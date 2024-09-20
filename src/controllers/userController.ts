import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendOk, sendBadParam, sendUnauthorized, sendServerError, sendConflict } from '../utils/messages';

/**
 * Add a new user.
 * @route POST /api/users/add
 * @group User
 * @param {string} name.body.required - User's name
 * @param {string} surname.body.required - User's surname
 * @param {string} username.body.required - User's username
 * @param {string} password.body.required - User's password
 * @param {string} email.body.required - User's email
 * @param {string} user_type.body.required - Type of the user
 * @returns {object} 201 - User added successfully
 * @returns {object} 400 - Bad request
 * @returns {object} 409 - Conflict, username already exists
 * @returns {object} 500 - Internal server error
 */
export const addUser = async (req: Request, res: Response) => {
    const { name, surname, username, password, email, user_type } = req.body;
    const endpoint = `${req.method} ${req.url}`; //Dato solo para los logs
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || ''; //Dato solo para los logs

    if (!name || !surname || !username || !password || !email || !user_type) {
        sendBadParam(res, undefined, ip, 'Todos los campos son obligatorios', endpoint);
        return;
    }

    try {
        // Verificar si el username ya existe
        const checkUserQuery = 'SELECT COUNT(*) as count FROM user WHERE username = ?';
        const [rows] = await db.promise().query<RowDataPacket[]>(checkUserQuery, [username]);

        if (rows[0].count > 0) {
            // Si el username ya existe, enviar una respuesta de conflicto
            sendConflict(res, undefined, ip, 'El nombre de usuario ya está en uso', endpoint);
            return;
        }

        // Si el username no existe, proceder a crear el usuario
        const hashedPassword = await bcrypt.hash(password, 10);
        const creation_date = Math.floor(new Date().getTime() / 1000);

        const query = 'INSERT INTO user (name, surname, username, password, email, user_type, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [name, surname, username, hashedPassword, email, user_type, creation_date];

        db.query<ResultSetHeader>(query, values, (err, result) => {
            if (err) {
                console.error('Error al insertar el usuario:', err);
                sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
                return;
            }
            sendOk(res, undefined, ip, 'Usuario añadido correctamente', endpoint);
        });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};


/**
 * Login a user.
 * @route POST /api/users/login
 * @group User
 * @param {string} username.body.required - User's username
 * @param {string} password.body.required - User's password
 * @returns {object} 200 - Login successful
 * @returns {object} 400 - Bad request
 * @returns {object} 401 - Unauthorized
 * @returns {object} 500 - Internal server error
 */
export const loginUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const endpoint = `${req.method} ${req.url}`;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    if (!username || !password) {
        sendBadParam(res, undefined, ip, 'Username y password son obligatorios', endpoint);
        return;
    }

    try {
        const query = 'SELECT * FROM user WHERE username = ?';
        db.query<RowDataPacket[]>(query, [username], async (err, results) => {
            if (err) {
                console.error('Error al buscar el usuario:', err);
                sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
                return;
            }

            if (results.length === 0) {
                sendUnauthorized(res, undefined, ip, 'Usuario no encontrado', endpoint);
                return;
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                sendUnauthorized(res, undefined, ip, 'Contraseña incorrecta', endpoint);
                return;
            }

            sendOk(res, undefined, ip, 'Inicio de sesión exitoso', endpoint);
        });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
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
        sendBadParam(res, undefined, ip, 'Username, oldPassword y newPassword son obligatorios', endpoint);
        return;
    }

    try {
        // Verificar si el usuario existe
        const query = 'SELECT * FROM user WHERE username = ?';
        db.query<RowDataPacket[]>(query, [username], async (err, results) => {
            if (err) {
                console.error('Error al buscar el usuario:', err);
                sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
                return;
            }

            if (results.length === 0) {
                sendUnauthorized(res, undefined, ip, 'Usuario no encontrado', endpoint);
                return;
            }

            const user = results[0];
            // Verificar si la contraseña antigua es correcta
            const isMatch = await bcrypt.compare(oldPassword, user.password);

            if (!isMatch) {
                sendUnauthorized(res, undefined, ip, 'Contraseña incorrecta', endpoint);
                return;
            }

            // Encriptar la nueva contraseña
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar la contraseña en la base de datos
            const updateQuery = 'UPDATE user SET password = ? WHERE username = ?';
            db.query<ResultSetHeader>(updateQuery, [hashedNewPassword, username], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Error al actualizar la contraseña:', updateErr);
                    sendServerError(res, undefined, ip, 'Error en la base de datos', endpoint);
                    return;
                }

                if (updateResult.affectedRows === 0) {
                    sendServerError(res, undefined, ip, 'No se pudo actualizar la contraseña', endpoint);
                    return;
                }

                // Responder con éxito
                sendOk(res, undefined, ip, 'Contraseña actualizada correctamente', endpoint);
            });
        });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        sendServerError(res, undefined, ip, 'Error en el servidor', endpoint);
    }
};
