/** FFmpeg CLI on Android/iOS expects paths without file:// */
export function pathForFfmpeg(uri: string): string {
  if (uri.startsWith('file://')) {
    return uri.slice(7);
  }
  return uri;
}

export function ensureFileUri(path: string): string {
  if (path.startsWith('file://') || path.startsWith('content://')) {
    return path;
  }
  return `file://${path}`;
}
