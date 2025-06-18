function standardErrorHandler(err, req, res, next) {
    let statusCode = 500;
    let userMessage = 'Si è verificato un errore interno del server';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let additionalDetails = err?.additionalDetails;
    let logLevel = 'error';

    if (err.name === 'ValidationError' || err.code?.startsWith('VALIDATION_')) {

        statusCode = 400;
        userMessage = err.message;
        errorCode = err.code || 'VALIDATION_ERROR';
        logLevel = 'warn'; 
        
    }

    else if (err.code === 'ECONNREFUSED' || err.code?.includes('SERVICE_UNAVAILABLE')) {
        // Errori di servizi esterni: problemi con microservizi o database

        statusCode = 503;
        userMessage = 'Il servizio è temporaneamente non disponibile.';
        errorCode = err.code || 'SERVICE_UNAVAILABLE';
        logLevel = 'error'; 
        
    }


    else if (err.status === 404 || err.code?.includes('NOT_FOUND')) {
        // Risorsa non trovata: l'ID richiesto non esiste
        statusCode = 404;
        userMessage = err.message || 'La risorsa richiesta non è stata trovata.';
        errorCode = err.code || 'RESOURCE_NOT_FOUND';
        logLevel = 'info';
    }
    else if (err.status && err.status >= 400 && err.status < 500) {
        // Altri errori client: mantieni il status code originale se ragionevole
        statusCode = err.status;
        userMessage = err.message || 'Errore nella richiesta';
        errorCode = err.code || 'CLIENT_ERROR';
        logLevel = 'warn';
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        level: logLevel,
        errorCode: errorCode,
        message: err.message,
        statusCode: statusCode,
        request: {
            method: req.method,
            url: req.originalUrl,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        },
        error: {
            name: err.name,
            code: err.code,
            stack: err.stack?.split('\n')
        },
        additionalDetails: {...additionalDetails}
    };

    if (logLevel === 'error') {
        console.error('CRITICAL ERROR:', JSON.stringify(logEntry, null, 2));
    } else if (logLevel === 'warn') {
        console.warn('WARNING:', JSON.stringify(logEntry, null, 2));
    } else {
        console.info('INFO:', JSON.stringify(logEntry, null, 2));
    }

    const response = {
        success: false,
        error: {
            message: userMessage,
            code: errorCode,
            statusCode: statusCode
        },
        metadata: {
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        },
        additionalDetails: {...additionalDetails}
    };

    if (process.env.NODE_ENV === 'development') {
        response.debug = {
            originalMessage: err.message,
            errorName: err.name,
            stack: err.stack?.split('\n').slice(0, 10) // Limita lo stack trace per leggibilità
        };
    }

    // Invio della risposta al client
    res.status(statusCode).json(response);
}

module.exports = standardErrorHandler;