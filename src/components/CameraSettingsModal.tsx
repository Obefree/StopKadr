import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StopMotionProject } from '../models/types';
import { CAMERA_RATIOS, CameraRatio, lensLabel } from '../models/cameraTypes';
import type { ExportResolution } from '../models/types';
import { ThumbSlider } from './ThumbSlider';
import { StepperControl } from './StepperControl';

type Props = {
  visible: boolean;
  project: StopMotionProject;
  availableLenses: string[];
  availablePictureSizes: string[];
  onClose: () => void;
  onSave: (p: StopMotionProject) => void;
};

function ratioChipLabel(r: CameraRatio): string {
  if (r === '16:9') return '16∶9 широкий';
  if (r === '4:3') return '4∶3';
  return Platform.OS === 'android' ? '1∶1 (обрезка)' : '1∶1';
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function CameraSettingsModal({
  visible,
  project,
  availableLenses,
  availablePictureSizes,
  onClose,
  onSave,
}: Props) {
  const [local, setLocal] = useState(project);

  useEffect(() => {
    if (visible) setLocal(project);
  }, [visible, project]);

  const setCam = (patch: Partial<StopMotionProject['settings']>) => {
    setLocal({ ...local, settings: { ...local.settings, ...patch } });
  };

  const exportResolutions: { id: ExportResolution; label: string }[] = [
    { id: 'fullHD1080', label: '1080p' },
    { id: 'hd720', label: '720p' },
    { id: 'vertical1080x1920', label: '9:16' },
    { id: 'square1080', label: '1:1' },
    { id: 'originalAspect', label: 'Original' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView style={styles.scroll}>
            <Text style={styles.title}>Настройки</Text>

            <Text style={styles.section}>Камера</Text>
            <View style={styles.row}>
              <Chip
                label="Задняя"
                active={local.settings.cameraFacing === 'back'}
                onPress={() => setCam({ cameraFacing: 'back' })}
              />
              <Chip
                label="Фронт"
                active={local.settings.cameraFacing === 'front'}
                onPress={() => setCam({ cameraFacing: 'front' })}
              />
            </View>

            {availableLenses.length > 0 ? (
              <>
                <Text style={styles.label}>Объектив (iPhone)</Text>
                <View style={styles.rowWrap}>
                  <Chip
                    label="Авто"
                    active={!local.settings.selectedLens}
                    onPress={() => setCam({ selectedLens: '' })}
                  />
                  {availableLenses.map((lens) => (
                    <Chip
                      key={lens}
                      label={lensLabel(lens)}
                      active={local.settings.selectedLens === lens}
                      onPress={() => setCam({ selectedLens: lens })}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.label}>Пропорции превью (ширина∶высота)</Text>
            <View style={styles.row}>
              {CAMERA_RATIOS.map((r) => (
                <Chip
                  key={r}
                  label={ratioChipLabel(r)}
                  active={local.settings.cameraRatio === r}
                  onPress={() => setCam({ cameraRatio: r, pictureSize: '' })}
                />
              ))}
            </View>

            <Text style={styles.label}>Разрешение кадра (качество)</Text>
            <View style={styles.rowWrap}>
              <Chip
                label="Авто"
                active={!local.settings.pictureSize}
                onPress={() => setCam({ pictureSize: '' })}
              />
              {availablePictureSizes.slice(0, 12).map((size) => (
                <Chip
                  key={size}
                  label={size}
                  active={local.settings.pictureSize === size}
                  onPress={() => setCam({ pictureSize: size })}
                />
              ))}
            </View>

            <Text style={styles.hint}>
              Зум: щипок двумя пальцами или свайп вверх/вниз по экрану камеры.
            </Text>

            <ThumbSlider
              label="JPEG качество"
              value={local.settings.captureQuality}
              minimumValue={0.5}
              maximumValue={1}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setCam({ captureQuality: v })}
            />

            <Pressable
              style={styles.toggleRow}
              onPress={() => {
                const next = !local.settings.continuousAutofocus;
                setCam({ continuousAutofocus: next, lockFocus: !next });
              }}
            >
              <Text style={styles.toggleText}>Непрерывный автофокус</Text>
              <Text style={styles.toggleText}>
                {local.settings.continuousAutofocus ? 'Вкл' : 'Выкл'}
              </Text>
            </Pressable>
            <Text style={styles.hint}>
              Выкл: фокус фиксируется. Долгое нажатие на превью — фокус в точке (жёлтая рамка).
            </Text>

            <Text style={styles.label}>Вспышка</Text>
            <View style={styles.row}>
              {(['off', 'auto', 'on'] as const).map((f) => (
                <Chip
                  key={f}
                  label={f === 'off' ? 'Выкл' : f === 'auto' ? 'Авто' : 'Вкл'}
                  active={local.settings.flash === f}
                  onPress={() => setCam({ flash: f })}
                />
              ))}
            </View>

            <Pressable
              style={styles.toggleRow}
              onPress={() => setCam({ enableTorch: !local.settings.enableTorch })}
            >
              <Text style={styles.toggleText}>Фонарик (torch)</Text>
              <Text style={styles.toggleText}>{local.settings.enableTorch ? 'Вкл' : 'Выкл'}</Text>
            </Pressable>

            <Pressable
              style={styles.toggleRow}
              onPress={() => setCam({ mirrorFrontCamera: !local.settings.mirrorFrontCamera })}
            >
              <Text style={styles.toggleText}>Зеркало (фронт)</Text>
              <Text style={styles.toggleText}>{local.settings.mirrorFrontCamera ? 'Вкл' : 'Выкл'}</Text>
            </Pressable>

            <Pressable
              style={styles.toggleRow}
              onPress={() => setCam({ responsiveOrientation: !local.settings.responsiveOrientation })}
            >
              <Text style={styles.toggleText}>Поворот при съёмке (iOS)</Text>
              <Text style={styles.toggleText}>
                {local.settings.responsiveOrientation ? 'Вкл' : 'Выкл'}
              </Text>
            </Pressable>

            <Text style={styles.section}>Съёмка</Text>

            <StepperControl
              label="FPS"
              value={local.settings.fps}
              step={0.5}
              min={1}
              max={60}
              format={(v) => v.toFixed(1)}
              onChange={(fps) => setCam({ fps })}
            />

            <StepperControl
              label="Задержка съёмки (с)"
              value={local.settings.captureDelaySeconds}
              step={0.1}
              min={0}
              max={30}
              format={(v) => v.toFixed(1)}
              onChange={(captureDelaySeconds) => setCam({ captureDelaySeconds })}
            />

            <ThumbSlider
              label="Onion skin"
              value={local.settings.onionSkinOpacity}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setCam({ onionSkinOpacity: v })}
            />

            <Pressable
              style={styles.toggleRow}
              onPress={() => setCam({ showGrid: !local.settings.showGrid })}
            >
              <Text style={styles.toggleText}>Сетка</Text>
              <Text style={styles.toggleText}>{local.settings.showGrid ? 'Вкл' : 'Выкл'}</Text>
            </Pressable>

            <Text style={styles.section}>Экспорт видео</Text>
            <View style={styles.rowWrap}>
              {exportResolutions.map((r) => (
                <Chip
                  key={r.id}
                  label={r.label}
                  active={local.settings.resolution === r.id}
                  onPress={() => setCam({ resolution: r.id })}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose}>
              <Text style={styles.cancel}>Отмена</Text>
            </Pressable>
            <Pressable onPress={() => onSave(local)}>
              <Text style={styles.save}>Сохранить</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#1a1a24',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
  },
  scroll: { padding: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  section: { color: '#ffeb3b', fontWeight: '600', marginTop: 16, marginBottom: 8 },
  label: { color: '#aaa', fontSize: 12, marginBottom: 6, marginTop: 4 },
  hint: { color: '#666', fontSize: 11, marginBottom: 10, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a36',
  },
  chipActive: { backgroundColor: '#ffeb3b' },
  chipText: { color: '#ccc', fontSize: 13 },
  chipTextActive: { color: '#0a0a0f', fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  toggleText: { color: '#fff', fontSize: 15 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  cancel: { color: '#888', fontSize: 16 },
  save: { color: '#ffeb3b', fontSize: 16, fontWeight: '700' },
});
