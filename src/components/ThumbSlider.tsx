import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

type Props = {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void;
};

export function ThumbSlider({
  label,
  value,
  minimumValue,
  maximumValue,
  step = 0.01,
  format,
  onChange,
  onChangeEnd,
}: Props) {
  const display = format ? format(value) : String(value);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{display}</Text>
      </View>
      <Slider
        style={styles.slider}
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={onChange}
        onSlidingComplete={onChangeEnd}
        minimumTrackTintColor="#ffeb3b"
        maximumTrackTintColor="#444"
        thumbTintColor="#ffeb3b"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, paddingHorizontal: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#aaa', fontSize: 12 },
  value: { color: '#fff', fontSize: 12, fontWeight: '600' },
  slider: { width: '100%', height: 40 },
});
