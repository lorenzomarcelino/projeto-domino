import React, { createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// @ts-ignore
import { DndProvider } from 'react-dnd';
// @ts-ignore
import { HTML5Backend } from 'react-dnd-html5-backend';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import { createGlobalStyle } from 'styled-components';
import { useSocket, UseSocketReturn } from './hooks/useSocket';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Roboto', sans-serif;
    background-color: #f5f6fa;
    color: #333;
    line-height: 1.6;
  }
`;

// Create Socket Context
const SocketContext = createContext<UseSocketReturn | null>(null);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};

const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketData = useSocket();
  
  return (
    <SocketContext.Provider value={socketData}>
      {children}
    </SocketContext.Provider>
  );
};

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <GlobalStyle />
        <SocketProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
          </Routes>
        </SocketProvider>
      </Router>
    </DndProvider>
  );
}

export default App;
