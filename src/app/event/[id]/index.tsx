import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useEvents } from '@/lib/EventsContext';
import { ensureLibraryPermission, eventAlbumName } from '@/lib/deviceAlbum';
import { addPhoto, loadPhotos, savePhotosToAlbum } from '@/lib/storage';
import { colors, formatEventDate, radius, spacing } from '@/lib/theme';
import type { EventPhoto } from '@/lib/types';

const COLUMNS = 3;
const GAP = 2;

export default function EventGalleryScreen() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const { getEvent, updateEvent, deleteEvent, profileName } = useEvents();
  const event = getEvent(id);
  const { width } = useWindowDimensions();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savingToAlbum, setSavingToAlbum] = useState(false);

  const refresh = useCallback(() => {
    loadPhotos(id).then(setPhotos);
  }, [id]);

  // Recarga al volver de la cámara o del detalle de una foto.
  useFocusEffect(refresh);

  if (!event) {
    return (
      <EmptyState emoji="🤔" title="Evento no encontrado" message="Puede que se haya eliminado de este dispositivo." />
    );
  }

  const tileSize = (width - GAP * (COLUMNS - 1)) / COLUMNS;
  const pendingCount = photos.filter((p) => !p.savedToAlbum).length;
  const albumName = eventAlbumName(event);

  async function handleSaveAllToAlbum() {
    setSavingToAlbum(true);
    try {
      const { saved, failed } = await savePhotosToAlbum(event!, photos);
      refresh();
      Alert.alert(
        failed ? 'Guardado incompleto' : 'Fotos guardadas',
        `${saved} ${saved === 1 ? 'foto guardada' : 'fotos guardadas'} en la carpeta "${albumName}".` +
          (failed ? `\n${failed} no se pudieron guardar; vuelve a intentarlo.` : ''),
      );
    } catch (error) {
      Alert.alert('No se pudieron guardar', error instanceof Error ? error.message : String(error));
    } finally {
      setSavingToAlbum(false);
    }
  }

  async function handleToggleAutoSave(enabled: boolean) {
    if (enabled && !(await ensureLibraryPermission())) {
      Alert.alert('Sin permiso', 'Activa el acceso a Fotos en los ajustes del teléfono para guardar automáticamente.');
      return;
    }
    await updateEvent(id, { autoSaveToAlbum: enabled });
  }

  async function handleUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 20,
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      for (const asset of result.assets) {
        await addPhoto({
          eventId: id,
          sourceUri: asset.uri,
          author: profileName,
          width: asset.width,
          height: asset.height,
        });
      }
      refresh();
    } catch (error) {
      Alert.alert('No se pudieron subir las fotos', String(error));
    } finally {
      setUploading(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Eliminar evento',
      `Se borrarán "${event!.name}" y sus ${photos.length} fotos de este dispositivo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(id);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: event.name,
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={12} accessibilityLabel="Eliminar evento">
              <Text style={styles.headerAction}>Eliminar</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.meta}>
              {formatEventDate(event.date)} · {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </Text>
            <Pressable
              style={styles.codeCard}
              onPress={() => router.push({ pathname: '/event/[id]/qr', params: { id } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.codeLabel}>
                  {created ? '¡Evento creado! Comparte este código' : 'Código del evento'}
                </Text>
                <Text style={styles.code}>{event.code}</Text>
              </View>
              <Text style={styles.codeAction}>Ver QR ›</Text>
            </Pressable>

            <View style={styles.albumCard}>
              <Text style={styles.albumTitle}>📁 Carpeta en la galería del teléfono</Text>
              <Text style={styles.albumName} numberOfLines={1}>
                {albumName}
              </Text>
              <Text style={styles.albumMeta}>
                {photos.length === 0
                  ? 'Aquí se guardarán las fotos del evento.'
                  : pendingCount === 0
                    ? `Las ${photos.length} fotos ya están guardadas ✓`
                    : `${photos.length - pendingCount} de ${photos.length} guardadas`}
              </Text>
              {pendingCount > 0 && (
                <Button
                  title={`Guardar ${pendingCount} ${pendingCount === 1 ? 'foto' : 'fotos'} en la carpeta`}
                  variant="secondary"
                  onPress={handleSaveAllToAlbum}
                  loading={savingToAlbum}
                />
              )}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Guardar automáticamente las fotos que haga</Text>
                <Switch
                  value={!!event.autoSaveToAlbum}
                  onValueChange={handleToggleAutoSave}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📷"
            title="Aún no hay fotos"
            message="Haz la primera foto o sube algunas desde tu galería."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/event/[id]/photo/[photoId]', params: { id, photoId: item.id } })
            }
          >
            <Image source={{ uri: item.uri }} style={{ width: tileSize, height: tileSize }} />
            {item.savedToAlbum && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>✓</Text>
              </View>
            )}
          </Pressable>
        )}
      />

      <View style={styles.bottomBar}>
        <Button
          title="Subir de la galería"
          variant="secondary"
          onPress={handleUpload}
          loading={uploading}
          style={{ flex: 1 }}
        />
        <Button
          title="📸 Hacer foto"
          onPress={() => router.push({ pathname: '/event/[id]/camera', params: { id } })}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerAction: { color: colors.danger, fontSize: 16 },
  header: { padding: spacing.md, gap: spacing.md },
  meta: { fontSize: 15, color: colors.textMuted },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  codeLabel: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  code: { marginTop: 2, fontSize: 26, fontWeight: '800', letterSpacing: 4, color: colors.primaryDark },
  codeAction: { fontSize: 15, fontWeight: '600', color: colors.primary },
  albumCard: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  albumTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  albumName: { fontSize: 17, fontWeight: '700', color: colors.text },
  albumMeta: { fontSize: 14, color: colors.textMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchLabel: { flex: 1, fontSize: 15, color: colors.text },
  savedBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBadgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
