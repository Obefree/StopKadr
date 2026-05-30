import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
};

export function StepperControl({ label, value, step, min, max, format, onChange }: Props) {
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const applyDelta = (delta: number) => {
    const next = clamp(round(valueRef.current + delta, step), min, max);
    if (next === valueRef.current) return;
    valueRef.current = next;
    onChange(next);
  };

  const display = format ? format(value) : String(value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <HoldStepButton label="−" onStep={() => applyDelta(-step)} />
        <Text style={styles.value}>{display}</Text>
        <HoldStepButton label="+" onStep={() => applyDelta(step)} />
      </View>
    </View>
  );
}

function HoldStepButton({ label, onStep }: { label: string; onStep: () => void }) {
  const holdStart = useRef(0);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const clearTimers = () => {
    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  };

  const burstCount = () => {
    const held = Date.now() - holdStart.current;
    if (held > 1800) return 10;
    if (held > 1100) return 6;
    if (held > 650) return 3;
    if (held > 320) return 2;
    return 1;
  };

  const tick = () => {
    const n = burstCount();
    for (let i = 0; i < n; i++) onStepRef.current();
  };

  const startRepeat = () => {
    clearTimers();
    holdStart.current = Date.now();
    onStepRef.current();
    delayTimer.current = setTimeout(() => {
      tick();
      repeatTimer.current = setInterval(tick, 55);
    }, 280);
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <Pressable
      style={styles.btn}
      onPressIn={startRepeat}
      onPressOut={clearTimers}
      delayLongPress={Number.MAX_SAFE_INTEGER}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

function round(v: number, step: number): number {
  const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 1 : 0;
  const p = 10 ** decimals;
  return Math.round(v * p) / p;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  label: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#ffeb3b', fontSize: 24, fontWeight: '300', marginTop: -2 },
  value: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '600' },
});
