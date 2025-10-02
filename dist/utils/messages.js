"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendServerError = exports.sendConflict = exports.sendNotFound = exports.sendForbidden = exports.sendUnauthorized = exports.sendBadParam = exports.sendOk = void 0;
// Envía una respuesta exitosa
const sendOk = (res, correlator, ip, message = "OK", endpoint = "", code = 200) => {
    res.status(code).json(message);
};
exports.sendOk = sendOk;
// Envía una respuesta con parámetro incorrecto
const sendBadParam = (res, correlator, ip, message = 'Bad parameter', endpoint = '', code = 400) => {
    res.status(code).json({ message });
};
exports.sendBadParam = sendBadParam;
// Envía una respuesta no autorizada
const sendUnauthorized = (res, correlator, ip, message = 'Unauthorized', endpoint = '', code = 401) => {
    res.status(code).json({ message });
};
exports.sendUnauthorized = sendUnauthorized;
// Envía una respuesta prohibida
const sendForbidden = (res, correlator, ip, message = 'Forbidden', endpoint = '', code = 403) => {
    res.status(code).json({ message });
};
exports.sendForbidden = sendForbidden;
// Envía una respuesta no encontrada
const sendNotFound = (res, correlator, ip, message = 'Not found', endpoint = '', code = 404) => {
    res.status(code).json({ message });
};
exports.sendNotFound = sendNotFound;
// Envía una respuesta de conflicto
const sendConflict = (res, correlator, ip, message = 'Conflict', endpoint = '', code = 409) => {
    res.status(code).json({ message });
};
exports.sendConflict = sendConflict;
// Envía una respuesta de error del servidor
const sendServerError = (res, correlator, ip, message = 'Internal server error', endpoint = '', code = 500) => {
    res.status(code).json({ message });
};
exports.sendServerError = sendServerError;
