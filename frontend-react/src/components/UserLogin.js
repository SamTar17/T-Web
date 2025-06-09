// src/components/UserLogin.js
import React, { useState } from 'react';

// Questo componente gestisce solo il login dell'utente
// Riceve una funzione 'onLogin' come prop dal componente genitore
function UserLogin({ onLogin }) {
  // State locale per il nome utente che sta digitando
  const [inputName, setInputName] = useState('');

  // Funzione chiamata quando l'utente clicca "Entra"
  const handleLogin = () => {
    if (inputName.trim()) { // Controlliamo che il nome non sia vuoto
      onLogin(inputName.trim()); // Chiamiamo la funzione del genitore
    }
  };

  // Funzione chiamata quando l'utente preme Enter nell'input
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Benvenuto nel Sistema di Chat</h2>
      <p>Inserisci il tuo nome per iniziare a chattare</p>
      
      <div style={{ margin: '20px 0' }}>
        <input
          type="text"
          placeholder="Il tuo nome..."
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          onKeyUp={handleKeyPress}
          style={{ 
            padding: '10px', 
            marginRight: '10px', 
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        />
        <button 
          onClick={handleLogin}
          disabled={!inputName.trim()} // Disabilita il pulsante se il nome è vuoto
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: inputName.trim() ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: inputName.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Entra nella Chat
        </button>
      </div>
    </div>
  );
}

export default UserLogin;