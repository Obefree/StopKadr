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
  onSelect: (id: string) => void;
};

export function Timeline({ project, frames, selectedId, onSelect }: Props) {
  return (
    <FlatList
      horizontal
      data={frames}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        return (
          <Pressable onPress={() => onSelect(item.id)} style={[styles.thumb, selected && styles.selected]}>
            <Image source={{ uri: frameUri(project.id, item.imagePath) }} style={styles.image} />
            <Text style={styles.index}>{item.index}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, gap: 8 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: '#ffeb3b' },
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
});
