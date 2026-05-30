import React from 'react';
import { StyleSheet, View } from 'react-native';

export function GridOverlay({ divisions }: { divisions: number }) {
  const n = Math.max(2, divisions);
  const vLines = Array.from({ length: n - 1 }, (_, i) => i + 1);
  const hLines = vLines;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {vLines.map((i) => (
        <View
          key={`v-${i}`}
          style={[styles.line, { left: `${(i / n) * 100}%`, width: 1, height: '100%' }]}
        />
      ))}
      {hLines.map((i) => (
        <View
          key={`h-${i}`}
          style={[styles.line, { top: `${(i / n) * 100}%`, height: 1, width: '100%' }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
