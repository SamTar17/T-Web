let socket = null;
let currentRoom = null
let currentUser = null


//funzioni connessione al server 

function connectToServer(){

    if (socket){
        return
    }
    console.log('connettendomi...')
    //provo la connesione al server
    socket = io('http://localhost:3000',{
        reconnection: false
    });
    console.log(socket)
    socket.on('connect', () => {
        console.log(`Connesso al server con id ${socket.id}`)
        updateStatus('connected', 'connesso')
        //setuppo tutti gli eventi una volta che sono connesso al server
        setupRoomEvents()
    });

    socket.on('connect_error', (error) => {
        console.log('Errore di connessione:', error.message);
        updateStatus('disconnected', 'impossibile connettersi');
        //rinizializzo socket per dare la possibilità di ritentare la connesione 
        socket = null;
    });

    socket.on('disconnect', () => {
        console.log(`-------disconnessione-----`)
        updateStatus('disconnected','disconnesso')
        socket=null 
    });


    //ascoltiamo l'evento del server!
    socket.on('welcome', (data) => {
        console.log('messaggio ricevuto dal server', data)
        addMessage('Server', data.message)
    });
}

function disconnectFromServer() {
    if (socket) {
        socket.disconnect();
        console.log('+++ disconnessione volontaria +++')
        updateStatus('disconnected','disconnesso!')
    }
}
//setup eventi stanza

function setupRoomEvents() {

    socket.on('room_joined', (data) => {
        console.log('Sei entrato in stanza:', data.roomName);
        addMessage('Sistema', data.message)
    })

    socket.on('user_joined', (data) => {
        console.log('++++ 👤 Nuovo utente nella stanza:', data);
        addMessage('Sistema', data.message);
    })

    socket.on('room_message_received', (data) => {
        console.log('💬 Messaggio ricevuto:', data);
        addMessage(data.userName, data.message);
    });

    socket.on('room_creation_result', (data) => {
        console.log('🎬 Risultato creazione stanza:', data);
        
        if (data.success) {
            addMessage('Sistema', `✅ ${data.message}`);
            // Aggiorniamo automaticamente la lista delle stanze
            setTimeout(loadActiveRooms, 500);
            
        } else {
            addMessage('Sistema', `⚠️ ${data.message}`);
            // Se la stanza esisteva già, entriamo comunque
            if (data.roomName) {
                addMessage('Sistema', `Sei stato aggiunto alla stanza esistente.`);
            }
        }
    });
}


// funzioni creazione stanza 

function createNewRoom() {

    if (!socket) {
        alert('Non sei connesso al server!');
        return;
    }
    
    // Prendiamo i valori dal form
    const userName = document.getElementById('createUserName').value.trim();
    const roomName = document.getElementById('createRoomName').value.trim();
    const topic = document.getElementById('createRoomTopic').value;
    
    // Validazioni anche se queste possono essere messe lato front con un restrict sul form 
    if (!userName) {
        alert('Inserisci il tuo nickname!');
        return;
    }
    
    if (!roomName) {
        alert('Inserisci il nome della stanza!');
        return;
    }
    
    if (!topic) {
        alert('Seleziona un argomento per la discussione!');
        return;
    }
    
    console.log(`🎬 Creando stanza: "${roomName}" per argomento: "${topic}" come utente: "${userName}"`);
    
    // Salviamo i dati correnti
    currentRoom = roomName;
    currentUser = userName;
    
    // Inviamo l'evento di creazione al server
    socket.emit('create_room', {
        roomName: roomName,
        userName: userName,
        topic: topic
    });
    
    // Puliamo il form
    clearCreateRoomForm();
}


async function loadActiveRooms() {

    try{
        console.log('caricamento stanze attive');
        const response = await fetch('http://localhost:5001/api/rooms')
        const data = await response.json()
        console.log('📋 Stanze ricevute:', data);
        
        displayRoomsList(data.rooms);
        
    } catch (error) {
        console.error('❌ Errore nel caricamento stanze:', error);
        document.getElementById('roomsList').innerHTML = '<p style="color: red;">Errore nel caricamento stanze</p>';
    }
}

function displayRoomsList(rooms) {

    const roomsListDiv = document.getElementById('roomsList');
    
    if (rooms.length === 0) {
        roomsListDiv.innerHTML = '<p>Nessuna stanza attiva al momento</p>';
        return;
    }
    
    let html = '<div style="margin-top: 10px;">';
    
    rooms.forEach(room => {
        html += `
            <div style="border: 1px solid #eee; padding: 10px; margin: 5px 0; border-radius: 3px; background: #f9f9f9;">
                <strong>🏠 ${room.name}</strong><br>
                👥 ${room.userCount} utenti online<br>
                💭 ${room.topic}<br>
                <small>Creata: ${new Date(room.createdAt).toLocaleString()}</small><br>
                <input type="text" id="nicknameInput" placeholder="Inserisci il tuo nickname" />
                <button onclick="joinSpecificRoom('${room.name}')" style="margin-top: 5px;">
                    Entra nella stanza
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    roomsListDiv.innerHTML = html;
}


function joinSpecificRoom(roomName) {

    if (!socket) {
        alert('Non sei connesso al server!');
        return;
    }
    
    const userName = document.getElementById('nicknameInput').value.trim();
    if (userName === ''){
        alert('inserisci userName')
        return
    }

    currentRoom = roomName;
    currentUser = userName;
    
    console.log(`🚪 Entrando nella stanza: ${roomName} come ${userName}`);
    
    socket.emit('join_room', {
        roomName: roomName,
        userName: userName
    });
}


function sendRoomMessage(){

    if (!socket){
        alert('non sei connesso')
        return
    }

    if (!currentRoom){
        alert('connettiti ad una stanza')
        return
    }

    const messageInput= document.getElementById('messageInput')
    const message = messageInput.value.trim();

    if (!message) {
        return
    }

    console.log(`📤 Invio messaggio nella stanza ${currentRoom}: ${message}`);

    socket.emit('room_message', {
        roomName: currentRoom,
        userName: currentUser,
        message: message
    });

    //devo sempre pulire? 
    messageInput.value = '';
}



function addMessage(sender,message){
    const messagesDiv = document.getElementById('messages')
    const messageDiv = document.createElement('div')
    messageDiv.textContent = `${sender}: ${message}`
    messagesDiv.appendChild(messageDiv)
}


function updateStatus(type,text) {
    const statusDiv = document.getElementById('status')
    if (!statusDiv) {
        console.error('Elemento con id="status" non trovato nel DOM');
        return;
    }
    statusDiv.className= `status ${type}`
    
    statusDiv.textContent = text 
}



// Funzione per pulire il form di creazione
function clearCreateRoomForm() {
    document.getElementById('createUserName').value = '';
    document.getElementById('createRoomName').value = '';
    document.getElementById('createRoomTopic').value = '';
}


