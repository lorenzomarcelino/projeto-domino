import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
// @ts-ignore
import { useDrop } from 'react-dnd';
import { Tile, Player } from '../types';
import DominoTile from './DominoTile';

interface GameBoardProps {
  table: Tile[];
  currentPlayer: Player;
  playerData: Player | null;
  makeMove: (tileIndex: number, tableEnd: 'left' | 'right') => void;
}

// @ts-ignore
interface DragItem {
  type: string;
  tile: Tile;
  index: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  table,
  currentPlayer,
  playerData,
  makeMove
}) => {
  const [tableLayout, setTableLayout] = useState<Tile[]>([]);
  const [tableScale, setTableScale] = useState(1);
  const isCurrentPlayer = playerData && currentPlayer && playerData.id === currentPlayer.id;

  useEffect(() => {
    // Organize tiles for display
    setTableLayout(table);

    // Calculate scale based on number of tiles - maximum aggressive scaling due to very large spacing
    const baseScale = 1;
    const minScale = 0.2;
    const maxTiles = 3; // Start scaling immediately due to very large spacing
    if (table.length <= maxTiles) {
      setTableScale(baseScale);
    } else {
      // Maximum aggressive scaling formula to compensate for very large spacing
      const scale = Math.max(minScale, baseScale - ((table.length - maxTiles) * 0.12));
      setTableScale(scale);
    }
  }, [table]);

  // @ts-ignore
  const [{ isOverLeft }, dropLeft] = useDrop({
    accept: 'tile',
    drop: (item: DragItem) => {
      makeMove(item.index, 'left');
    },
    canDrop: () => isCurrentPlayer || false,
    // @ts-ignore
    collect: (monitor) => ({
      isOverLeft: !!monitor.isOver(),
    }),
  });

  // @ts-ignore
  const [{ isOverRight }, dropRight] = useDrop({
    accept: 'tile',
    drop: (item: DragItem) => {
      makeMove(item.index, 'right');
    },
    canDrop: () => isCurrentPlayer || false,
    // @ts-ignore
    collect: (monitor) => ({
      isOverRight: !!monitor.isOver(),
    }),
  });

  // Handle empty table
  if (tableLayout.length === 0) {
    return (
      <BoardContainer>
        {/* @ts-ignore */}
        <CenterDropZone ref={dropLeft} $isOver={isOverLeft} $isActive={!!isCurrentPlayer}>
          <EmptyTableMessage>
            {isCurrentPlayer ? 'Jogue a primeira peça' : 'Aguardando primeiro jogador'}
          </EmptyTableMessage>
        </CenterDropZone>
      </BoardContainer>
    );
  }

  return (
    <BoardContainer>
      {/* @ts-ignore */}
      <DropZone ref={dropLeft} $isOver={isOverLeft} $isActive={!!isCurrentPlayer}>
        {isCurrentPlayer && <DropIndicator>Coloque aqui</DropIndicator>}
      </DropZone>

      <TableContainer style={{ transform: `scale(${tableScale})` }}>
        {tableLayout.map((tile, index) => {
          // Determine if we need to rotate the tile
          const isFirstOrLast = index === 0 || index === tableLayout.length - 1;
          const shouldRotate = (
            (index > 0 && tile.isDouble) ||
            (isFirstOrLast && tile.isDouble) ||
            (!tile.isDouble && index % 2 === 1)
          );

          return (
            <TileWrapper 
              key={index} 
              $position={index} 
              $isDouble={tile.isDouble}
              $shouldRotate={shouldRotate}
            >
              <DominoTile tile={tile} rotated={shouldRotate} isVisible={true} />
            </TileWrapper>
          );
        })}
      </TableContainer>

      {/* @ts-ignore */}
      <DropZone ref={dropRight} $isOver={isOverRight} $isActive={!!isCurrentPlayer}>
        {isCurrentPlayer && <DropIndicator>Coloque aqui</DropIndicator>}
      </DropZone>
    </BoardContainer>
  );
};

const BoardContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2d5a3d 0%, #4d7c5d 25%, #5d9e7b 50%, #4d7c5d 75%, #2d5a3d 100%);
  border-radius: 15px;
  width: 100%;
  min-height: 300px;
  max-height: 400px;
  margin: 20px 0;
  padding: 20px;
  box-shadow: 
    inset 0 0 20px rgba(0, 0, 0, 0.4),
    0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 1px, transparent 1px),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
      radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 50px 50px, 70px 70px, 30px 30px;
    border-radius: 15px;
    pointer-events: none;
  }
`;

const TableContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: 120px;
  max-height: 320px;
  position: relative;
  transform-origin: center;
  transition: transform 0.3s ease;
  gap: 35px;
  padding: 15px;
  max-width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
`;

const CenterDropZone = styled.div<{ $isOver: boolean; $isActive: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 150px;
  background-color: ${props => props.$isOver ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border: 3px dashed ${props => props.$isActive ? 'rgba(255, 255, 255, 0.8)' : 'transparent'};
  border-radius: 15px;
  transition: all 0.3s ease;
`;

const DropZone = styled.div<{ $isOver: boolean; $isActive: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 140px;
  margin: 0 15px;
  background-color: ${props => props.$isOver ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border: 3px dashed ${props => props.$isActive ? 'rgba(255, 255, 255, 0.8)' : 'transparent'};
  border-radius: 15px;
  transition: all 0.3s ease;
`;

const DropIndicator = styled.div`
  font-size: 14px;
  color: white;
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const EmptyTableMessage = styled.div`
  font-size: 18px;
  color: white;
  text-align: center;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const TileWrapper = styled.div<{ $position: number; $isDouble: boolean; $shouldRotate?: boolean }>`
  display: inline-block;
  transform: ${props => {
    const rotation = props.$shouldRotate ? 'rotate(90deg)' : 'none';
    return rotation;
  }};
  transition: transform 0.3s ease;
  margin: 15px;
  z-index: ${props => 100 - props.$position};
  flex-shrink: 0;
  
  /* Espaçamento muito generoso para visualização clara desde o início do jogo */
`;

export default GameBoard; 