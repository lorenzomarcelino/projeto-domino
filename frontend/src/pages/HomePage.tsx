import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../App';

const HomePage: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { joinGame, playerData, allPlayers, joinError, connected, gameStarted } = useSocketContext();
  const navigate = useNavigate();

  // Debug logs
  useEffect(() => {
    console.log('HomePage state:', {
      playerData,
      allPlayers: allPlayers.length,
      gameStarted,
      connected
    });
  }, [playerData, allPlayers, gameStarted, connected]);

  // Only redirect when game actually starts AND we have our player data
  useEffect(() => {
    if (gameStarted && playerData && allPlayers.length === 4) {
      console.log('Game started with 4 players, redirecting to game page');
      // Immediate redirect when game starts
      navigate('/game');
    }
  }, [gameStarted, playerData, allPlayers.length, navigate]);

  // Reset error state when player changes name
  useEffect(() => {
    if (joinError) {
      setIsSubmitting(false);
    }
  }, [joinError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!playerName.trim() || playerName.trim().length < 2) {
      return;
    }
    
    setIsSubmitting(true);
    joinGame(playerName.trim());
  };

  return (
    <HomeContainer>
      <GameTitle>DOMINÓ ONLINE</GameTitle>
      
      <ContentContainer>
        <GameDescription>
          <p>Bem-vindo ao jogo de dominó online! Este jogo segue as regras do dominó clássico em dupla.</p>
          <p>Cada jogador recebe 6 peças e as duplas jogam alternadamente tentando baixar todas as suas peças.</p>
          <RulesToggle onClick={() => setShowRules(!showRules)}>
            {showRules ? 'Esconder Regras' : 'Mostrar Regras'}
          </RulesToggle>
          
          {showRules && (
            <RulesContainer>
              <h3>Regras do Jogo:</h3>
              <ul>
                <li>O jogo é disputado em duplas, com 4 jogadores no total.</li>
                <li>As duplas são escolhidas aleatoriamente no início do jogo.</li>
                <li>Cada jogador recebe 6 peças aleatoriamente, sobrando 4 peças no dorme.</li>
                <li>Na primeira rodada, ou após um empate, começa quem tiver a maior carroça na mão.</li>
                <li>Nas rodadas seguintes, inicia a dupla que ganhou a última rodada.</li>
                <li>Não é permitido comprar peças do dorme.</li>
                <li>Se um jogador não puder jogar, ele deve "tocar" (passar a vez).</li>
                <li>Vence a rodada quem terminar de baixar todas as peças primeiro.</li>
                <li>Se o jogo "fechar" (ninguém puder jogar), ganha quem tiver menos pontos na mão.</li>
                <li>Em caso de empate, a próxima rodada vale o dobro de pontos.</li>
                <li>Pontuação:
                  <ul>
                    <li>Jogo fechado e contagem de pontos: 1 ponto</li>
                    <li>Batida simples: 1 ponto</li>
                    <li>Batida de carroça: 2 pontos</li>
                    <li>Batida "lá e lô": 3 pontos</li>
                    <li>Batida "cruzada": 4 pontos</li>
                  </ul>
                </li>
                <li>Ganha a partida a primeira dupla que atingir 6 pontos ou mais.</li>
              </ul>
              <h3>Como Jogar:</h3>
              <ul>
                <li>Arraste uma peça para o lado esquerdo ou direito do jogo para jogá-la.</li>
                <li>Dê duplo clique em uma peça para jogá-la automaticamente, se possível.</li>
                <li>Cada jogador tem até 20 segundos para fazer sua jogada.</li>
                <li>Se o tempo esgotar, o sistema jogará automaticamente.</li>
              </ul>
            </RulesContainer>
          )}
        </GameDescription>

        <JoinForm onSubmit={handleSubmit}>
          <h2>Entrar no Jogo</h2>
          
          <InputGroup>
            <label htmlFor="playerName">Seu Nome:</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Digite seu nome"
              minLength={2}
              maxLength={20}
              required
              disabled={isSubmitting}
            />
            {playerName && playerName.trim().length < 2 && (
              <InputHint>Nome muito curto. Use pelo menos 2 caracteres.</InputHint>
            )}
          </InputGroup>
          
          {joinError && <ErrorMessage>{joinError}</ErrorMessage>}
          
          {!connected && !joinError && (
            <ConnectionStatus $isError={false}>
              Estabelecendo conexão...
            </ConnectionStatus>
          )}
          
          <PlayButton 
            type="submit" 
            disabled={!playerName.trim() || playerName.trim().length < 2 || isSubmitting}
          >
            {isSubmitting ? 'ENTRANDO...' : 'JOGAR'}
          </PlayButton>
          
          <PlayersStatus>
            Jogadores conectados: {allPlayers.length} / 4
            {allPlayers.length === 4 && (
              <FullRoomMessage>Sala cheia! A partida iniciará em breve.</FullRoomMessage>
            )}
          </PlayersStatus>
          
          {allPlayers.length > 0 && (
            <PlayersList>
              {allPlayers.map(player => (
                <PlayerItem key={player.id}>{player.name}</PlayerItem>
              ))}
            </PlayersList>
          )}
        </JoinForm>
      </ContentContainer>
    </HomeContainer>
  );
};

const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
`;

const GameTitle = styled.h1`
  text-align: center;
  font-size: 42px;
  color: #2c3e50;
  margin-bottom: 30px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 30px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const GameDescription = styled.div`
  flex: 3;
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  
  p {
    font-size: 16px;
    line-height: 1.6;
    color: #333;
  }
`;

const RulesToggle = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin: 10px 0;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const RulesContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  
  h3 {
    color: #2c3e50;
    margin-top: 0;
    margin-bottom: 10px;
  }
  
  ul {
    padding-left: 20px;
    
    li {
      margin-bottom: 8px;
      line-height: 1.4;
    }
    
    ul {
      margin-top: 5px;
    }
  }
`;

const JoinForm = styled.form`
  flex: 2;
  background-color: #f0f3f7;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  
  h2 {
    text-align: center;
    color: #2c3e50;
    margin-top: 0;
    margin-bottom: 20px;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #34495e;
  }
  
  input {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
    transition: border-color 0.2s;
    
    &:focus {
      border-color: #3498db;
      outline: none;
    }
    
    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }
`;

const InputHint = styled.div`
  color: #e67e22;
  font-size: 12px;
  margin-top: 5px;
`;

const PlayButton = styled.button`
  width: 100%;
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 15px;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 15px;
  
  &:hover {
    background-color: #27ae60;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background-color: #fadbd8;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
`;

const ConnectionStatus = styled.div<{ $isError: boolean }>`
  color: ${props => props.$isError ? '#e74c3c' : '#3498db'};
  background-color: ${props => props.$isError ? '#fadbd8' : '#ebf5fb'};
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
  font-weight: bold;
`;

const PlayersStatus = styled.div`
  text-align: center;
  margin-top: 20px;
  font-size: 16px;
  color: #7f8c8d;
`;

const FullRoomMessage = styled.div`
  color: #27ae60;
  font-weight: bold;
  margin-top: 5px;
`;

const PlayersList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin-top: 10px;
`;

const PlayerItem = styled.li`
  background-color: #ecf0f1;
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 5px;
  color: #2c3e50;
  font-weight: 500;
`;

export default HomePage; 