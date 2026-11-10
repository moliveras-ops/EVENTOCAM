import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { deletePhoto, loadPhotos } from '@/lib/storage';
import { colors, spacing } from '@/lib/theme';
import type { EventPhoto } from '@/lib/types';

export default function PhotoDetailScreen() {
  const { id, photoId } = useLocalSearchParams<{ id: string; photoId: string }>();
  const [photo, setPhoto] = useState<EventPhoto | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPhotos(id).then((photos) => setPhoto(photos.find((p) => p.id === photoId) ?? null));
  }, [id, photoId]);

  if (photo === undefined) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  if (photo === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.meta}>Esta foto ya no existe.</Text>
      </View>
    );
  }

  const current = photo;

  async function handleSave() {
    setSaving(true);
    try {
      // writeOnly: solo pedimos permiso para guardar, no para leer la galería.
      const permission = await requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert('Sin permiso', 'Activa el acceso a Fotos en los ajustes para guardar la imagen.');
        return;
      }
      await Asset.create(current.uri);
      Alert.alert('Guardada', 'La foto está en tu galería.');
    } catch (error) {
      Alert.alert('No se pudo guardar', String(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('No disponible', 'Este dispositivo no permite compartir archivos.');
      return;
    }
    await Sharing.shareAsync(current.uri, { mimeType: 'image/jpeg', dialogTitle: 'Compartir foto' });
  }

  function handleDelete() {
    Alert.alert('Eliminar foto', '¿Seguro que quieres borrar esta foto del evento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deletePhoto(current.id);
          router.back();
        },
      },
    ]);
  }

  const takenAt = new Date(current.createdAt).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Image source={{ uri: current.uri }} style={styles.image} resizeMode="contain" />
      <View style={styles.footer}>
        <Text style={styles.meta}>
          📷 {current.author} · {takenAt}
        </Text>
        <View style={styles.actions}>
          <Button title="Guardar" onPress={handleSave} loading={saving} style={styles.action} />
          <Button title="Compartir" variant="secondary" onPress={handleShare} style={styles.action} />
          <Button title="Borrar" variant="danger" onPress={handleDelete} style={styles.action} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  center: { alignItems: 'center', justifyContent: 'center' },
  image: { flex: 1, width: '100%' },
  footer: { padding: spacing.md, gap: spacing.md },
  meta: { color: colors.white, fontSize: 15, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
