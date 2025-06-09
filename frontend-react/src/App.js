// src/App.js
import React, { useState } from 'react';
import UserLogin from './components/UserLogin';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  // State per tenere traccia dell'utente attualmente loggato
  const [currentUser, setCurrentUser] = useState(null);

  // Funzione chiamata quando l'utente fa login
  const handleLogin = (userName) => {
    setCurrentUser(userName);
    console.log(`Utente ${userName} ha fatto login`);
  };

  // Funzione chiamata quando l'utente fa logout
  const handleLogout = () => {
    setCurrentUser(null);
    console.log('Utente ha fatto logout');
  };

  return (
    <div className="App">
      <h1 style={{ textAlign: 'center', color: '#333' }}>
        Sistema di Chat Real-Time
      </h1>
      
      {/* Renderizzazione condizionale: mostra Login o ChatRoom basandoti sullo state */}
      {!currentUser ? (
        <UserLogin onLogin={handleLogin} />
      ) : (
        <ChatRoom userName={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;