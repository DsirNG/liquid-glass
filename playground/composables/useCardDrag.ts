import { ref, reactive, nextTick } from 'vue';

export function useCardDrag(onResize?: () => void) {
  const cardPos = reactive({ x: 0, y: 0 });
  const isDragging = ref(false);

  let dragStartX = 0;
  let dragStartY = 0;
  let initialCardX = 0;
  let initialCardY = 0;

  function handlePointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('button, input, a, .progress-bar')) {
      return;
    }
    isDragging.value = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialCardX = cardPos.x;
    initialCardY = cardPos.y;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging.value) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    cardPos.x = initialCardX + dx;
    cardPos.y = initialCardY + dy;
    onResize?.();
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging.value) return;
    isDragging.value = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    onResize?.();
  }

  function resetPosition() {
    cardPos.x = 0;
    cardPos.y = 0;
    nextTick(() => {
      onResize?.();
    });
  }

  return {
    cardPos,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPosition,
  };
}
