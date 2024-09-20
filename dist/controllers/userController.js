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
exports.loginUser = exports.addUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db")); // Asegúrate de que la ruta sea correcta
const addUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, surname, username, password, email, user_type } = req.body;
    if (!name || !surname || !username || !password || !email || !user_type) {
        return res.status(400).send({ error: 'Todos los campos son obligatorios' });
    }
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const creation_date = Math.floor(new Date().getTime() / 1000);
        const query = 'INSERT INTO user (name, surname, username, password, email, user_type, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [name, surname, username, hashedPassword, email, user_type, creation_date];
        db_1.default.query(query, values, (err, result) => {
            if (err) {
                console.error('Error al insertar el usuario:', err);
                return res.status(500).send({ error: 'Error en la base de datos' });
            }
            res.status(201).send({ message: 'Usuario añadido correctamente', userId: result.insertId });
        });
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send({ error: 'Error en el servidor' });
    }
});
exports.addUser = addUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send({ error: 'Username y password son obligatorios' });
    }
    try {
        const query = 'SELECT * FROM user WHERE username = ?';
        db_1.default.query(query, [username], (err, results) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error('Error al buscar el usuario:', err);
                return res.status(500).send({ error: 'Error en la base de datos' });
            }
            // Verifica si 'results' es un array y contiene al menos un elemento
            if (results.length === 0) {
                return res.status(401).send({ error: 'Usuario no encontrado' });
            }
            const user = results[0]; // 'results' es un array de objetos
            const isMatch = yield bcrypt_1.default.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).send({ error: 'Contraseña incorrecta' });
            }
            res.status(200).send({ message: 'Inicio de sesión exitoso' });
        }));
    }
    catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send({ error: 'Error en el servidor' });
    }
});
exports.loginUser = loginUser;
