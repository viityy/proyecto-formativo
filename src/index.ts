import express from 'express';
import userRoutes from './routes/userRoutes';
import movieRoutes from './routes/movieRoutes';
import loggerMiddleware from './middleware/loggerMiddleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(loggerMiddleware); // Middleware para registrar solicitudes

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
