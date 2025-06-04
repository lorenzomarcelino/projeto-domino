import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useSocketContext } from '../App';
import GameBoard from '../components/GameBoard';
import PlayerHand from '../components/PlayerHand';
import GameInfo from '../components/GameInfo';
import { useNavigate } from 'react-router-dom';

const GamePage: React.FC = () => {
  const {
    playerData,
    teamAssignment,
    gameState,
    gameStarted,
    roundEnded,
    roundWinner,
    roundPoints,
    gameEnded,
    gameWinner,
    gameLocked,
    lockedGamePlayerTiles,
    makeMove,
    passTurn,
    passTurnError
  } = useSocketContext();
  
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if no player data
    if (!playerData) {
      navigate('/');
    }
  }, [playerData, navigate]);

  if (!playerData || !gameStarted) {
    return (
      <LoadingContainer>
        <h2>Aguardando jogadores...</h2>
        <p>Jogadores conectados: {teamAssignment.team1.length + teamAssignment.team2.length} / 4</p>
      </LoadingContainer>
    );
  }

  if (!gameState) {
    return (
      <LoadingContainer>
        <h2>Carregando jogo...</h2>
      </LoadingContainer>
    );
  }

  const isCurrentPlayer = gameState.currentPlayer && playerData.id === gameState.currentPlayer.id;

  return (
    <GameContainer>
      <GameInfo 
        scores={gameState.scores}
        teamAssignment={teamAssignment}
        currentPlayer={gameState.currentPlayer}
        roundNumber={gameState.roundNumber}
        tilesLeft={gameState.tilesLeft}
      />

      <GameBoard 
        table={gameState.table}
        currentPlayer={gameState.currentPlayer}
        playerData={playerData}
        makeMove={makeMove}
      />

      <PlayerHand 
        hand={gameState.hand}
        isCurrentPlayer={isCurrentPlayer}
        makeMove={makeMove}
        passTurn={passTurn}
        table={gameState.table}
        passTurnError={passTurnError}
      />

      {/* Notifications */}
      {roundEnded && (
        <Notification $type="success">
          <h3>Fim da Rodada!</h3>
          <p>A Dupla {roundWinner} venceu e ganhou {roundPoints} pontos!</p>
        </Notification>
      )}

      {gameEnded && (
        <Notification $type="info">
          <h3>Fim do Jogo!</h3>
          <p>A Dupla {gameWinner} venceu a partida!</p>
          <button onClick={() => navigate('/')}>Voltar ao Início</button>
        </Notification>
      )}

      {gameLocked && (
        <Notification $type="warning">
          <h3>Jogo Fechado!</h3>
          <p>Ninguém conseguiu jogar. {roundWinner ? `Dupla ${roundWinner} ganha ${roundPoints} pontos.` : 'Empate!'}</p>
          {lockedGamePlayerTiles && (
            <div>
              <p>Pontos de cada jogador:</p>
              <ul>
                {Object.keys(lockedGamePlayerTiles).map(playerId => {
                  const player = [...teamAssignment.team1, ...teamAssignment.team2].find(p => p.id === playerId);
                  const points = lockedGamePlayerTiles[playerId].reduce((sum, tile) => sum + tile.left + tile.right, 0);
                  return player ? (
                    <li key={playerId}>
                      {player.name}: {points} pontos
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
        </Notification>
      )}
    </GameContainer>
  );
};

const GameContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  text-align: center;
  color: #333;

  h2 {
    font-size: 24px;
    margin-bottom: 10px;
  }

  p {
    font-size: 18px;
  }
`;

const Notification = styled.div<{ $type: 'success' | 'warning' | 'info' }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${props => {
    switch (props.$type) {
      case 'success': return '#2ecc71';
      case 'warning': return '#e74c3c';
      case 'info': return '#3498db';
      default: return '#3498db';
    }
  }};
  color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  text-align: center;
  min-width: 300px;

  h3 {
    margin-top: 0;
    font-size: 22px;
  }

  button {
    background-color: white;
    color: #333;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    margin-top: 15px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f1f1f1;
    }
  }
`;

export default GamePage; 