import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { expandedFrameUris, loadProject } from '../store/projectStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Playback'>;

const imageProps =
  Platform.OS === 'android'
    ? { fadeDuration: 0 as const, resizeMethod: 'resize' as const }
    : { fadeDuration: 0 as const };

export default function PlaybackScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const insets = useSafeAreaInsets();
  const [uris, setUris] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [shownIndex, setShownIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [fps, setFps] = useState(12);
  const [preloaded, setPreloaded] = useState(false);
  const prefetchGen = useRef(0);

  useEffect(() => {
    loadProject(projectId).then((p) => {
      if (!p) return;
      setFps(Math.max(1, p.settings.fps));
      const list = expandedFrameUris(p);
      setUris(list);
      setTargetIndex(0);
      setShownIndex(0);
      setPreloaded(false);
    });
  }, [projectId]);

  useEffect(() => {
    if (uris.length === 0) return;
    const gen = ++prefetchGen.current;
    setPreloaded(false);
    (async () => {
      const unique = [...new Set(uris)];
      await Promise.all(unique.map((u) => Image.prefetch(u).catch(() => false)));
      if (prefetchGen.current === gen) setPreloaded(true);
    })();
  }, [uris]);

  useEffect(() => {
    const uri = uris[targetIndex];
    if (!uri) return;
    let active = true;
    Image.prefetch(uri)
      .catch(() => false)
      .finally(() => {
        if (active) setShownIndex(targetIndex);
      });
    return () => {
      active = false;
    };
  }, [targetIndex, uris]);

  useEffect(() => {
    if (!playing || uris.length === 0 || !preloaded) return;
    const ms = Math.max(50, 1000 / fps);
    const id = setInterval(() => {
      setTargetIndex((i) => (i + 1 < uris.length ? i + 1 : 0));
    }, ms);
    return () => clearInterval(id);
  }, [playing, uris.length, fps, preloaded]);

  const shownUri = uris[shownIndex] ?? null;

  return (
    <View style={styles.root}>
      {uris.length === 0 ? (
        <Text style={styles.empty}>Нет кадров</Text>
      ) : shownUri ? (
        <Image
          source={{ uri: shownUri }}
          style={styles.image}
          resizeMode="contain"
          {...imageProps}
        />
      ) : (
        <View style={styles.image} />
      )}

      <View style={[styles.bar, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.btn}>Закрыть</Text>
        </Pressable>
        <Pressable onPress={() => setPlaying((p) => !p)} hitSlop={12}>
          <Text style={styles.btn}>{playing ? 'Пауза' : 'Play'}</Text>
        </Pressable>
        <Text style={styles.counter}>
          {uris.length ? shownIndex + 1 : 0}/{uris.length}
          {!preloaded ? ' · …' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  image: { flex: 1, width: '100%', backgroundColor: '#000' },
  empty: { flex: 1, textAlign: 'center', textAlignVertical: 'center', color: '#888' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#0a0a0f',
  },
  btn: { color: '#ffeb3b', fontSize: 16 },
  counter: { color: '#aaa', fontSize: 14 },
});
