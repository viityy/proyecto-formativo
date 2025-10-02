"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const movieRoutes_1 = __importDefault(require("./routes/movieRoutes"));
const showtimeRoutes_1 = __importDefault(require("./routes/showtimeRoutes"));
const reservationRoutes_1 = __importDefault(require("./routes/reservationRoutes"));
const seatRoutes_1 = __importDefault(require("./routes/seatRoutes"));
const roomRoutes_1 = __importDefault(require("./routes/roomRoutes"));
const loggerMiddleware_1 = __importDefault(require("./middleware/loggerMiddleware"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
app.use(loggerMiddleware_1.default); // Middleware para registrar solicitudes
// Rutas
app.use('/api/users', userRoutes_1.default);
app.use('/api/movies', movieRoutes_1.default);
app.use('/api/showtimes', showtimeRoutes_1.default);
app.use('/api/reservations', reservationRoutes_1.default);
app.use('/api/seats', seatRoutes_1.default);
app.use('/api/rooms', roomRoutes_1.default);
// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
