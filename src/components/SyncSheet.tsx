import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StopMotionProject, sortFrames } from '../models/types';
import { shareProjectArchive } from '../sync/shareProject';
import { probePcSync, uploadProjectToPc } from '../sync/pcUpload';
import { loadSyncSettings, resolvePcSyncBaseUrl, saveSyncSettings } from '../sync/syncSettings';
import { exportAndSaveVideo, exportAndShareVideo } from '../sync/saveVideo';
import { isVideoExportAvailable, exportUnavailableMessage } from '../export/videoExport';

type Props = {
  visible: boolean;
  project: StopMotionProject;
  onClose: () => void;
};

export function SyncSheet({ visible, project, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canExportVideo, setCanExportVideo] = useState(false);
  const [pcLabel, setPcLabel] = useState('');
  const [pcBase, setPcBase] = useState('');
  const [hostInput, setHostInput] = useState('');
  const [browseUrl, setBrowseUrl] = useState('');

  const frameCount = sortFrames(project).length;

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setCanExportVideo(await isVideoExportAvailable());
      const resolved = await resolvePcSyncBaseUrl();
      setPcLabel(resolved.label);
      setPcBase(resolved.baseUrl);
      const saved = await loadSyncSettings();
      setHostInput(saved.pcHost);
      if (resolved.baseUrl) {
        const ok = await probePcSync(resolved.baseUrl);
        if (ok) setBrowseUrl(`${resolved.baseUrl}/browse`);
      }
    })();
  }, [visible]);

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    setProgress(0);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Сохранить', e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Сохранить</Text>
          <Text style={styles.sub}>
            {project.title} · {frameCount} кадр{frameCount === 1 ? '' : frameCount < 5 ? 'а' : 'ов'}
          </Text>

          <Text style={styles.section}>Видео MP4</Text>
          {!canExportVideo ? (
            <Text style={styles.warn}>{exportUnavailableMessage()}</Text>
          ) : null}
          <Pressable
            style={[styles.btn, (!canExportVideo || frameCount === 0 || busy) && styles.btnDisabled]}
            disabled={!canExportVideo || frameCount === 0 || busy}
            onPress={() =>
              wrap(async () => {
                await exportAndSaveVideo(project, setProgress);
              })
            }
          >
            <Text style={styles.btnText}>Видео в галерею</Text>
          </Pressable>
          <Pressable
            style={[styles.btnSecondary, (!canExportVideo || frameCount === 0 || busy) && styles.btnDisabled]}
            disabled={!canExportVideo || frameCount === 0 || busy}
            onPress={() =>
              wrap(async () => {
                await exportAndShareVideo(project, setProgress);
              })
            }
          >
            <Text style={styles.btnSecondaryText}>Поделиться видео (MP4)</Text>
          </Pressable>
          {busy && progress > 0 ? (
            <Text style={styles.progress}>Сборка видео… {Math.round(progress * 100)}%</Text>
          ) : null}

          <Text style={styles.section}>Резервная копия</Text>
          <Pressable
            style={styles.btnSecondary}
            disabled={busy || frameCount === 0}
            onPress={() => wrap(() => shareProjectArchive(project))}
          >
            <Text style={styles.btnSecondaryText}>Архив кадров (ZIP)</Text>
          </Pressable>

          <Text style={styles.section}>ПК в той же Wi‑Fi</Text>
          <Text style={styles.hint}>На компьютере: npm run pc-sync (или npm run dev)</Text>
          <Text style={styles.pcStatus}>ПК: {pcLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder="IP ПК, например 192.168.1.42"
            placeholderTextColor="#666"
            value={hostInput}
            onChangeText={setHostInput}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Pressable
            style={styles.btnSecondary}
            disabled={busy}
            onPress={() =>
              wrap(async () => {
                await saveSyncSettings({ pcHost: hostInput.trim(), userSetHost: true });
                const r = await resolvePcSyncBaseUrl();
                setPcBase(r.baseUrl);
                setPcLabel(r.label);
                Alert.alert('Сохранено', r.baseUrl || 'Укажите IP');
              })
            }
          >
            <Text style={styles.btnSecondaryText}>Запомнить IP ПК</Text>
          </Pressable>
          <Pressable
            style={styles.btnSecondary}
            disabled={busy || frameCount === 0}
            onPress={() =>
              wrap(async () => {
                const result = await uploadProjectToPc(project, pcBase || undefined);
                setBrowseUrl(result.browseUrl);
                Alert.alert(
                  'На ПК',
                  `Сохранено:\n${result.savedPath}\n\nВ браузере:\n${result.browseUrl}`,
                );
              })
            }
          >
            <Text style={styles.btnSecondaryText}>Отправить ZIP на ПК</Text>
          </Pressable>

          {browseUrl ? <Text style={styles.browse}>Скачать: {browseUrl}</Text> : null}

          {busy ? <ActivityIndicator color="#ffeb3b" style={{ marginTop: 12 }} /> : null}

          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Закрыть</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#1a1a24',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '92%',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sub: { color: '#888', marginBottom: 12 },
  section: { color: '#ffeb3b', fontWeight: '600', marginTop: 14, marginBottom: 8 },
  hint: { color: '#777', fontSize: 12, marginBottom: 8, lineHeight: 18 },
  warn: { color: '#c96', fontSize: 12, marginBottom: 8, lineHeight: 18 },
  progress: { color: '#aaa', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  pcStatus: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  input: {
    backgroundColor: '#0a0a0f',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: '#ffeb3b',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#0a0a0f', fontWeight: '700', textAlign: 'center' },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#444',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  btnSecondaryText: { color: '#fff', textAlign: 'center' },
  browse: { color: '#8cf', fontSize: 12, marginTop: 8 },
  close: { marginTop: 16, padding: 12 },
  closeText: { color: '#888', textAlign: 'center', fontSize: 16 },
});
