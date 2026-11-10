import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useEvents } from '@/lib/EventsContext';
import { colors, formatEventDate, radius, spacing } from '@/lib/theme';
import type { EventoCamEvent } from '@/lib/types';

export default function HomeScreen() {
  const { ready, events } = useEvents();

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headline}>Las fotos de tu evento, en un solo lugar 📸</Text>
            <Text style={styles.subtitle}>
              Crea un evento, comparte el código QR y que todos tus invitados hagan fotos.
            </Text>

            <ProfileNameField />

            <View style={styles.actions}>
              <Button title="Crear evento" onPress={() => router.push('/create')} style={styles.action} />
              <Button
                title="Unirme"
                variant="secondary"
                onPress={() => router.push('/join')}
                style={styles.action}
              />
            </View>

            {events.length > 0 && <Text style={styles.sectionTitle}>Mis eventos</Text>}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🎉"
            title="Todavía no tienes eventos"
            message="Crea uno para tu boda, cumpleaños o fiesta, o únete con el código que te pasaron."
          />
        }
        renderItem={({ item }) => <EventCard event={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

/** Se monta cuando los datos ya están cargados, así parte del nombre guardado. */
function ProfileNameField() {
  const { profileName, setProfileName } = useEvents();
  const [draft, setDraft] = useState(profileName);
  return (
    <>
      <Text style={styles.label}>Tu nombre (aparece en tus fotos)</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onEndEditing={() => setProfileName(draft)}
        placeholder="Ej. Lucía"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        returnKeyType="done"
        autoCapitalize="words"
      />
    </>
  );
}

function EventCard({ event }: { event: EventoCamEvent }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.cardMeta}>{formatEventDate(event.date)}</Text>
      </View>
      <View style={[styles.badge, event.role === 'host' ? styles.badgeHost : styles.badgeGuest]}>
        <Text style={styles.badgeText}>{event.role === 'host' ? 'Anfitrión' : 'Invitado'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md },
  headline: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: spacing.sm, fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  label: { marginTop: spacing.lg, marginBottom: spacing.xs, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  action: { flex: 1 },
  sectionTitle: { marginTop: spacing.xl, fontSize: 18, fontWeight: '700', color: colors.text },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  cardMeta: { marginTop: 2, fontSize: 14, color: colors.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeHost: { backgroundColor: colors.primarySoft },
  badgeGuest: { backgroundColor: '#E0F2FE' },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.primaryDark },
});
