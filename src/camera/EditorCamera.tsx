import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import type { FocusMode } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import type { CameraRatio, CameraFlash, CameraFacing } from '../models/cameraTypes';
import { ratioAspect } from '../models/cameraTypes';
import { coverCropRect } from './coverCrop';
import { GridOverlay } from '../components/GridOverlay';
import { OnionSkinOverlay } from '../components/OnionSkinOverlay';
import { CameraGestureOverlay } from '../components/CameraGestureOverlay';

export const CAMERA_BUILD = 'frame-wysiwyg-0.5.8-align';

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
  shutterSoundEnabled: boolean;
  onionUri: string | null;
  onionOpacity: number;
  showOnion: boolean;
  showGrid: boolean;
  gridDivisions: number;
  onCameraReady: () => void;
  onMountError: (event: { message: string }) => void;
  onZoomChange: (z: number) => void;
  onZoomCommit: (z: number) => void;
  onFocusAt: (x: number, y: number) => void;
  pictureSize?: string;
  selectedLens?: string;
};

/**
 * Android: ratio не задаём — CameraX FILL (без доп. scale, иначе зум ≠ снимок).
 * Снимок: cover-crop + resize в пиксели рамки = то же, что onion cover поверх превью.
 */
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
    shutterSoundEnabled,
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

  useImperativeHandle(ref, () => ({
    takeFrame: async (quality) => {
      const cam = cameraRef.current;
      if (!cam?.takePictureAsync) throw new Error('Камера не готова');
      const photo = await cam.takePictureAsync({
        quality: Math.min(1, Math.max(0.5, quality)),
        skipProcessing: false,
        exif: false,
        shutterSound: shutterSoundEnabled === true,
      });
      if (!photo?.uri) throw new Error('Нет файла с камеры');
      const pw = photo.width ?? 0;
      const ph = photo.height ?? 0;
      const { w: fw, h: fh } = shootPx.current;
      if (pw < 2 || ph < 2) return photo.uri;
      if (fw < 2 || fh < 2) return cropPhotoToFrameAspect(photo.uri, pw, ph, ratioAspect(ratio));
      return cropPhotoToFramePixels(photo.uri, pw, ph, fw, fh);
    },
    getCamera: () => cameraRef.current,
  }));

  const tag = isAndroid
    ? `${ratio} · fill · ${CAMERA_BUILD}`
    : `${ratio} · ${CAMERA_BUILD}`;

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
              key={`${facing}-${isAndroid ? 'fill' : ratio}`}
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              active={active}
              mode="picture"
              facing={facing}
              mirror={mirror}
              zoom={zoom}
              autofocus={autofocus}
              flash={flash}
              enableTorch={enableTorch}
              ratio={isAndroid ? undefined : ratio}
              animateShutter={shutterSoundEnabled === true}
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

        <CameraGestureOverlay
          zoom={zoom}
          onZoomChange={onZoomChange}
          onZoomCommit={onZoomCommit}
          onFocusAt={onFocusAt}
        />

        <Text style={styles.tag} pointerEvents="none">
          {tag}
        </Text>
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

async function cropPhotoToFrameAspect(
  uri: string,
  photoW: number,
  photoH: number,
  frameAspect: number,
): Promise<string> {
  const actual = photoW / photoH;
  if (Math.abs(actual - frameAspect) < 0.02) return uri;
  const crop = coverCropRect(photoW, photoH, frameAspect);
  const out = await ImageManipulator.manipulateAsync(uri, [{ crop }], {
    compress: 0.92,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return out.uri;
}

/** Cover как FILL превью + resize в пиксели рамки — onion совпадает с объективом. */
async function cropPhotoToFramePixels(
  uri: string,
  photoW: number,
  photoH: number,
  frameW: number,
  frameH: number,
): Promise<string> {
  const frameAspect = frameW / frameH;
  const fw = Math.round(frameW);
  const fh = Math.round(frameH);
  const ops: ImageManipulator.Action[] = [];
  const actual = photoW / photoH;
  if (Math.abs(actual - frameAspect) >= 0.02) {
    ops.push({ crop: coverCropRect(photoW, photoH, frameAspect) });
  }
  ops.push({ resize: { width: fw, height: fh } });
  const out = await ImageManipulator.manipulateAsync(uri, ops, {
    compress: 0.92,
    format: ImageManipulator.SaveFormat.JPEG,
  });
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
