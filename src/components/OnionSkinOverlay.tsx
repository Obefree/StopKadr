import React from 'react';
import { Image, Platform, StyleSheet } from 'react-native';

type Props = {
  uri: string;
  opacity: number;
  mirror: boolean;
  visible: boolean;
};

export const OnionSkinOverlay = React.memo(function OnionSkinOverlay({
  uri,
  opacity,
  mirror,
  visible,
}: Props) {
  if (!visible || opacity <= 0 || !uri) {
    return null;
  }

  return (
    <Image
      source={{ uri }}
      style={[StyleSheet.absoluteFill, { opacity }, mirror && styles.mirror]}
      resizeMode="stretch"
      fadeDuration={0}
      {...(Platform.OS === 'android' ? { resizeMethod: 'resize' as const } : {})}
    />
  );
});

const styles = StyleSheet.create({
  mirror: { transform: [{ scaleX: -1 }] },
});
