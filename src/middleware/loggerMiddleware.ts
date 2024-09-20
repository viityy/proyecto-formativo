import { Request, Response, NextFunction } from 'express';

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const { method, url, headers, body } = req;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    
    // Capturamos cuando la respuesta termina para obtener el código de estado
    res.on('finish', () => {
        const statusCode = res.statusCode;
        console.log(`Method: ${method} | URL: ${url} | Status Code: ${statusCode} | IP Address: ${ip}`);
    });

    //console.log('Headers:', headers);
    //console.log('Body:', body);

    next();
};

export default loggerMiddleware;
