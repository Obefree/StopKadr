import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { expandedFrameUris, loadProject } from '../store/projectStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Playback'>;

export default function PlaybackScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const [uris, setUris] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [fps, setFps] = useState(12);
  /** Держим предыдущий кадр, пока следующий не в кэше — без чёрных вспышек */
  const [visibleUri, setVisibleUri] = useState<string | null>(null);
  const [scrubWidth, setScrubWidth] = useState(300);
  const prefetching = useRef(false);

  useEffect(() => {
    loadProject(projectId).then((p) => {
      if (!p) return;
      setFps(Math.max(1, p.settings.fps));
      const list = expandedFrameUris(p);
      setUris(list);
      setIndex(0);
      if (list.length === 0) {
        setVisibleUri(null);
        return;
      }
      prefetching.current = true;
      Promise.all(list.map((u) => Image.prefetch(u)))
        .catch(() => {})
        .finally(() => {
          prefetching.current = false;
          setVisibleUri(list[0]);
        });
    });
  }, [projectId]);

  useEffect(() => {
    const uri = uris[index];
    if (!uri) return;
    if (uri === visibleUri) return;
    let active = true;
    Image.prefetch(uri)
      .catch(() => {})
      .finally(() => {
        if (active) setVisibleUri(uri);
      });
    return () => {
      active = false;
    };
  }, [index, uris]);

  useEffect(() => {
    if (!playing || uris.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1 < uris.length ? i + 1 : 0));
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [playing, uris.length, fps]);

  const onScrubLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setScrubWidth(w);
  };

  return (
    <View style={styles.root}>
      {visibleUri ? (
        <Image source={{ uri: visibleUri }} style={styles.image} resizeMode="contain" />
      ) : uris.length === 0 ? (
        <Text style={styles.empty}>Нет кадров</Text>
      ) : (
        <View style={styles.image} />
      )}
      <View style={styles.bar}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.btn}>Закрыть</Text>
        </Pressable>
        <Pressable onPress={() => setPlaying((p) => !p)}>
          <Text style={styles.btn}>{playing ? 'Пауза' : 'Play'}</Text>
        </Pressable>
        <Text style={styles.counter}>
          {uris.length ? index + 1 : 0}/{uris.length}
        </Text>
      </View>
      <Pressable
        style={styles.scrub}
        onLayout={onScrubLayout}
        onPress={(e) => {
          if (!uris.length) return;
          const x = e.nativeEvent.locationX;
          const next = Math.floor((x / scrubWidth) * uris.length);
          setIndex(Math.min(uris.length - 1, Math.max(0, next)));
        }}
      >
        <View
          style={[
            styles.scrubFill,
            { width: uris.length ? `${((index + 1) / uris.length) * 100}%` : '0%' },
          ]}
        />
      </Pressable>
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
    padding: 16,
  },
  btn: { color: '#ffeb3b', fontSize: 16 },
  counter: { color: '#aaa' },
  scrub: {
    height: 6,
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scrubFill: { height: '100%', backgroundColor: '#ffeb3b' },
});
