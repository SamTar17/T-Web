function errorHandler (err,req,res,next) {
    console.error('errore:');
    console.error('url:', req.method, req.originalUrl);
    console.error('time:', new Date().toISOString());
    console.error('details:', err.message);
    console.error('stack trace:', err.stack);

    let statusCode = 500; // inizializzo uno status generale per errori lato server
    let message = 'Errore lato server';

    if (err.code == 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Servizi esterni non disponibili'
    } else if (err.name == 'ValidationError') {
        statusCode = 400;
        message = 'Invalid data'
    } else if (err.status) { // errori personalizzati
        statusCode= err.status;
        message = err.message;
    }
    // impostiamo la response del middleware 

    res.status(statusCode).json({
        error: true,
        message:message,
        timestamp: new Date().toISOString,
        path: res.originalUrl,

        ...(process.env.NODE_ENV === 'development' && {
            details:err.message,
            stack:err.stack
        })
    });
}

module.exports = errorHandler;