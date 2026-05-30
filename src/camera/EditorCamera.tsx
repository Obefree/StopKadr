import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import type { FocusMode } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import type { CameraRatio, CameraFlash, CameraFacing } from '../models/cameraTypes';
import { ratioAspect } from '../models/cameraTypes';
import { ANDROID_SENSOR_ASPECT, previewCoverScale } from './androidPreviewCover';
import { GridOverlay } from '../components/GridOverlay';
import { OnionSkinOverlay } from '../components/OnionSkinOverlay';
import { CameraGestureOverlay } from '../components/CameraGestureOverlay';
import { AndroidZoomControls } from '../components/android/AndroidZoomControls';

export const CAMERA_BUILD = 'frame-wysiwyg-0.5.4-cover';

type CameraRef = React.ElementRef<typeof CameraView> | null;
type Px = { w: number; h: number };

export type EditorCameraHandle = {
  takeFrame: (quality: number) => Promise<string>;
  getCamera: () => CameraRef;
};

type Props = {
  active: boolean;
  ratio: CameraRatio;
  facing: CameraFacing;
  mirror: boolean;
  zoom: number;
  flash: CameraFlash;
  enableTorch: boolean;
  autofocus: FocusMode;
  onionUri: string | null;
  onionOpacity: number;
  showOnion: boolean;
  showGrid: boolean;
  gridDivisions: number;
  onCameraReady: () => void;
  onMountError: (event: { message: string }) => void;
  onZoomChange: (z: number) => void;
  onZoomCommit: (z: number) => void;
  onFocusAt?: (x: number, y: number) => void;
  pictureSize?: string;
  selectedLens?: string;
};

/** Жёлтая рамка = кадр. Android: cover-масштаб как у onion (cover). */
export const EditorCamera = forwardRef<EditorCameraHandle, Props>(function EditorCamera(
  props,
  ref,
) {
  const {
    active,
    ratio,
    facing,
    mirror,
    zoom,
    flash,
    enableTorch,
    autofocus,
    onionUri,
    onionOpacity,
    showOnion,
    showGrid,
    gridDivisions,
    onCameraReady,
    onMountError,
    onZoomChange,
    onZoomCommit,
    onFocusAt,
    pictureSize,
    selectedLens,
  } = props;

  const cameraRef = useRef<CameraRef>(null);
  const shootPx = useRef<Px>({ w: 0, h: 0 });
  const [box, setBox] = useState<Px>({ w: 0, h: 0 });
  const isAndroid = Platform.OS === 'android';

  const frame = useMemo(() => fitShootArea(box.w, box.h, ratio), [box.w, box.h, ratio]);
  const ready = frame.w > 1 && frame.h > 1;

  const androidCover = useMemo(() => {
    if (!isAndroid || !ready) return 1;
    return previewCoverScale(frame.w, frame.h, ANDROID_SENSOR_ASPECT);
  }, [isAndroid, ready, frame.w, frame.h]);

  useImperativeHandle(ref, () => ({
    takeFrame: async (quality) => {
      const cam = cameraRef.current;
      if (!cam?.takePictureAsync) throw new Error('Камера не готова');
      const photo = await cam.takePictureAsync({
        quality: Math.min(1, Math.max(0.5, quality)),
        skipProcessing: false,
        exif: false,
      });
      if (!photo?.uri) throw new Error('Нет файла с камеры');
      const pw = photo.width ?? 0;
      const ph = photo.height ?? 0;
      const { w: fw, h: fh } = shootPx.current;
      const target = fw >= 2 && fh >= 2 ? fw / fh : ratioAspect(ratio);
      if (pw < 2 || ph < 2) return photo.uri;
      return centerCropToAspect(photo.uri, pw, ph, target);
    },
    getCamera: () => cameraRef.current,
  }));

  const tag = isAndroid
    ? `${ratio} · cover · ${CAMERA_BUILD}`
    : `${ratio} · ${CAMERA_BUILD}`;

  const cameraStyle = isAndroid
    ? [StyleSheet.absoluteFill, { transform: [{ scale: androidCover }] }]
    : StyleSheet.absoluteFill;

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBox((b) => (b.w === width && b.h === height ? b : { w: width, h: height }));
      }}
    >
      <View
        style={[styles.shootFrame, ready && { width: frame.w, height: frame.h }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          shootPx.current = { w: width, h: height };
        }}
      >
        {ready ? (
          <View style={styles.previewClip}>
            <CameraView
              key={`${facing}-${isAndroid ? 'cover' : ratio}`}
              ref={cameraRef}
              style={cameraStyle}
              active={active}
              mode="picture"
              facing={facing}
              mirror={mirror}
              zoom={zoom}
              autofocus={autofocus}
              flash={flash}
              enableTorch={enableTorch}
              ratio={isAndroid ? undefined : ratio}
              pictureSize={pictureSize}
              selectedLens={selectedLens}
              responsiveOrientationWhenOrientationLocked={!isAndroid}
              onCameraReady={onCameraReady}
              onMountError={onMountError}
            />
          </View>
        ) : null}

        <OnionSkinOverlay
          uri={onionUri ?? ''}
          opacity={onionOpacity}
          mirror={mirror}
          visible={showOnion && Boolean(onionUri)}
        />

        {showGrid ? <GridOverlay divisions={gridDivisions} /> : null}

        {isAndroid ? (
          <>
            <AndroidZoomControls zoom={zoom} onZoomChange={onZoomChange} onCommit={onZoomCommit} />
            <Text style={styles.tag}>{tag}</Text>
          </>
        ) : (
          <CameraGestureOverlay
            zoom={zoom}
            onZoomChange={onZoomChange}
            onZoomCommit={onZoomCommit}
            onFocusAt={onFocusAt ?? (() => {})}
          >
            <Text style={styles.tag}>{tag}</Text>
          </CameraGestureOverlay>
        )}
      </View>
    </View>
  );
});

function fitShootArea(boxW: number, boxH: number, ratio: CameraRatio): Px {
  const aspect = ratioAspect(ratio);
  if (boxW <= 0 || boxH <= 0) return { w: 0, h: 0 };
  if (boxW / boxH > aspect) {
    const h = boxH;
    return { w: h * aspect, h };
  }
  return { w: boxW, h: boxW / aspect };
}

async function centerCropToAspect(
  uri: string,
  photoW: number,
  photoH: number,
  targetAspect: number,
): Promise<string> {
  const actual = photoW / photoH;
  if (Math.abs(actual - targetAspect) < 0.02) return uri;

  let cropW: number;
  let cropH: number;
  let originX: number;
  let originY: number;

  if (actual > targetAspect) {
    cropH = photoH;
    cropW = Math.round(photoH * targetAspect);
    originX = Math.round((photoW - cropW) / 2);
    originY = 0;
  } else {
    cropW = photoW;
    cropH = Math.round(photoW / targetAspect);
    originX = 0;
    originY = Math.round((photoH - cropH) / 2);
  }

  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { originX, originY, width: cropW, height: cropH } }],
    { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
  );
  return out.uri;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shootFrame: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffeb3b',
    backgroundColor: '#000',
  },
  previewClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
});
