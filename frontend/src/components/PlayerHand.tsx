import React, { useState } from 'react';
import styled from 'styled-components';
import { Tile } from '../types';
import DominoTile from './DominoTile';

interface PlayerHandProps {
  hand: Tile[];
  isCurrentPlayer: boolean;
  makeMove: (tileIndex: number, tableEnd: 'left' | 'right') => void;
  passTurn: () => void;
  table: Tile[];
  passTurnError: string | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  isCurrentPlayer,
  makeMove,
  passTurn,
  table,
  passTurnError
}) => {
  const [showEndChoice, setShowEndChoice] = useState(false);
  const [selectedTile, setSelectedTile] = useState<{ index: number; tile: Tile } | null>(null);

  console.log('DEBUG - PlayerHand render:', {
    hand,
    isCurrentPlayer,
    table,
    hasHand: !!hand,
    handLength: hand?.length || 0,
    tableLength: table?.length || 0
  });
  
  // Check if the player has any valid moves using the same logic as backend
  const hasValidMoves = hand.some(tile => {
    if (table.length === 0) return true; // First tile can always be played
    
    const leftEnd = table[0].left;
    const rightEnd = table[table.length - 1].right;
    
    // Check if tile can be played on either end
    return (
      (tile.left === leftEnd || tile.right === leftEnd) || // Can play on left end
      (tile.left === rightEnd || tile.right === rightEnd)  // Can play on right end
    );
  });
  
  // Determine if a specific tile can be played
  const canPlayTile = (tile: Tile): { canPlay: boolean; end: 'left' | 'right' | 'both' | null } => {
    console.log('DEBUG - Checking tile playability:', {
      tile,
      tableLength: table.length,
      table: table,
      isCurrentPlayer
    });
    
    if (table.length === 0) {
      console.log('DEBUG - Table is empty, tile can be played on left');
      return { canPlay: true, end: 'left' }; // First tile always goes on left
    }
    
    const leftEnd = table[0].left;
    const rightEnd = table[table.length - 1].right;
    
    const canPlayLeft = tile.left === leftEnd || tile.right === leftEnd;
    const canPlayRight = tile.left === rightEnd || tile.right === rightEnd;
    
    console.log('DEBUG - Tile playability check:', {
      leftEnd,
      rightEnd,
      canPlayLeft,
      canPlayRight,
      tileLeft: tile.left,
      tileRight: tile.right
    });
    
    if (canPlayLeft && canPlayRight) return { canPlay: true, end: 'both' };
    if (canPlayLeft) return { canPlay: true, end: 'left' };
    if (canPlayRight) return { canPlay: true, end: 'right' };
    
    return { canPlay: false, end: null };
  };
  
  // Handle double click on a tile
  const handleTileDoubleClick = (index: number, tile: Tile) => {
    console.log('DEBUG - Tile double clicked:', {
      index,
      tile,
      isCurrentPlayer
    });
    
    if (!isCurrentPlayer) {
      console.log('DEBUG - Not current player, ignoring click');
      return;
    }
    
    const playability = canPlayTile(tile);
    console.log('DEBUG - Playability result:', playability);
    
    if (playability.canPlay) {
      if (playability.end === 'both') {
        // Show choice modal for which end to play
        console.log('DEBUG - Showing end choice modal');
        setSelectedTile({ index, tile });
        setShowEndChoice(true);
      } else if (playability.end === 'left' || playability.end === 'right') {
        console.log('DEBUG - Making move:', {
          index,
          end: playability.end
        });
        makeMove(index, playability.end);
      }
    } else {
      console.log('DEBUG - Tile cannot be played');
    }
  };
  
  // Handle end choice
  const handleEndChoice = (end: 'left' | 'right') => {
    if (selectedTile) {
      console.log('DEBUG - Making move with chosen end:', {
        index: selectedTile.index,
        end
      });
      makeMove(selectedTile.index, end);
    }
    setShowEndChoice(false);
    setSelectedTile(null);
  };
  
  // Cancel end choice
  const cancelEndChoice = () => {
    setShowEndChoice(false);
    setSelectedTile(null);
  };
  
  return (
    <HandContainer>
      <HandTitle>
        {isCurrentPlayer 
          ? 'Sua vez de jogar!' 
          : 'Aguarde sua vez...'}
      </HandTitle>
      
      <TilesContainer>
        {hand.map((tile, index) => (
          <DominoTile 
            key={index}
            tile={tile}
            index={index}
            isPlayable={isCurrentPlayer && canPlayTile(tile).canPlay}
            onDoubleClick={() => handleTileDoubleClick(index, tile)}
            isVisible={true}
          />
        ))}
      </TilesContainer>
      
      <ActionButtons>
        {isCurrentPlayer && (
          <>
            <PassButton 
              onClick={passTurn}
              disabled={hasValidMoves}
              title={hasValidMoves ? "Você tem uma jogada válida disponível" : "Passar a vez"}
            >
              Passar
            </PassButton>
            {passTurnError && (
              <ErrorMessage>{passTurnError}</ErrorMessage>
            )}
          </>
        )}
      </ActionButtons>

      {/* End Choice Modal */}
      {showEndChoice && selectedTile && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Escolha onde jogar a peça</ModalTitle>
            <TilePreview>
              <PreviewLabel>Peça selecionada:</PreviewLabel>
              <DominoTile 
                tile={selectedTile.tile}
                index={selectedTile.index}
                isPlayable={true}
                onDoubleClick={() => {}}
                isVisible={true}
              />
            </TilePreview>
            
            {table.length > 0 && (
              <TableEndsPreview>
                <EndOption onClick={() => handleEndChoice('left')}>
                  <EndLabel>← Ponta Esquerda</EndLabel>
                  <EndInfo>Conectar com: {table[0].left}</EndInfo>
                </EndOption>
                
                <EndOption onClick={() => handleEndChoice('right')}>
                  <EndLabel>Ponta Direita →</EndLabel>
                  <EndInfo>Conectar com: {table[table.length - 1].right}</EndInfo>
                </EndOption>
              </TableEndsPreview>
            )}
            
            <CancelButton onClick={cancelEndChoice}>
              Cancelar
            </CancelButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </HandContainer>
  );
};

const HandContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
  border-radius: 15px;
  padding: 20px;
  margin-top: 20px;
  width: 100%;
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
      radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 40px 40px, 60px 60px;
    border-radius: 15px;
    pointer-events: none;
  }
`;

const HandTitle = styled.h2`
  color: #ecf0f1;
  margin: 0 0 20px 0;
  font-size: 22px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
`;

const TilesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  max-width: 900px;
  min-height: 80px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ActionButtons = styled.div`
  margin-top: 15px;
  display: flex;
  justify-content: center;
`;

const PassButton = styled.button`
  background-color: ${props => props.disabled ? '#95a5a6' : '#e74c3c'};
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.disabled ? '#95a5a6' : '#c0392b'};
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
  padding: 8px 12px;
  border-radius: 4px;
  margin-left: 10px;
  font-size: 14px;
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 25px;
  border-radius: 10px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  color: #34495e;
  margin-bottom: 20px;
  text-align: center;
  font-size: 18px;
`;

const TilePreview = styled.div`
  margin-bottom: 20px;
  text-align: center;
`;

const TableEndsPreview = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EndOption = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 15px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const EndLabel = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
`;

const EndInfo = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const PreviewLabel = styled.div`
  margin-bottom: 10px;
  color: #34495e;
  font-weight: bold;
`;

const CancelButton = styled.button`
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  
  &:hover {
    background-color: #7f8c8d;
  }
`;

export default PlayerHand; 