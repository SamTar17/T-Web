// src/components/ChatRoom.js
import React, { useState } from 'react';

// Questo componente gestisce la visualizzazione della chat e l'invio di messaggi
function ChatRoom({ userName, onLogout }) {
  // State per i messaggi ricevuti
  const [messages, setMessages] = useState([]);
  // State per il messaggio che sta scrivendo l'utente
  const [currentMessage, setCurrentMessage] = useState('');

  // Funzione per inviare un nuovo messaggio
  const sendMessage = () => {
    if (currentMessage.trim()) {
      // Per ora aggiungiamo solo messaggi finti
      // Più tardi collegheremo Socket.io
      const newMessage = {
        id: Date.now(), // ID temporaneo basato sul timestamp
        userName: userName,
        message: currentMessage,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setCurrentMessage(''); // Pulisce l'input dopo l'invio
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header della chat */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #ccc',
        paddingBottom: '10px',
        marginBottom: '20px'
      }}>
        <h2>Chat Room - Connesso come: {userName}</h2>
        <button 
          onClick={onLogout}
          style={{
            padding: '5px 15px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Area dei messaggi */}
      <div style={{ 
        height: '400px', 
        border: '1px solid #ccc', 
        borderRadius: '5px',
        padding: '10px',
        marginBottom: '10px',
        overflowY: 'scroll',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center' }}>
            Nessun messaggio ancora. Inizia la conversazione!
          </p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: '10px' }}>
              <strong>{msg.userName}</strong> 
              <span style={{ color: '#666', fontSize: '12px' }}> ({msg.timestamp})</span>
              <div>{msg.message}</div>
            </div>
          ))
        )}
      </div>

      {/* Area per scrivere nuovi messaggi */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Scrivi un messaggio..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyUp={handleKeyPress}
          style={{ 
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={!currentMessage.trim()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: currentMessage.trim() ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: currentMessage.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Invia
        </button>
      </div>
    </div>
  );
}

export default ChatRoom;