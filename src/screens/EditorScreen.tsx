import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { lastFrame, sortFrames } from '../models/types';
import {
  addFrame,
  deleteFrame,
  deleteLastFrame,
  frameUri,
  loadProject,
  replaceLastFrame,
  saveProject,
} from '../store/projectStore';
import { Timeline } from '../components/Timeline';
import { GridOverlay } from '../components/GridOverlay';
import { exportProjectToMp4 } from '../export/videoExport';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

export default function EditorScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [project, setProject] = useState<Awaited<ReturnType<typeof loadProject>>>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturing, setCapturing] = useState(false);
  const [reshoot, setReshoot] = useState(false);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const refresh = useCallback(async () => {
    const p = await loadProject(projectId);
    setProject(p);
  }, [projectId]);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation, refresh]);

  React.useEffect(() => {
    activateKeepAwakeAsync('stopkadr-editor').catch(() => {});
    return () => {
      deactivateKeepAwake('stopkadr-editor');
    };
  }, []);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#ffeb3b" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>Нужен доступ к камере</Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Разрешить</Text>
        </Pressable>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#ffeb3b" />
      </View>
    );
  }

  const frames = sortFrames(project);
  const lf = lastFrame(project);
  const onionUri = lf ? frameUri(project.id, lf.imagePath) : null;
  const opacity = project.settings.onionSkinOpacity;

  const persistSettings = async (next: typeof project) => {
    const saved = await saveProject(next);
    setProject(saved);
  };

  const capture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const delay = project.settings.captureDelaySeconds;
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay * 1000));
      }
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      if (!photo?.uri) throw new Error('Не удалось снять кадр');
      const updated = reshoot
        ? await replaceLastFrame(project, photo.uri)
        : await addFrame(project, photo.uri);
      setProject(updated);
      setReshoot(false);
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Съёмка не удалась');
    } finally {
      setCapturing(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    setExportProgress(0);
    try {
      const out = await exportProjectToMp4(project, setExportProgress);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(out);
        Alert.alert('Готово', 'Видео сохранено в галерею');
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(out, { mimeType: 'video/mp4' });
      }
    } catch (e) {
      Alert.alert('Экспорт', e instanceof Error ? e.message : 'Не удалось экспортировать');
    } finally {
      setExporting(false);
    }
  };

  const selected = frames.find((f) => f.id === selectedFrameId);

  return (
    <View style={styles.root}>
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
        {onionUri && opacity > 0 ? (
          <Image
            source={{ uri: onionUri }}
            style={[StyleSheet.absoluteFill, { opacity }]}
            resizeMode="cover"
          />
        ) : null}
        {project.settings.showGrid ? (
          <GridOverlay divisions={project.settings.gridDivisions} />
        ) : null}

        <View style={styles.topBar}>
          <Pressable onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
            <Ionicons name="camera-reverse" size={26} color="#fff" />
          </Pressable>
          <Text style={styles.delayLabel}>
            Задержка {project.settings.captureDelaySeconds.toFixed(1)} с
          </Text>
          <Pressable onPress={() => setSettingsOpen(true)}>
            <Ionicons name="options" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.row}>
          <SmallBtn label="Undo" disabled={frames.length === 0} onPress={async () => setProject(await deleteLastFrame(project))} />
          <SmallBtn
            label="Удалить"
            disabled={!selected}
            onPress={async () => {
              if (!selected) return;
              setProject(await deleteFrame(project, selected));
              setSelectedFrameId(null);
            }}
          />
          <SmallBtn label="Переснять" disabled={frames.length === 0} onPress={() => setReshoot(true)} />
          <SmallBtn label="Play" disabled={frames.length === 0} onPress={() => navigation.navigate('Playback', { projectId })} />
          <SmallBtn label="Export" disabled={frames.length === 0 || exporting} onPress={onExport} />
        </View>

        <Text style={styles.sliderLabel}>Onion {Math.round(opacity * 100)}%</Text>
        <MiniSlider
          value={opacity}
          onChange={(v) => persistSettings({ ...project, settings: { ...project.settings, onionSkinOpacity: v } })}
        />

        <Text style={styles.sliderLabel}>FPS {project.settings.fps}</Text>
        <MiniSlider
          value={(project.settings.fps - 1) / 59}
          onChange={(t) =>
            persistSettings({
              ...project,
              settings: { ...project.settings, fps: Math.round((1 + t * 59) * 2) / 2 },
            })
          }
        />

        <Timeline
          project={project}
          frames={frames}
          selectedId={selectedFrameId}
          onSelect={setSelectedFrameId}
        />
      </View>

      <Pressable style={[styles.capture, capturing && styles.captureDisabled]} onPress={capture} disabled={capturing}>
        <View style={styles.captureInner} />
      </Pressable>

      {exporting ? (
        <View style={styles.exportOverlay}>
          <Text style={styles.exportText}>Экспорт {Math.round(exportProgress * 100)}%</Text>
          <ActivityIndicator color="#ffeb3b" />
        </View>
      ) : null}

      <SettingsModal
        visible={settingsOpen}
        project={project}
        onClose={() => setSettingsOpen(false)}
        onSave={async (p) => {
          setProject(await saveProject(p));
          setSettingsOpen(false);
        }}
      />
    </View>
  );
}

function SmallBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.smallBtn, disabled && styles.smallBtnDisabled]}>
      <Text style={styles.smallBtnText}>{label}</Text>
    </Pressable>
  );
}

function MiniSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Pressable
      style={styles.track}
      onPress={(e) => {
        const w = (e.nativeEvent as { locationX?: number }).locationX ?? 0;
        onChange(Math.min(1, Math.max(0, w / 280)));
      }}
    >
      <View style={[styles.fill, { width: `${value * 100}%` }]} />
    </Pressable>
  );
}

function SettingsModal({
  visible,
  project,
  onClose,
  onSave,
}: {
  visible: boolean;
  project: NonNullable<Awaited<ReturnType<typeof loadProject>>>;
  onClose: () => void;
  onSave: (p: typeof project) => void;
}) {
  const [local, setLocal] = useState(project);
  React.useEffect(() => {
    if (visible) setLocal(project);
  }, [visible, project]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.settingsCard}>
          <ScrollView>
            <Text style={styles.settingsTitle}>Настройки</Text>
            <Text style={styles.sliderLabel}>Задержка съёмки (с)</Text>
            <MiniSlider
              value={local.settings.captureDelaySeconds / 30}
              onChange={(t) =>
                setLocal({
                  ...local,
                  settings: { ...local.settings, captureDelaySeconds: Math.round(t * 300) / 10 },
                })
              }
            />
            <Text style={styles.settingValue}>{local.settings.captureDelaySeconds.toFixed(1)} с</Text>
            <Pressable style={styles.toggleRow} onPress={() => setLocal({ ...local, settings: { ...local.settings, showGrid: !local.settings.showGrid } })}>
              <Text style={styles.toggleText}>Сетка</Text>
              <Text style={styles.toggleText}>{local.settings.showGrid ? 'Вкл' : 'Выкл'}</Text>
            </Pressable>
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable onPress={onClose}><Text style={styles.cancel}>Отмена</Text></Pressable>
            <Pressable onPress={() => onSave(local)}><Text style={styles.create}>Сохранить</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  centered: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  permissionText: { color: '#ccc', marginBottom: 16 },
  permissionBtn: { backgroundColor: '#ffeb3b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  permissionBtnText: { color: '#0a0a0f', fontWeight: '600' },
  cameraWrap: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  topBar: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  delayLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  controls: { paddingBottom: 88, paddingTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 8, marginBottom: 6 },
  smallBtn: {
    backgroundColor: '#1e1e2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallBtnDisabled: { opacity: 0.4 },
  smallBtnText: { color: '#fff', fontSize: 12 },
  sliderLabel: { color: '#aaa', fontSize: 11, marginLeft: 12, marginTop: 4 },
  track: {
    height: 8,
    marginHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#ffeb3b' },
  capture: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureDisabled: { opacity: 0.5 },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  exportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportText: { color: '#fff', marginBottom: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  settingsCard: { backgroundColor: '#1a1a24', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '50%' },
  settingsTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  settingValue: { color: '#888', marginLeft: 12, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  toggleText: { color: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 12 },
  cancel: { color: '#888' },
  create: { color: '#ffeb3b', fontWeight: '600' },
});
