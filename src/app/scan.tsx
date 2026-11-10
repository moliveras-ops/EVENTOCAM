import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useEvents } from '@/lib/EventsContext';
import { parseInvite } from '@/lib/invite';
import { colors, radius, spacing } from '@/lib/theme';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { joinEvent } = useEvents();
  const [message, setMessage] = useState<string | null>(null);
  const handled = useRef(false);

  async function handleScan({ data }: BarcodeScanningResult) {
    if (handled.current) return;
    const invite = parseInvite(data);
    if (!invite) {
      setMessage('Este QR no es de EventoCam. Prueba con el del anfitrión.');
      return;
    }
    handled.current = true;
    const event = await joinEvent(invite);
    // Sustituye el escáner y el modal de "Unirme" por la galería del evento.
    router.dismissAll();
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  }

  if (!permission) return <View style={styles.black} />;

  if (!permission.granted) {
    return (
      <View style={[styles.permission, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.permissionTitle}>Necesitamos la cámara</Text>
        <Text style={styles.permissionText}>Para leer el código QR del evento hay que permitir el acceso a la cámara.</Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
        <Button title="Volver" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.black}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
      />
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityLabel="Cerrar">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.frame} />
        <Text style={styles.hint}>{message ?? 'Encuadra el código QR del evento'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: colors.black },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.white, fontSize: 20 },
  frame: { width: 250, height: 250, borderWidth: 3, borderColor: colors.white, borderRadius: radius.lg },
  hint: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginHorizontal: spacing.md,
  },
  permission: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  permissionText: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
});
