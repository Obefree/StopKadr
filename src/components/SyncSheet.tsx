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
import { StopMotionProject } from '../models/types';
import { shareProjectArchive } from '../sync/shareProject';
import { probePcSync, uploadProjectToPc } from '../sync/pcUpload';
import { loadSyncSettings, resolvePcSyncBaseUrl, saveSyncSettings } from '../sync/syncSettings';
type Props = {
  visible: boolean;
  project: StopMotionProject;
  onClose: () => void;
};

export function SyncSheet({ visible, project, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [pcLabel, setPcLabel] = useState('');
  const [pcBase, setPcBase] = useState('');
  const [hostInput, setHostInput] = useState('');
  const [browseUrl, setBrowseUrl] = useState('');

  useEffect(() => {
    if (!visible) return;
    (async () => {
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
    try {
      await fn();
    } catch (e) {
      Alert.alert('Синхронизация', e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Сохранить и передать</Text>
          <Text style={styles.sub}>{project.title}</Text>

          <Text style={styles.section}>На этом iPhone / Android</Text>
          <Pressable
            style={styles.btn}
            disabled={busy}
            onPress={() => wrap(() => shareProjectArchive(project))}
          >
            <Text style={styles.btnText}>Архив проекта (ZIP) — Файлы / AirDrop</Text>
          </Pressable>
          <Text style={styles.hint}>
            Кадры уже на устройстве в приложении. ZIP — для «Файлов», AirDrop на другой телефон или
            резервной копии.
          </Text>

          <Text style={styles.section}>На ПК в той же Wi‑Fi</Text>
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
            style={styles.btn}
            disabled={busy}
            onPress={() =>
              wrap(async () => {
                const result = await uploadProjectToPc(project, pcBase || undefined);
                setBrowseUrl(result.browseUrl);
                Alert.alert(
                  'На ПК',
                  `Сохранено:\n${result.savedPath}\n\nДругое устройство в Wi‑Fi откройте в браузере:\n${result.browseUrl}`,
                );
              })
            }
          >
            <Text style={styles.btnText}>Отправить проект на ПК</Text>
          </Pressable>

          {browseUrl ? (
            <Text style={styles.browse}>Скачать с другого устройства: {browseUrl}</Text>
          ) : null}

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
    maxHeight: '90%',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sub: { color: '#888', marginBottom: 16 },
  section: { color: '#ffeb3b', fontWeight: '600', marginTop: 12, marginBottom: 8 },
  hint: { color: '#777', fontSize: 12, marginBottom: 8, lineHeight: 18 },
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
