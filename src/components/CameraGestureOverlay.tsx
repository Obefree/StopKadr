import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export type FocusPoint = { x: number; y: number; visible: boolean };

type Props = {
  zoom: number;
  onZoomChange: (z: number) => void;
  onZoomCommit: (z: number) => void;
  onFocusAt: (x: number, y: number) => void;
  children?: React.ReactNode;
};

/**
 * Pinch + vertical drag = zoom. Long press = focus at point.
 */
export function CameraGestureOverlay({
  zoom,
  onZoomChange,
  onZoomCommit,
  onFocusAt,
  children,
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
      const next = clamp(zoomBase.current * e.scale);
      onZoomChange(next);
    })
    .onEnd((e) => {
      const next = clamp(zoomBase.current * e.scale);
      onZoomCommit(next);
      zoomBase.current = next;
    });

  const panZoom = Gesture.Pan()
    .maxPointers(1)
    .minDistance(8)
    .onBegin(() => {
      zoomBase.current = zoomRef.current;
    })
    .onUpdate((e) => {
      const next = clamp(zoomBase.current - e.translationY / 420);
      onZoomChange(next);
    })
    .onEnd((e) => {
      const next = clamp(zoomBase.current - e.translationY / 420);
      onZoomCommit(next);
      zoomBase.current = next;
    });

  const longPress = Gesture.LongPress()
    .minDuration(380)
    .maxDistance(16)
    .onStart((e) => {
      showFocus(e.x, e.y);
    });

  const gesture = Gesture.Simultaneous(
    longPress,
    Gesture.Race(pinch, panZoom),
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill} collapsable={false} pointerEvents="box-none">
        {children}
        {focus.visible ? (
          <View
            pointerEvents="none"
            style={[
              styles.focusRing,
              { left: focus.x - 36, top: focus.y - 36 },
            ]}
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
