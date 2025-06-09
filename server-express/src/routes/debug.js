// File: routes/debug.js
// Route di debug per monitorare lo stato del ConnectionManager

const express = require('express');
const router = express.Router();

// Variabile globale per accedere al ConnectionManager
// Questa verrà impostata dal tuo app.js
let connectionManager = null;

// Funzione per inizializzare il riferimento al ConnectionManager
function setConnectionManager(manager) {
    connectionManager = manager;
    console.log('🔧 Debug routes: ConnectionManager riferimento impostato');
}

// Endpoint per ottenere statistiche generali
router.get('/stats', (req, res) => {
    if (!connectionManager) {
        return res.status(500).json({ 
            error: 'ConnectionManager non disponibile',
            message: 'Il sistema di debug non è stato inizializzato correttamente'
        });
    }

    try {
        const stats = connectionManager.getStats();
        
        // Aggiungiamo informazioni aggiuntive calcolate
        const detailedStats = {
            ...stats,
            currentConnections: connectionManager.clientsData.size,
            activeRoomsCount: connectionManager.activeRooms.size,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };

        res.json({
            success: true,
            data: detailedStats,
            message: 'Statistiche ConnectionManager recuperate con successo'
        });

    } catch (error) {
        console.error('❌ Errore recupero statistiche:', error.message);
        res.status(500).json({
            error: 'Errore interno del server',
            message: error.message
        });
    }
});

// Endpoint per ottenere lista dettagliata dei client connessi
router.get('/clients', (req, res) => {
    if (!connectionManager) {
        return res.status(500).json({ error: 'ConnectionManager non disponibile' });
    }

    try {
        const clients = [];
        
        // Iteriamo attraverso la Map dei client
        for (const [socketId, clientData] of connectionManager.clientsData.entries()) {
            clients.push({
                socketId: socketId,
                username: clientData.username || 'Non impostato',
                connectedAt: clientData.connectedAt,
                currentRoom: clientData.currentRoom || 'Nessuna room',
                // Calcoliamo da quanto tempo è connesso
                connectionDuration: calculateConnectionDuration(clientData.connectedAt)
            });
        }

        res.json({
            success: true,
            data: {
                totalClients: clients.length,
                clients: clients
            },
            message: `${clients.length} client attualmente connessi`
        });

    } catch (error) {
        console.error('❌ Errore recupero client:', error.message);
        res.status(500).json({
            error: 'Errore interno del server',
            message: error.message
        });
    }
});

// Endpoint per ottenere informazioni sulle room attive
router.get('/rooms', (req, res) => {
    if (!connectionManager) {
        return res.status(500).json({ error: 'ConnectionManager non disponibile' });
    }

    try {
        const rooms = [];
        
        // Iteriamo attraverso la Map delle room
        for (const [roomName, roomData] of connectionManager.activeRooms.entries()) {
            rooms.push({
                roomName: roomName,
                creator: roomData.userNameCreator,
                participants: roomData.userNameList || [],
                participantCount: roomData.userNameList ? roomData.userNameList.length : 0,
                createdAt: roomData.createdAt || 'Data non disponibile'
            });
        }

        res.json({
            success: true,
            data: {
                totalRooms: rooms.length,
                rooms: rooms
            },
            message: `${rooms.length} room attualmente attive`
        });

    } catch (error) {
        console.error('❌ Errore recupero room:', error.message);
        res.status(500).json({
            error: 'Errore interno del server',
            message: error.message
        });
    }
});

// Endpoint per ottenere informazioni su un client specifico
router.get('/client/:socketId', (req, res) => {
    if (!connectionManager) {
        return res.status(500).json({ error: 'ConnectionManager non disponibile' });
    }

    const socketId = req.params.socketId;

    try {
        if (!connectionManager.hasClient(socketId)) {
            return res.status(404).json({
                error: 'Client non trovato',
                message: `Nessun client con Socket ID: ${socketId}`
            });
        }

        const clientData = connectionManager.clientsData.get(socketId);
        
        const detailedClientInfo = {
            socketId: socketId,
            username: clientData.username || 'Non impostato',
            connectedAt: clientData.connectedAt,
            currentRoom: clientData.currentRoom || 'Nessuna room',
            connectionDuration: calculateConnectionDuration(clientData.connectedAt),
            // Aggiungiamo info sulla room se presente
            roomInfo: clientData.currentRoom ? 
                connectionManager.activeRooms.get(clientData.currentRoom) : null
        };

        res.json({
            success: true,
            data: detailedClientInfo,
            message: `Informazioni client ${socketId} recuperate`
        });

    } catch (error) {
        console.error('❌ Errore recupero client specifico:', error.message);
        res.status(500).json({
            error: 'Errore interno del server',
            message: error.message
        });
    }
});

// Endpoint per verificare la coerenza dei dati
router.get('/health-check', (req, res) => {
    if (!connectionManager) {
        return res.status(500).json({ error: 'ConnectionManager non disponibile' });
    }

    try {
        const healthReport = {
            timestamp: new Date().toISOString(),
            checks: {
                connectionManagerActive: !!connectionManager,
                clientsMapExists: !!connectionManager.clientsData,
                roomsMapExists: !!connectionManager.activeRooms,
                statsExists: !!connectionManager.stats
            }
        };

        // Verifichiamo la coerenza dei dati
        let inconsistencies = [];
        
        // Controlliamo se tutti i client nelle room esistono effettivamente
        for (const [roomName, roomData] of connectionManager.activeRooms.entries()) {
            if (roomData.userNameList) {
                for (const username of roomData.userNameList) {
                    let userFound = false;
                    for (const [socketId, clientData] of connectionManager.clientsData.entries()) {
                        if (clientData.username === username && clientData.currentRoom === roomName) {
                            userFound = true;
                            break;
                        }
                    }
                    if (!userFound) {
                        inconsistencies.push(`User ${username} in room ${roomName} ma non trovato nei client connessi`);
                    }
                }
            }
        }

        healthReport.inconsistencies = inconsistencies;
        healthReport.isHealthy = inconsistencies.length === 0;

        const statusCode = healthReport.isHealthy ? 200 : 400;
        res.status(statusCode).json({
            success: healthReport.isHealthy,
            data: healthReport,
            message: healthReport.isHealthy ? 'Sistema in stato sano' : 'Rilevate inconsistenze nei dati'
        });

    } catch (error) {
        console.error('❌ Errore health check:', error.message);
        res.status(500).json({
            error: 'Errore durante health check',
            message: error.message
        });
    }
});

// Endpoint per pulire dati inconsistenti (utile per debugging)
router.post('/cleanup', (req, res) => {
    if (!connectionManager) {
        return res.status(500).json({ error: 'ConnectionManager non disponibile' });
    }

    try {
        let cleanupReport = {
            clientsRemoved: 0,
            roomsRemoved: 0,
            timestamp: new Date().toISOString()
        };

        // Qui potresti implementare logica di cleanup
        // Per ora restituiamo solo un report
        
        res.json({
            success: true,
            data: cleanupReport,
            message: 'Cleanup completato'
        });

    } catch (error) {
        console.error('❌ Errore cleanup:', error.message);
        res.status(500).json({
            error: 'Errore durante cleanup',
            message: error.message
        });
    }
});

// Funzione helper per calcolare durata connessione
function calculateConnectionDuration(connectedAt) {
    if (!connectedAt) return 'Durata sconosciuta';
    
    const connectionTime = new Date(connectedAt);
    const now = new Date();
    const durationMs = now - connectionTime;
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
}

module.exports = {
    router,
    setConnectionManager
};