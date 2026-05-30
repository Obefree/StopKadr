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
  replaceFrame,
  saveProject,
} from '../store/projectStore';
import { Timeline } from '../components/Timeline';
import { GridOverlay } from '../components/GridOverlay';
import { CameraSettingsModal } from '../components/CameraSettingsModal';
import { CameraGestureOverlay } from '../components/CameraGestureOverlay';
import {
  CameraPreviewViewport,
  overlayResizeMode,
} from '../components/CameraPreviewViewport';
import { ThumbSlider } from '../components/ThumbSlider';
import { StepperControl } from '../components/StepperControl';
import type { FocusMode } from 'expo-camera';
import { exportProjectToMp4 } from '../export/videoExport';
import { captureStill } from '../utils/capturePhoto';
import { nativeCameraRatio, shouldCropCaptureToSquare } from '../utils/cameraRatio';
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
  const [reshootFrameId, setReshootFrameId] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [syncOpen, setSyncOpen] = useState(false);
  const [liveZoom, setLiveZoom] = useState(0);
  const [focusPulse, setFocusPulse] = useState(false);
  const focusPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  React.useEffect(() => {
    if (project) setLiveZoom(project.settings.zoom);
  }, [project?.settings.zoom]);

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
  const reshootTarget = reshootFrameId
    ? frames.find((f) => f.id === reshootFrameId) ?? null
    : null;
  const onionFrame = reshootTarget
    ? (() => {
        const i = frames.findIndex((f) => f.id === reshootTarget.id);
        return i > 0 ? frames[i - 1] : null;
      })()
    : lf;
  const onionUri = onionFrame ? frameUri(project.id, onionFrame.imagePath) : null;

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
      const uri = await captureStill(cameraRef.current, {
        quality: s.captureQuality,
        cropSquare: shouldCropCaptureToSquare(s.cameraRatio),
      });
      let updated = project;
      if (reshootTarget) {
        updated = await replaceFrame(project, reshootTarget, uri);
        setReshootFrameId(null);
      } else {
        updated = await addFrame(project, uri);
      }
      setProject(updated);
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

  const startReshoot = (frameId?: string) => {
    const id = frameId ?? selectedFrameId ?? frames.at(-1)?.id;
    if (!id) return;
    setReshootFrameId(id);
    setSelectedFrameId(id);
  };

  const confirmDeleteFrame = (frame: (typeof frames)[0]) => {
    Alert.alert(
      'Удалить кадр?',
      `Кадр №${frame.index} будет удалён без восстановления.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteFrame(project, frame);
            setProject(updated);
            if (selectedFrameId === frame.id) setSelectedFrameId(null);
            if (reshootFrameId === frame.id) setReshootFrameId(null);
          },
        },
      ],
    );
  };

  const onFrameLongPress = (frame: (typeof frames)[0]) => {
    setSelectedFrameId(frame.id);
    Alert.alert(`Кадр №${frame.index}`, undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Переснять', onPress: () => startReshoot(frame.id) },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => confirmDeleteFrame(frame),
      },
    ]);
  };

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);
  const mirror = s.cameraFacing === 'front' && s.mirrorFrontCamera;

  const onFocusAt = (_x: number, _y: number) => {
    if (focusPulseTimer.current) clearTimeout(focusPulseTimer.current);
    setFocusPulse(true);
    focusPulseTimer.current = setTimeout(() => setFocusPulse(false), 320);
  };

  const autofocus: FocusMode = focusPulse
    ? s.continuousAutofocus
      ? 'on'
      : 'off'
    : s.continuousAutofocus
      ? 'off'
      : 'on';

  const commitZoom = (z: number) => {
    setLiveZoom(z);
    persistSettings({ ...project, settings: { ...s, zoom: z } });
  };

  return (
    <View style={styles.root}>
      <View style={styles.cameraWrap}>
        <CameraPreviewViewport ratio={s.cameraRatio}>
          <CameraView
            key={`${s.cameraFacing}-${nativeCameraRatio(s.cameraRatio)}`}
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={s.cameraFacing}
            mirror={mirror}
            zoom={liveZoom}
            autofocus={autofocus}
            flash={s.flash}
            enableTorch={s.enableTorch}
            ratio={nativeCameraRatio(s.cameraRatio)}
            pictureSize={
              s.cameraRatio === '1:1' && Platform.OS === 'android'
                ? undefined
                : s.pictureSize || undefined
            }
            selectedLens={s.selectedLens || undefined}
            responsiveOrientationWhenOrientationLocked={s.responsiveOrientation}
            onCameraReady={onCameraReady}
            onAvailableLensesChanged={onAvailableLensesChanged}
          />
          {onionUri && s.onionSkinOpacity > 0 ? (
            <Image
              source={{ uri: onionUri }}
              style={[
                StyleSheet.absoluteFill,
                styles.onion,
                { opacity: s.onionSkinOpacity },
                mirror ? styles.onionMirror : null,
              ]}
              resizeMode={overlayResizeMode(s.cameraRatio)}
            />
          ) : null}
          {s.showGrid ? <GridOverlay divisions={s.gridDivisions} /> : null}

          <CameraGestureOverlay
            zoom={liveZoom}
            onZoomChange={setLiveZoom}
            onZoomCommit={commitZoom}
            onFocusAt={onFocusAt}
          />
        </CameraPreviewViewport>

        <Text style={[styles.zoomHint, { top: insets.top + 48 }]}>
          {Math.round(liveZoom * 100)}% · щипок / свайп
        </Text>

        {reshootTarget ? (
          <View style={[styles.reshootBanner, { top: insets.top + 44 }]}>
            <Text style={styles.reshootBannerText}>
              Пересъёмка кадра №{reshootTarget.index} — нажмите затвор
            </Text>
            <Pressable onPress={() => setReshootFrameId(null)} hitSlop={8}>
              <Text style={styles.reshootCancel}>Отмена</Text>
            </Pressable>
          </View>
        ) : null}

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
            onPress={() => selected && confirmDeleteFrame(selected)}
          />
          <SmallBtn
            label="Переснять"
            disabled={frames.length === 0}
            onPress={() => startReshoot()}
          />
          <SmallBtn label="Play" disabled={frames.length === 0} onPress={() => navigation.navigate('Playback', { projectId })} />
          <SmallBtn label="Export" disabled={frames.length === 0 || exporting} onPress={onExport} />
        </View>

        <View style={styles.sliders}>
          <ThumbSlider
            label="Onion skin"
            value={s.onionSkinOpacity}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setProject({ ...project, settings: { ...s, onionSkinOpacity: v } })}
            onChangeEnd={(v) =>
              persistSettings({ ...project, settings: { ...s, onionSkinOpacity: v } })
            }
          />
          <StepperControl
            label="FPS"
            value={s.fps}
            step={0.5}
            min={1}
            max={60}
            format={(v) => v.toFixed(1)}
            onChange={(fps) => persistSettings({ ...project, settings: { ...s, fps } })}
          />
        </View>

        {selected ? (
          <Text style={styles.frameHint}>
            Кадр №{selected.index} · долгое нажатие на миниатюре — меню
          </Text>
        ) : frames.length > 0 ? (
          <Text style={styles.frameHint}>Выберите кадр в ленте для удаления или пересъёмки</Text>
        ) : null}

        <Timeline
          project={project}
          frames={frames}
          selectedId={selectedFrameId}
          reshootId={reshootFrameId}
          onSelect={setSelectedFrameId}
          onLongPress={onFrameLongPress}
        />
      </View>

      <Pressable
        style={[styles.capture, { bottom: bottomPad + 16 }]}
        onPress={capture}
        disabled={capturing}
      >
        <View
          style={[
            styles.captureInner,
            capturing && styles.captureBusy,
            reshootTarget && styles.captureReshoot,
          ]}
        />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  centered: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { color: '#ccc', marginBottom: 16, textAlign: 'center' },
  permissionHint: { color: '#666', marginTop: 12, fontSize: 12, textAlign: 'center' },
  permissionBtn: { backgroundColor: '#ffeb3b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  permissionBtnText: { color: '#0a0a0f', fontWeight: '600' },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  onion: { zIndex: 1 },
  onionMirror: { transform: [{ scaleX: -1 }] },
  zoomHint: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    zIndex: 2,
  },
  topBar: {
    position: 'absolute',
    right: 12,
    left: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  sliders: { paddingHorizontal: 8, marginBottom: 4 },
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
  captureReshoot: { backgroundColor: '#ffeb3b' },
  reshootBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,235,59,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reshootBannerText: { flex: 1, color: '#0a0a0f', fontSize: 12, fontWeight: '600', marginRight: 8 },
  reshootCancel: { color: '#0a0a0f', fontSize: 13, fontWeight: '700' },
  frameHint: { color: '#888', fontSize: 11, paddingHorizontal: 12, marginBottom: 4 },
  exportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  exportText: { color: '#fff', marginBottom: 12 },
});
