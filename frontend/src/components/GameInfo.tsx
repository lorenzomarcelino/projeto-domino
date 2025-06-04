import React from 'react';
import styled from 'styled-components';
import { Player, TeamAssignment } from '../types';

interface GameInfoProps {
  scores: { [key: number]: number };
  teamAssignment: TeamAssignment;
  currentPlayer: Player;
  roundNumber: number;
  tilesLeft: { [key: string]: number };
}

const GameInfo: React.FC<GameInfoProps> = ({
  scores,
  teamAssignment,
  currentPlayer,
  roundNumber,
  tilesLeft
}) => {
  return (
    <InfoContainer>
      <RoundInfo>
        <h2>Rodada {roundNumber}</h2>
      </RoundInfo>

      <TeamInfo>
        <TeamPanel $isActive={currentPlayer && teamAssignment.team1.some(p => p.id === currentPlayer.id)}>
          <TeamHeader>Dupla 1</TeamHeader>
          <TeamScore>{scores[1] || 0} pontos</TeamScore>
          <PlayersList>
            {teamAssignment.team1.map(player => (
              <PlayerItem key={player.id} $isCurrentPlayer={currentPlayer && player.id === currentPlayer.id}>
                {player.name} 
                <PlayerTilesCount>
                  {tilesLeft && tilesLeft[player.id] !== undefined 
                    ? `(${tilesLeft[player.id]} peças)` 
                    : ''}
                </PlayerTilesCount>
                {currentPlayer && player.id === currentPlayer.id && <CurrentPlayerIndicator>✓</CurrentPlayerIndicator>}
              </PlayerItem>
            ))}
          </PlayersList>
        </TeamPanel>

        <TeamPanel $isActive={currentPlayer && teamAssignment.team2.some(p => p.id === currentPlayer.id)}>
          <TeamHeader>Dupla 2</TeamHeader>
          <TeamScore>{scores[2] || 0} pontos</TeamScore>
          <PlayersList>
            {teamAssignment.team2.map(player => (
              <PlayerItem key={player.id} $isCurrentPlayer={currentPlayer && player.id === currentPlayer.id}>
                {player.name}
                <PlayerTilesCount>
                  {tilesLeft && tilesLeft[player.id] !== undefined 
                    ? `(${tilesLeft[player.id]} peças)` 
                    : ''}
                </PlayerTilesCount>
                {currentPlayer && player.id === currentPlayer.id && <CurrentPlayerIndicator>✓</CurrentPlayerIndicator>}
              </PlayerItem>
            ))}
          </PlayersList>
        </TeamPanel>
      </TeamInfo>
    </InfoContainer>
  );
};

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #2c3e50;
  border-radius: 10px;
  padding: 15px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const RoundInfo = styled.div`
  text-align: center;
  margin-bottom: 15px;

  h2 {
    margin: 0;
    font-size: 22px;
    color: #3498db;
  }
`;

const TeamInfo = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
`;

const TeamPanel = styled.div<{ $isActive: boolean }>`
  flex: 1;
  border: 2px solid ${props => props.$isActive ? '#f1c40f' : 'transparent'};
  border-radius: 8px;
  padding: 10px;
  background-color: ${props => props.$isActive ? '#34495e' : '#2c3e50'};
  transition: all 0.3s ease;
`;

const TeamHeader = styled.h3`
  margin: 0 0 5px 0;
  font-size: 18px;
  text-align: center;
`;

const TeamScore = styled.div`
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
  color: #f1c40f;
`;

const PlayersList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const PlayerItem = styled.li<{ $isCurrentPlayer: boolean }>`
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-weight: ${props => props.$isCurrentPlayer ? 'bold' : 'normal'};
  color: ${props => props.$isCurrentPlayer ? '#3498db' : 'white'};
  position: relative;
`;

const PlayerTilesCount = styled.span`
  margin-left: 5px;
  font-size: 14px;
  color: #7f8c8d;
`;

const CurrentPlayerIndicator = styled.span`
  margin-left: 5px;
  color: #2ecc71;
`;

export default GameInfo; 