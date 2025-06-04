import React from 'react';
// @ts-ignore
import { useDrag } from 'react-dnd';
import styled from 'styled-components';
import { Tile } from '../types';

interface DominoTileProps {
  tile: Tile;
  index?: number;
  isPlayable?: boolean;
  onDoubleClick?: () => void;
  rotated?: boolean;
  isVisible?: boolean;
}

// Helper functions for dot positioning
function getDotGridTemplate(value: number): string {
  switch (value) {
    case 0:
      return 'auto';
    case 1:
      return 'auto';
    case 2:
      return 'auto auto';
    case 3:
      return 'auto auto auto';
    case 4:
      return 'auto auto';
    case 5:
      return 'auto auto auto';
    case 6:
      return 'auto auto auto';
    default:
      return 'auto';
  }
}

// Helper function to get dot positions
function getDotPositions(value: number): { gridColumn: string; gridRow: string }[] {
  switch (value) {
    case 0:
      return [];
    case 1:
      return [{ gridColumn: '2', gridRow: '2' }];
    case 2:
      return [
        { gridColumn: '1', gridRow: '1' },
        { gridColumn: '2', gridRow: '2' }
      ];
    case 3:
      return [
        { gridColumn: '1', gridRow: '1' },
        { gridColumn: '2', gridRow: '2' },
        { gridColumn: '3', gridRow: '3' }
      ];
    case 4:
      return [
        { gridColumn: '1', gridRow: '1' },
        { gridColumn: '2', gridRow: '1' },
        { gridColumn: '1', gridRow: '2' },
        { gridColumn: '2', gridRow: '2' }
      ];
    case 5:
      return [
        { gridColumn: '1', gridRow: '1' },
        { gridColumn: '2', gridRow: '1' },
        { gridColumn: '3', gridRow: '2' },
        { gridColumn: '1', gridRow: '3' },
        { gridColumn: '2', gridRow: '3' }
      ];
    case 6:
      return [
        { gridColumn: '1', gridRow: '1' },
        { gridColumn: '2', gridRow: '1' },
        { gridColumn: '3', gridRow: '1' },
        { gridColumn: '1', gridRow: '2' },
        { gridColumn: '2', gridRow: '2' },
        { gridColumn: '3', gridRow: '2' }
      ];
    default:
      return [];
  }
}

const DominoTile: React.FC<DominoTileProps> = ({
  tile,
  index,
  isPlayable = false,
  onDoubleClick,
  rotated = false,
  isVisible = true
}) => {
  const [{ isDragging }, drag] = useDrag({
    item: { type: 'tile', tile, index },
    canDrag: isPlayable,
    // @ts-ignore
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  });

  const handleDoubleClick = () => {
    if (isPlayable && onDoubleClick) {
      onDoubleClick();
    }
  };

  return (
    // @ts-ignore
    <TileContainer
      ref={drag}
      $isDragging={isDragging}
      $isPlayable={isPlayable}
      $rotated={rotated}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={handleDoubleClick}
    >
      {isVisible ? (
        <>
          <DominoHalf $value={tile.left}>
            {getDotPositions(tile.left).map((pos, i) => (
              <Dot 
                key={i} 
                style={{ 
                  gridColumn: pos.gridColumn,
                  gridRow: pos.gridRow
                }} 
              />
            ))}
          </DominoHalf>
          <DominoSeparator />
          <DominoHalf $value={tile.right}>
            {getDotPositions(tile.right).map((pos, i) => (
              <Dot 
                key={i} 
                style={{ 
                  gridColumn: pos.gridColumn,
                  gridRow: pos.gridRow
                }} 
              />
            ))}
          </DominoHalf>
        </>
      ) : (
        <DominoBack />
      )}
    </TileContainer>
  );
};

const TileContainer = styled.div<{ $isDragging: boolean; $isPlayable: boolean; $rotated: boolean }>`
  display: flex;
  flex-direction: ${props => props.$rotated ? 'column' : 'row'};
  width: ${props => props.$rotated ? '55px' : '110px'};
  height: ${props => props.$rotated ? '110px' : '55px'};
  background: linear-gradient(145deg, #ffffff 0%, #f5f5f5 30%, #e8e8e8 70%, #d0d0d0 100%);
  border-radius: 10px;
  border: 1px solid #bbb;
  cursor: ${props => props.$isPlayable ? 'pointer' : 'default'};
  opacity: ${props => (props.$isDragging ? 0.5 : 1)};
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  margin: 2px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  /* Efeito de textura mais sutil */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 0%, transparent 30%),
      radial-gradient(circle at 75% 75%, rgba(0,0,0,0.05) 0%, transparent 30%);
    border-radius: 10px;
    pointer-events: none;
  }

  &:hover {
    transform: ${props => props.$isPlayable ? 'translateY(-2px) scale(1.05)' : 'none'};
    box-shadow: ${props => props.$isPlayable ? `
      0 6px 12px rgba(0, 0, 0, 0.25),
      0 2px 4px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1)
    ` : `
      0 4px 8px rgba(0, 0, 0, 0.2),
      0 1px 2px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1)
    `};
  }
`;

const DominoHalf = styled.div<{ $value: number }>`
  flex: 1;
  display: grid;
  grid-template-columns: ${props => getDotGridTemplate(props.$value)};
  grid-template-rows: ${props => getDotGridTemplate(props.$value)};
  align-items: center;
  justify-items: center;
  padding: 8px;
  position: relative;
  background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 50%, #e8e8e8 100%);
  
  /* Borda interna sutil */
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    border-radius: 6px;
    background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(0,0,0,0.05) 100%);
    pointer-events: none;
  }
`;

const DominoSeparator = styled.div`
  width: 3px;
  background: linear-gradient(to bottom, 
    #999 0%, 
    #666 20%, 
    #333 50%, 
    #666 80%, 
    #999 100%
  );
  height: 100%;
  box-shadow: 
    inset 0 0 3px rgba(0,0,0,0.4),
    0 0 1px rgba(0,0,0,0.2);
  border-radius: 2px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  }
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #555 0%, #333 40%, #111 100%);
  box-shadow: 
    inset -2px -2px 4px rgba(0,0,0,0.4),
    inset 1px 1px 2px rgba(255,255,255,0.1),
    0 1px 2px rgba(0,0,0,0.3);
  position: relative;

  /* Brilho realista */
  &::after {
    content: '';
    position: absolute;
    top: 25%;
    left: 25%;
    width: 35%;
    height: 35%;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 60%, transparent 100%);
  }
`;

const DominoBack = styled.div`
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  background-image: 
    repeating-linear-gradient(45deg, #e0e0e0, #e0e0e0 5px, #f0f0f0 5px, #f0f0f0 10px),
    linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
`;

export default DominoTile;