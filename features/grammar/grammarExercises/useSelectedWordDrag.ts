import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Animated, Platform, PanResponder, type LayoutChangeEvent, type PanResponderGestureState } from 'react-native';
import { triggerSelectionHaptic } from '../../shared/haptics';

type ChipLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const DRAG_THRESHOLD = 5;

const isMeaningfulDrag = (gestureState: PanResponderGestureState) =>
  Math.abs(gestureState.dx) > DRAG_THRESHOLD || Math.abs(gestureState.dy) > DRAG_THRESHOLD;

export const useSelectedWordDrag = <T,>(
  itemCount: number,
  setItems: Dispatch<SetStateAction<T[]>>,
  disabled: boolean
) => {
  const itemCountRef = useRef(itemCount);
  itemCountRef.current = itemCount;

  const chipLayoutsRef = useRef<Record<number, ChipLayout>>({});
  const hasDraggedRef = useRef(false);
  const dragJustEndedRef = useRef(false);
  const dragOffset = useRef(new Animated.ValueXY()).current;
  const draggingScale = useRef(new Animated.Value(1)).current;

  const [draggingPosition, setDraggingPosition] = useState<number | null>(null);
  const [dropTargetPosition, setDropTargetPosition] = useState<number | null>(null);

  // Cache PanResponder instances so they are not recreated on every render.
  // Indexed by position; cleared when key dependencies change.
  const panHandlerCacheRef = useRef<Record<number, ReturnType<typeof PanResponder.create>['panHandlers']>>({});

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

  const getDropTargetPosition = useCallback((fromPosition: number, gestureState: PanResponderGestureState) => {
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

  const resetDrag = useCallback(() => {
    dragOffset.setValue({ x: 0, y: 0 });
    Animated.spring(draggingScale, {
      toValue: 1,
      useNativeDriver: false,
      speed: 50,
      bounciness: 0,
    }).start();
    setDraggingPosition(null);
    setDropTargetPosition(null);
  }, [dragOffset, draggingScale]);

  const finishDrag = useCallback((fromPosition: number, gestureState: PanResponderGestureState) => {
    const didDrag = hasDraggedRef.current;
    const targetPosition = didDrag ? getDropTargetPosition(fromPosition, gestureState) : fromPosition;

    if (didDrag) {
      dragJustEndedRef.current = true;
      setTimeout(() => {
        dragJustEndedRef.current = false;
      }, 120);
    }

    resetDrag();

    if (didDrag && targetPosition !== fromPosition) {
      triggerSelectionHaptic();
      if (Platform.OS === 'ios') {
        // Animate the reorder on iOS where LayoutAnimation is reliable
        const { LayoutAnimation } = require('react-native');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      moveItem(fromPosition, targetPosition);
    }
  }, [getDropTargetPosition, moveItem, resetDrag]);

  // Invalidate PanHandler cache whenever key callbacks change
  useEffect(() => {
    panHandlerCacheRef.current = {};
  }, [disabled, finishDrag, resetDrag]);

  const getPanHandlers = useCallback((position: number) => {
    if (!panHandlerCacheRef.current[position]) {
      panHandlerCacheRef.current[position] = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => !disabled && isMeaningfulDrag(gestureState),
        onPanResponderGrant: () => {
          if (disabled) return;
          hasDraggedRef.current = false;
          dragOffset.setValue({ x: 0, y: 0 });
          setDraggingPosition(position);
          triggerSelectionHaptic();
          Animated.spring(draggingScale, {
            toValue: 1.15,
            useNativeDriver: false,
            speed: 50,
            bounciness: 4,
          }).start();
        },
        onPanResponderMove: (_, gestureState) => {
          if (disabled) return;
          if (isMeaningfulDrag(gestureState)) {
            hasDraggedRef.current = true;
            const target = getDropTargetPosition(position, gestureState);
            setDropTargetPosition(target !== position ? target : null);
          }
          dragOffset.setValue({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (_, gestureState) => {
          finishDrag(position, gestureState);
        },
        onPanResponderTerminate: resetDrag,
        onPanResponderTerminationRequest: () => false,
      }).panHandlers;
    }
    return panHandlerCacheRef.current[position];
  }, [disabled, dragOffset, draggingScale, finishDrag, getDropTargetPosition, resetDrag]);

  const getDragStyle = useCallback((position: number) => {
    if (draggingPosition !== position) return null;

    return {
      elevation: 14,
      zIndex: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      transform: [
        ...dragOffset.getTranslateTransform(),
        { scale: draggingScale },
      ],
    };
  }, [dragOffset, draggingPosition, draggingScale]);

  const shouldIgnorePress = useCallback(() => dragJustEndedRef.current, []);

  return {
    getDragStyle,
    getPanHandlers,
    handleChipLayout,
    shouldIgnorePress,
    draggingPosition,
    dropTargetPosition,
  };
};
