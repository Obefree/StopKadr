import * as FileSystem from 'expo-file-system/legacy';
import {
  FrameItem,
  StopMotionProject,
  defaultSettings,
  mergeProjectSettings,
  sortFrames,
} from '../models/types';

const ROOT = `${FileSystem.documentDirectory}StopKadr/Projects/`;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function projectDir(id: string) {
  return `${ROOT}${id}/`;
}

function framesDir(id: string) {
  return `${projectDir(id)}frames/`;
}

function projectJsonPath(id: string) {
  return `${projectDir(id)}project.json`;
}

async function ensureRoot() {
  await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
}

export async function loadProject(id: string): Promise<StopMotionProject | null> {
  const jsonPath = projectJsonPath(id);
  const info = await FileSystem.getInfoAsync(jsonPath);
  if (!info.exists) return null;
  const raw = await FileSystem.readAsStringAsync(jsonPath);
  const project = JSON.parse(raw) as StopMotionProject;
  return { ...project, settings: mergeProjectSettings(project.settings) };
}

export async function loadAllProjects(): Promise<StopMotionProject[]> {
  await ensureRoot();
  const entries = await FileSystem.readDirectoryAsync(ROOT).catch(() => [] as string[]);
  const projects: StopMotionProject[] = [];
  for (const id of entries) {
    const jsonPath = projectJsonPath(id);
    const info = await FileSystem.getInfoAsync(jsonPath);
    if (!info.exists) continue;
    const raw = await FileSystem.readAsStringAsync(jsonPath);
      const p = JSON.parse(raw) as StopMotionProject;
      projects.push({ ...p, settings: mergeProjectSettings(p.settings) });
  }
  return projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function saveProject(project: StopMotionProject): Promise<StopMotionProject> {
  const updated: StopMotionProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  await FileSystem.makeDirectoryAsync(framesDir(updated.id), { intermediates: true });
  await FileSystem.writeAsStringAsync(projectJsonPath(updated.id), JSON.stringify(updated, null, 2));
  return updated;
}

export async function createProject(title: string): Promise<StopMotionProject> {
  const trimmed = title.trim() || 'Untitled';
  const project: StopMotionProject = {
    id: newId(),
    title: trimmed,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: defaultSettings(),
    frames: [],
  };
  await FileSystem.makeDirectoryAsync(projectDir(project.id), { intermediates: true });
  await FileSystem.makeDirectoryAsync(framesDir(project.id), { intermediates: true });
  return saveProject(project);
}

export async function deleteProject(project: StopMotionProject): Promise<void> {
  await FileSystem.deleteAsync(projectDir(project.id), { idempotent: true });
}

export function frameUri(projectId: string, imagePath: string): string {
  return `${framesDir(projectId)}${imagePath}`;
}

export async function addFrame(
  project: StopMotionProject,
  imageUri: string,
): Promise<StopMotionProject> {
  const nextIndex = (sortFrames(project).at(-1)?.index ?? 0) + 1;
  const fileName = `${String(nextIndex).padStart(6, '0')}.jpg`;
  const dest = frameUri(project.id, fileName);
  await FileSystem.copyAsync({ from: imageUri, to: dest });
  const frame: FrameItem = {
    id: newId(),
    index: nextIndex,
    imagePath: fileName,
    createdAt: new Date().toISOString(),
    holdFrames: 1,
  };
  return saveProject({ ...project, frames: [...project.frames, frame] });
}

export async function replaceLastFrame(
  project: StopMotionProject,
  imageUri: string,
): Promise<StopMotionProject> {
  const last = sortFrames(project).at(-1);
  if (!last) return addFrame(project, imageUri);
  const dest = frameUri(project.id, last.imagePath);
  await FileSystem.copyAsync({ from: imageUri, to: dest });
  return saveProject(project);
}

export async function deleteFrame(
  project: StopMotionProject,
  frame: FrameItem,
): Promise<StopMotionProject> {
  await FileSystem.deleteAsync(frameUri(project.id, frame.imagePath), { idempotent: true });
  return saveProject({
    ...project,
    frames: project.frames.filter((f) => f.id !== frame.id),
  });
}

export async function deleteLastFrame(project: StopMotionProject): Promise<StopMotionProject> {
  const last = sortFrames(project).at(-1);
  if (!last) return project;
  return deleteFrame(project, last);
}

export function expandedFrameUris(project: StopMotionProject): string[] {
  const uris: string[] = [];
  for (const frame of sortFrames(project)) {
    const uri = frameUri(project.id, frame.imagePath);
    const count = Math.max(1, frame.holdFrames);
    for (let i = 0; i < count; i++) uris.push(uri);
  }
  return uris;
}
