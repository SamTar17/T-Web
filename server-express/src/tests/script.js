        // Variabili globali per il test client
        let socket = null;
        let isConnected = false;
        let messageCounter = 0;

        // Funzione per aggiungere log con timestamp e colori
        function addLog(message, type = 'info') {
            const logArea = document.getElementById('logArea');
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${type}`;
            logEntry.innerHTML = `[${timestamp}] ${message}`;
            logArea.appendChild(logEntry);
            logArea.scrollTop = logArea.scrollHeight; // Auto scroll to bottom
        }

        // Funzione per aggiornare lo stato UI
        function updateConnectionUI(connected) {
            const statusPanel = document.getElementById('statusPanel');
            const statusText = document.getElementById('connectionStatus');
            const statusBadge = document.getElementById('statusBadge');
            const socketIdSpan = document.getElementById('socketId');
            
            // Aggiorna classi CSS e testi
            if (connected) {
                statusPanel.className = 'status-panel status-connected';
                statusText.textContent = 'Connesso';
                statusBadge.textContent = 'ONLINE';
                statusBadge.className = 'badge badge-success';
                socketIdSpan.textContent = socket ? socket.id : 'N/A';
            } else {
                statusPanel.className = 'status-panel status-disconnected';
                statusText.textContent = 'Disconnesso';
                statusBadge.textContent = 'OFFLINE';
                statusBadge.className = 'badge badge-danger';
                socketIdSpan.textContent = 'N/A';
            }
            
            // Abilita/disabilita pulsanti
            document.getElementById('connectBtn').disabled = connected;
            document.getElementById('disconnectBtn').disabled = !connected;
            document.getElementById('createRoomBtn').disabled = !connected;
            document.getElementById('joinRoomBtn').disabled = !connected;
            document.getElementById('sendMessageBtn').disabled = !connected;
        }

        // Connessione al server Socket.io
        function connectToServer() {
            addLog('🔌 Tentativo di connessione al server...', 'info');
            
            try {
                // Creiamo la connessione Socket.io
                socket = io('http://localhost:5000', {
                    transports: ['websocket', 'polling'], // Fallback per debugging
                    timeout: 5000, reconnection: false,
                });

                // Event listener per connessione riuscita
                socket.on('connect', () => {
                    isConnected = true;
                    addLog(`✅ Connessione stabilita! Socket ID: ${socket.id}`, 'success');
                    updateConnectionUI(true);
                });

                // Event listener per messaggio di benvenuto dal server
                socket.on('welcome', (data) => {
                    addLog(`🎉 Messaggio di benvenuto ricevuto: ${data.message}`, 'success');
                    addLog(`📊 Client ID assegnato: ${data.clientId}`, 'info');
                });

                // Event listener per disconnessione
                socket.on('disconnect', (reason) => {
                    isConnected = false;
                    addLog(`❌ Disconnessione: ${reason}`, 'error');
                    updateConnectionUI(false);
                });

                // Event listener per errori di connessione
                socket.on('connect_error', (error) => {
                    addLog(`🚨 Errore di connessione: ${error.message}`, 'error');
                    updateConnectionUI(false);
                });

                // Event listeners per la chat
                setupChatEventListeners();

            } catch (error) {
                addLog(`🚨 Errore durante inizializzazione: ${error.message}`, 'error');
            }
        }

        // Setup degli event listeners per la chat
        function setupChatEventListeners() {
            // Risultato creazione room
            socket.on('room_creation_result', (data) => {
                if (data.success) {
                    addLog(`🏠 Room "${data.roomName}" creata con successo!`, 'success');
                    addLog(`📝 Topic: ${data.topic}`, 'info');
                } else {
                    addLog(`❌ Errore creazione room: ${data.message}`, 'error');
                }
            });

            // Conferma join room
            socket.on('room_joined', (data) => {
                addLog(`🚪 Entrato nella room: ${data.roomName}`, 'success');
            });

            // Notifica di nuovo utente nella room
            socket.on('user_joined', (data) => {
                addLog(`👤 ${data.userName} è entrato nella room ${data.roomName}`, 'info');
            });

            // Ricezione messaggi
            socket.on('room_message_received', (data) => {
                addLog(`💬 [${data.roomName}] ${data.userName}: ${data.message}`, 'success');
                addLog(`🆔 Message ID: ${data.messageId}`, 'info');
            });

            // Gestione errori generici
            socket.on('error', (data) => {
                addLog(`⚠️ Errore dal server: ${data.message}`, 'error');
            });
        }

        // Disconnessione dal server
        function disconnectFromServer() {
            if (socket) {
                addLog('🔌 Disconnessione in corso...', 'warning');
                socket.disconnect();
                socket = null;
                isConnected = false;
                updateConnectionUI(false);
            }
        }

        // Creazione room
        function createRoom() {
            if (!isConnected) {
                addLog('❌ Non connesso al server!', 'error');
                return;
            }

            const roomName = document.getElementById('createRoomName').value.trim();
            const userName = document.getElementById('createUserName').value.trim();
            const topic = document.getElementById('roomTopic').value.trim();

            if (!roomName || !userName) {
                addLog('❌ Nome room e username sono obbligatori!', 'error');
                return;
            }

            addLog(`🏠 Creando room "${roomName}" come utente "${userName}"...`, 'info');
            
            const roomData = {
                roomName: roomName,
                userName: userName,
                topic: topic || 'Chat generica'
            };

            socket.emit('create_room', roomData);
        }

        // Join room esistente
        function joinRoom() {
            if (!isConnected) {
                addLog('❌ Non connesso al server!', 'error');
                return;
            }

            const roomName = document.getElementById('joinRoomName').value.trim();
            const userName = document.getElementById('joinUserName').value.trim();

            if (!roomName || !userName) {
                addLog('❌ Nome room e username sono obbligatori!', 'error');
                return;
            }

            addLog(`🚪 Entrando nella room "${roomName}" come "${userName}"...`, 'info');
            
            const joinData = {
                roomName: roomName,
                userName: userName
            };

            socket.emit('join_room', joinData);
        }

        // Invio messaggio
        function sendMessage() {
            if (!isConnected) {
                addLog('❌ Non connesso al server!', 'error');
                return;
            }

            const roomName = document.getElementById('messageRoomName').value.trim();
            const userName = document.getElementById('messageUserName').value.trim();
            const message = document.getElementById('messageText').value.trim();

            if (!roomName || !userName || !message) {
                addLog('❌ Tutti i campi sono obbligatori per inviare un messaggio!', 'error');
                return;
            }

            messageCounter++;
            addLog(`📤 Inviando messaggio #${messageCounter} a "${roomName}"...`, 'info');
            
            const messageData = {
                roomName: roomName,
                userName: userName,
                message: message
            };

            socket.emit('room_message', messageData);
        }

        // Invio messaggi di test automatici
        function sendTestMessages() {
            const testMessages = [
                "Questo è un messaggio di test automatico",
                "Sto testando il sistema di chat real-time",
                "I messaggi dovrebbero apparire in tempo reale",
                "Test completato con successo! 🎉"
            ];

            testMessages.forEach((msg, index) => {
                setTimeout(() => {
                    document.getElementById('messageText').value = msg;
                    sendMessage();
                }, index * 1000);
            });
        }

        // Utility functions
        function clearLog() {
            document.getElementById('logArea').innerHTML = '';
            addLog('🗑️ Log pulito - client pronto per nuovi test', 'info');
        }

        function exportLog() {
            const logContent = document.getElementById('logArea').textContent;
            const blob = new Blob([logContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-test-log-${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
            addLog('💾 Log esportato con successo', 'success');
        }

        // Inizializzazione UI
        document.addEventListener('DOMContentLoaded', () => {
            updateConnectionUI(false);
            addLog('🚀 Client di test caricato e pronto all\'uso', 'success');
            addLog('📋 Per iniziare: clicca su "Connetti al Server"', 'info');
        });