import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { CameraSettingsModal } from '../components/CameraSettingsModal';
import { exportProjectToMp4 } from '../export/videoExport';
import { captureStill } from '../utils/capturePhoto';
import { saveVideoToDevice } from '../utils/mediaSave';
import { SyncSheet } from '../components/SyncSheet';
import { useCameraCapabilities } from '../hooks/useCameraCapabilities';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

export default function EditorScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<React.ElementRef<typeof CameraView>>(null);
  const { lenses, pictureSizes, refresh: refreshCameraCaps } = useCameraCapabilities();
  const [permission, requestPermission] = useCameraPermissions();
  const [project, setProject] = useState<Awaited<ReturnType<typeof loadProject>>>(null);
  const [capturing, setCapturing] = useState(false);
  const [reshoot, setReshoot] = useState(false);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [syncOpen, setSyncOpen] = useState(false);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setSyncOpen(true)} hitSlop={12} style={{ marginRight: 8 }}>
          <Text style={{ color: '#ffeb3b', fontWeight: '600' }}>Сохранить</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const onCameraReady = useCallback(() => {
    refreshCameraCaps(cameraRef.current);
  }, [refreshCameraCaps]);

  const onAvailableLensesChanged = useCallback(
    (event: { lenses: string[] }) => {
      if (Platform.OS === 'ios' && event.lenses?.length) {
        refreshCameraCaps(cameraRef.current);
      }
    },
    [refreshCameraCaps],
  );

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
        {Platform.OS === 'android' && !permission.canAskAgain ? (
          <Text style={styles.permissionHint}>Настройки → Приложения → StopKadr → Разрешения</Text>
        ) : null}
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

  const s = project.settings;
  const frames = sortFrames(project);
  const lf = lastFrame(project);
  const onionUri = lf ? frameUri(project.id, lf.imagePath) : null;

  const persistSettings = async (next: typeof project) => {
    const saved = await saveProject(next);
    setProject(saved);
  };

  const capture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      if (s.captureDelaySeconds > 0) {
        await new Promise((r) => setTimeout(r, s.captureDelaySeconds * 1000));
      }
      const uri = await captureStill(cameraRef.current, s.captureQuality);
      const updated = reshoot
        ? await replaceLastFrame(project, uri)
        : await addFrame(project, uri);
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
      await saveVideoToDevice(out);
    } catch (e) {
      Alert.alert('Экспорт', e instanceof Error ? e.message : 'Не удалось экспортировать');
    } finally {
      setExporting(false);
    }
  };

  const selected = frames.find((f) => f.id === selectedFrameId);
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);
  const mirror = s.cameraFacing === 'front' && s.mirrorFrontCamera;

  return (
    <View style={styles.root}>
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={s.cameraFacing}
          mirror={mirror}
          zoom={s.zoom}
          flash={s.flash}
          enableTorch={s.enableTorch}
          ratio={s.cameraRatio}
          pictureSize={s.pictureSize || undefined}
          selectedLens={s.selectedLens || undefined}
          responsiveOrientationWhenOrientationLocked={s.responsiveOrientation}
          onCameraReady={onCameraReady}
          onAvailableLensesChanged={onAvailableLensesChanged}
        />
        {onionUri && s.onionSkinOpacity > 0 ? (
          <Image
            source={{ uri: onionUri }}
            style={[StyleSheet.absoluteFill, styles.onion, { opacity: s.onionSkinOpacity }]}
            resizeMode="cover"
          />
        ) : null}
        {s.showGrid ? <GridOverlay divisions={s.gridDivisions} /> : null}

        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Pressable
            onPress={() =>
              persistSettings({
                ...project,
                settings: {
                  ...s,
                  cameraFacing: s.cameraFacing === 'back' ? 'front' : 'back',
                },
              })
            }
            hitSlop={12}
          >
            <Ionicons name="camera-reverse" size={26} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setSettingsOpen(true)} hitSlop={12}>
            <Ionicons name="options" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: bottomPad + 88 }]}>
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

        <Text style={styles.sliderLabel}>Onion {Math.round(s.onionSkinOpacity * 100)}%</Text>
        <MiniSlider
          value={s.onionSkinOpacity}
          onChange={(v) => persistSettings({ ...project, settings: { ...s, onionSkinOpacity: v } })}
        />

        <Text style={styles.sliderLabel}>FPS {s.fps}</Text>
        <MiniSlider
          value={(s.fps - 1) / 59}
          onChange={(t) =>
            persistSettings({
              ...project,
              settings: { ...s, fps: Math.round((1 + t * 59) * 2) / 2 },
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

      <Pressable
        style={[styles.capture, { bottom: bottomPad + 16 }]}
        onPress={capture}
        disabled={capturing}
      >
        <View style={[styles.captureInner, capturing && styles.captureBusy]} />
      </Pressable>

      {exporting ? (
        <View style={styles.exportOverlay}>
          <Text style={styles.exportText}>Экспорт {Math.round(exportProgress * 100)}%</Text>
          <ActivityIndicator color="#ffeb3b" />
        </View>
      ) : null}

      <CameraSettingsModal
        visible={settingsOpen}
        project={project}
        availableLenses={lenses}
        availablePictureSizes={pictureSizes}
        onClose={() => setSettingsOpen(false)}
        onSave={async (p) => {
          setProject(await saveProject(p));
          setSettingsOpen(false);
          setTimeout(() => refreshCameraCaps(cameraRef.current), 300);
        }}
      />

      <SyncSheet visible={syncOpen} project={project} onClose={() => setSyncOpen(false)} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  centered: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { color: '#ccc', marginBottom: 16, textAlign: 'center' },
  permissionHint: { color: '#666', marginTop: 12, fontSize: 12, textAlign: 'center' },
  permissionBtn: { backgroundColor: '#ffeb3b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  permissionBtnText: { color: '#0a0a0f', fontWeight: '600' },
  cameraWrap: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  onion: { zIndex: 1 },
  topBar: {
    position: 'absolute',
    right: 12,
    left: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  controls: { paddingTop: 8 },
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
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  captureBusy: { backgroundColor: '#999' },
  exportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  exportText: { color: '#fff', marginBottom: 12 },
});
