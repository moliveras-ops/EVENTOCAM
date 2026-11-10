import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useEvents } from '@/lib/EventsContext';
import { addPhoto, loadPhotos } from '@/lib/storage';
import { colors, formatEventDate, radius, spacing } from '@/lib/theme';
import type { EventPhoto } from '@/lib/types';

const COLUMNS = 3;
const GAP = 2;

export default function EventGalleryScreen() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const { getEvent, deleteEvent, profileName } = useEvents();
  const event = getEvent(id);
  const { width } = useWindowDimensions();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

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
