import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { triggerSelectionHaptic } from '../../shared/haptics';
import { CHIP_DRAG_COMMIT_THRESHOLD_DY, type DragGestureState } from './DraggableWordChip';

type ChipLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const useSelectedWordDrag = <T,>(
  itemCount: number,
  setItems: Dispatch<SetStateAction<T[]>>
) => {
  const itemCountRef = useRef(itemCount);
  itemCountRef.current = itemCount;

  const chipLayoutsRef = useRef<Record<number, ChipLayout>>({});
  const dragJustEndedRef = useRef(false);

  const [draggingPosition, setDraggingPosition] = useState<number | null>(null);
  const [dropTargetPosition, setDropTargetPosition] = useState<number | null>(null);

  const handleChipLayout = useCallback((position: number, event: LayoutChangeEvent) => {
    chipLayoutsRef.current[position] = event.nativeEvent.layout;
  }, []);

  const moveItem = useCallback((fromPosition: number, toPosition: number) => {
    setItems((currentItems) => {
      if (
        fromPosition === toPosition ||
        fromPosition < 0 ||
        toPosition < 0 ||
        fromPosition >= currentItems.length ||
        toPosition >= currentItems.length
      ) {
        return currentItems;
      }

      const nextItems = [...currentItems];
      const [movedItem] = nextItems.splice(fromPosition, 1);
      nextItems.splice(toPosition, 0, movedItem);
      return nextItems;
    });
  }, [setItems]);





  const removeItem = useCallback((position: number) => {
    setItems((currentItems) => {
      if (position < 0 || position >= currentItems.length) return currentItems;

      const nextItems = [...currentItems];
      nextItems.splice(position, 1);
      return nextItems;
    });
  }, [setItems]);

  const getDropTargetPosition = useCallback((fromPosition: number, gestureState: DragGestureState) => {
    const currentLayout = chipLayoutsRef.current[fromPosition];
    const positions = Object.keys(chipLayoutsRef.current)
      .map(Number)
      .filter((position) => position >= 0 && position < itemCountRef.current);

    if (!currentLayout || positions.length < 2) {
      if (gestureState.dx > 36) return Math.min(itemCountRef.current - 1, fromPosition + 1);
      if (gestureState.dx < -36) return Math.max(0, fromPosition - 1);
      return fromPosition;
    }

    const draggedCenterX = currentLayout.x + currentLayout.width / 2 + gestureState.dx;
    const draggedCenterY = currentLayout.y + currentLayout.height / 2 + gestureState.dy;

    return positions.reduce((closestPosition, position) => {
      const layout = chipLayoutsRef.current[position];
      const closestLayout = chipLayoutsRef.current[closestPosition];
      if (!layout || !closestLayout) return closestPosition;

      const distance =
        Math.abs(draggedCenterX - (layout.x + layout.width / 2)) +
        Math.abs(draggedCenterY - (layout.y + layout.height / 2)) * 1.35;
      const closestDistance =
        Math.abs(draggedCenterX - (closestLayout.x + closestLayout.width / 2)) +
        Math.abs(draggedCenterY - (closestLayout.y + closestLayout.height / 2)) * 1.35;

      return distance < closestDistance ? position : closestPosition;
    }, fromPosition);
  }, []);

  const handleDragStart = useCallback((position: number) => {
    setDraggingPosition(position);
  }, []);

  const handleDragMove = useCallback((position: number, gestureState: DragGestureState) => {




    if (gestureState.dy > CHIP_DRAG_COMMIT_THRESHOLD_DY) {
      setDropTargetPosition(null);
      return;
    }
    const target = getDropTargetPosition(position, gestureState);
    setDropTargetPosition(target !== position ? target : null);
  }, [getDropTargetPosition]);

  const handleDragEnd = useCallback((position: number, didDrag: boolean, gestureState: DragGestureState) => {
    const shouldRemove = didDrag && gestureState.dy > CHIP_DRAG_COMMIT_THRESHOLD_DY;
    const targetPosition = didDrag && !shouldRemove ? getDropTargetPosition(position, gestureState) : position;

    if (didDrag) {
      dragJustEndedRef.current = true;
      setTimeout(() => {
        dragJustEndedRef.current = false;
      }, 120);
    }

    setDraggingPosition(null);
    setDropTargetPosition(null);

    if (shouldRemove) {
      triggerSelectionHaptic();
      removeItem(position);
      return;
    }

    if (didDrag && targetPosition !== position) {
      triggerSelectionHaptic();
      moveItem(position, targetPosition);
    }
  }, [getDropTargetPosition, moveItem, removeItem]);

  const shouldIgnorePress = useCallback(() => dragJustEndedRef.current, []);

  return {
    draggingPosition,
    dropTargetPosition,
    handleChipLayout,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    shouldIgnorePress,
  };
};
