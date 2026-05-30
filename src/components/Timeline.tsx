import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FrameItem, StopMotionProject } from '../models/types';
import { frameUri } from '../store/projectStore';

type Props = {
  project: StopMotionProject;
  frames: FrameItem[];
  selectedId: string | null;
  reshootId?: string | null;
  onSelect: (id: string) => void;
  onLongPress?: (frame: FrameItem) => void;
};

export function Timeline({
  project,
  frames,
  selectedId,
  reshootId,
  onSelect,
  onLongPress,
}: Props) {
  return (
    <FlatList
      horizontal
      data={frames}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        const reshoot = item.id === reshootId;
        return (
          <Pressable
            onPress={() => onSelect(item.id)}
            onLongPress={() => onLongPress?.(item)}
            delayLongPress={400}
            style={[
              styles.thumb,
              selected && styles.selected,
              reshoot && styles.reshoot,
            ]}
          >
            <Image source={{ uri: frameUri(project.id, item.imagePath) }} style={styles.image} />
            <Text style={styles.index}>{item.index}</Text>
            {reshoot ? <View style={styles.reshootBadge}><Text style={styles.reshootBadgeText}>↻</Text></View> : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, gap: 8, paddingBottom: 4 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: '#ffeb3b' },
  reshoot: { borderColor: '#ff9800' },
  image: { width: '100%', height: '100%' },
  index: {
    position: 'absolute',
    left: 2,
    bottom: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
  },
  reshootBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff9800',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reshootBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
