import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { StopMotionProject, lastFrame, sortFrames } from '../models/types';
import {
  createProject,
  deleteProject,
  frameUri,
  loadAllProjects,
} from '../store/projectStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Projects'>;

export default function ProjectListScreen({ navigation }: Props) {
  const [projects, setProjects] = useState<StopMotionProject[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');

  const refresh = useCallback(async () => {
    setProjects(await loadAllProjects());
  }, []);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      refresh();
    });
    return unsub;
  }, [navigation, refresh]);

  const onCreate = async () => {
    const p = await createProject(title);
    setModalOpen(false);
    setTitle('');
    navigation.navigate('Editor', { projectId: p.id });
  };

  const onDelete = (p: StopMotionProject) => {
    Alert.alert('Удалить проект?', p.title, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await deleteProject(p);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={projects.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Создайте stop motion проект</Text>
        }
        renderItem={({ item }) => {
          const lf = lastFrame(item);
          const thumbUri = lf ? frameUri(item.id, lf.imagePath) : undefined;
          return (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('Editor', { projectId: item.id })}
              onLongPress={() => onDelete(item)}
            >
              {thumbUri ? (
                <Image source={{ uri: thumbUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="camera" size={24} color="#666" />
                </View>
              )}
              <View style={styles.meta}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{sortFrames(item).length} кадров</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Ionicons name="add" size={28} color="#0a0a0f" />
      </Pressable>

      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Новый проект</Text>
            <TextInput
              style={styles.input}
              placeholder="Название"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)}>
                <Text style={styles.cancel}>Отмена</Text>
              </Pressable>
              <Pressable onPress={onCreate}>
                <Text style={styles.create}>Создать</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  empty: { flex: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: '#1a1a24', justifyContent: 'center', alignItems: 'center' },
  meta: { flex: 1, marginLeft: 12 },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  sub: { color: '#888', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffeb3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#1a1a24', borderRadius: 12, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  input: {
    backgroundColor: '#0a0a0f',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  cancel: { color: '#888', fontSize: 16 },
  create: { color: '#ffeb3b', fontSize: 16, fontWeight: '600' },
});
