import { Response } from 'express';

// Envía una respuesta exitosa
export const sendOk = (res: Response, correlator?: string, ip?: string, message = 'OK', endpoint = '', code = 200): void => {
  //console.log(correlator)
  //console.log(ip)
  //console.log(endpoint)
  res.status(code).json({ message });
};

// Envía una respuesta con parámetro incorrecto
export const sendBadParam = (res: Response, correlator?: string, ip?: string, message = 'Bad parameter', endpoint = '', code = 400): void => {
  res.status(code).json({ message });
};

// Envía una respuesta no autorizada
export const sendUnauthorized = (res: Response, correlator?: string, ip?: string, message = 'Unauthorized', endpoint = '', code = 401): void => {
  res.status(code).json({ message });
};

// Envía una respuesta prohibida
export const sendForbidden = (res: Response, correlator?: string, ip?: string, message = 'Forbidden', endpoint = '', code = 403): void => {
  res.status(code).json({ message });
};

// Envía una respuesta no encontrada
export const sendNotFound = (res: Response, correlator?: string, ip?: string, message = 'Not found', endpoint = '', code = 404): void => {
  res.status(code).json({ message });
};

// Envía una respuesta de conflicto
export const sendConflict = (res: Response, correlator?: string, ip?: string, message = 'Conflict', endpoint = '', code = 409): void => {
  res.status(code).json({ message });
};

// Envía una respuesta de error del servidor
export const sendServerError = (res: Response, correlator?: string, ip?: string, message = 'Internal server error', endpoint = '', code = 500): void => {
  res.status(code).json({ message });
};
