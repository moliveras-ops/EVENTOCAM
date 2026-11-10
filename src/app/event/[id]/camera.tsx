import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useEvents } from '@/lib/EventsContext';
import { ensureLibraryPermission } from '@/lib/deviceAlbum';
import { addPhoto, savePhotosToAlbum } from '@/lib/storage';
import { colors, radius, spacing } from '@/lib/theme';
import { isAutoSaveEnabled } from '@/lib/types';

const FLASH_CYCLE: FlashMode[] = ['off', 'auto', 'on'];
const FLASH_LABEL: Record<FlashMode, string> = { off: '⚡️ No', auto: '⚡️ Auto', on: '⚡️ Sí', screen: '⚡️ Pantalla' };

export default function CameraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEvent, profileName } = useEvents();
  const event = getEvent(id);
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastShotUri, setLastShotUri] = useState<string | null>(null);
  const [shotCount, setShotCount] = useState(0);
  const autoSaveWarned = useRef(false);
  const autoSave = !!event && isAutoSaveEnabled(event);

  // Con el guardado automático activo, se pide el permiso de galería al abrir la
  // cámara, y no a mitad de una ráfaga de fotos.
  useEffect(() => {
    if (permission?.granted && autoSave) ensureLibraryPermission().catch(() => undefined);
  }, [permission?.granted, autoSave]);

  if (!permission) return <View style={styles.black} />;

  if (!permission.granted) {
    return (
      <View style={[styles.permission, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.permissionTitle}>Permite el acceso a la cámara</Text>
        <Text style={styles.permissionText}>
          EventoCam necesita la cámara para hacer las fotos de {event?.name ?? 'tu evento'}.
        </Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
        <Button title="Volver" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current || !ready || busy) return;
    setBusy(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      const photo = await addPhoto({
        eventId: id,
        sourceUri: picture.uri,
        author: profileName,
        width: picture.width,
        height: picture.height,
      });
      setLastShotUri(photo.uri);
      setShotCount((n) => n + 1);
      if (event && autoSave) {
        // En segundo plano, para poder seguir haciendo fotos sin esperar.
        savePhotosToAlbum(event, [photo]).catch((error) => {
          if (autoSaveWarned.current) return;
          autoSaveWarned.current = true;
          Alert.alert(
            'No se guardó en la galería',
            `La foto está en el evento, pero no en la carpeta del teléfono. ${error instanceof Error ? error.message : ''}`,
          );
        });
      }
    } catch (error) {
      Alert.alert('No se pudo guardar la foto', String(error));
    } finally {
      setBusy(false);
    }
  }

  function cycleFlash() {
    setFlash((current) => FLASH_CYCLE[(FLASH_CYCLE.indexOf(current) + 1) % FLASH_CYCLE.length]);
  }

  return (
    <View style={styles.black}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        onCameraReady={() => setReady(true)}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.chip} accessibilityLabel="Cerrar cámara">
          <Text style={styles.chipText}>✕</Text>
        </Pressable>
        <Text style={styles.eventName} numberOfLines={1}>
          {event?.name}
        </Text>
        <Pressable onPress={cycleFlash} style={styles.chip} accessibilityLabel="Cambiar flash">
          <Text style={styles.chipText}>{FLASH_LABEL[flash]}</Text>
        </Pressable>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={styles.thumbWrap}
          onPress={() => router.back()}
          accessibilityLabel="Ver galería del evento"
        >
          {lastShotUri ? (
            <>
              <Image source={{ uri: lastShotUri }} style={styles.thumb} />
              <View style={styles.counter}>
                <Text style={styles.counterText}>{shotCount}</Text>
              </View>
            </>
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]} />
          )}
        </Pressable>

        <Pressable
          onPress={takePhoto}
          disabled={!ready || busy}
          style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}
          accessibilityLabel="Hacer foto"
        >
          {busy ? <ActivityIndicator color={colors.primary} /> : <View style={styles.shutterInner} />}
        </Pressable>

        <Pressable
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          style={[styles.chip, styles.flip]}
          accessibilityLabel="Cambiar de cámara"
        >
          <Text style={styles.flipText}>🔄</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: colors.black },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  eventName: { flex: 1, color: colors.white, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  chip: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  thumbWrap: { width: 56, height: 56 },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.white },
  thumbEmpty: { backgroundColor: 'rgba(255,255,255,0.15)' },
  counter: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  counterText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white },
  flip: { width: 56, height: 56 },
  flipText: { fontSize: 24 },
  permission: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  permissionText: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
});
