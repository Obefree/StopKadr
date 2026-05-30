import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export type FocusPoint = { x: number; y: number; visible: boolean };

type Props = {
  zoom: number;
  onZoomChange: (z: number) => void;
  onZoomCommit: (z: number) => void;
  onFocusAt: (x: number, y: number) => void;
};

/** Щипок и свайп вверх/вниз = зум. Долгое нажатие = фокус в точке. */
export function CameraGestureOverlay({
  zoom,
  onZoomChange,
  onZoomCommit,
  onFocusAt,
}: Props) {
  const [focus, setFocus] = useState<FocusPoint>({ x: 0, y: 0, visible: false });
  const zoomBase = useRef(zoom);
  const zoomRef = useRef(zoom);
  const focusHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const showFocus = (x: number, y: number) => {
    setFocus({ x, y, visible: true });
    if (focusHideTimer.current) clearTimeout(focusHideTimer.current);
    focusHideTimer.current = setTimeout(() => {
      setFocus((f) => ({ ...f, visible: false }));
    }, 1400);
    onFocusAt(x, y);
  };

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      zoomBase.current = zoomRef.current;
    })
    .onUpdate((e) => {
      onZoomChange(clamp(zoomBase.current * e.scale));
    })
    .onEnd((e) => {
      const next = clamp(zoomBase.current * e.scale);
      onZoomCommit(next);
      zoomBase.current = next;
    });

  const panZoom = Gesture.Pan()
    .maxPointers(1)
    .minDistance(12)
    .onBegin(() => {
      zoomBase.current = zoomRef.current;
    })
    .onUpdate((e) => {
      onZoomChange(clamp(zoomBase.current - e.translationY / 360));
    })
    .onEnd((e) => {
      const next = clamp(zoomBase.current - e.translationY / 360);
      onZoomCommit(next);
      zoomBase.current = next;
    });

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .maxDistance(20)
    .onStart((e) => {
      showFocus(e.x, e.y);
    });

  const gesture = Gesture.Simultaneous(longPress, Gesture.Race(pinch, panZoom));

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill} collapsable={false}>
        {focus.visible ? (
          <View
            pointerEvents="none"
            style={[styles.focusRing, { left: focus.x - 36, top: focus.y - 36 }]}
          />
        ) : null}
      </View>
    </GestureDetector>
  );
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}

const styles = StyleSheet.create({
  focusRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderWidth: 2,
    borderColor: '#ffeb3b',
    borderRadius: 4,
    backgroundColor: 'rgba(255,235,59,0.08)',
  },
});
