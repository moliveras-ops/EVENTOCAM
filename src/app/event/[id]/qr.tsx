import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useEvents } from '@/lib/EventsContext';
import { buildInviteUrl } from '@/lib/invite';
import { colors, formatEventDate, radius, spacing } from '@/lib/theme';

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEvent } = useEvents();
  const event = getEvent(id);

  if (!event) {
    return <EmptyState emoji="🤔" title="Evento no encontrado" message="Vuelve atrás e inténtalo de nuevo." />;
  }

  const inviteUrl = buildInviteUrl(event);

  function handleShare() {
    Share.share({
      message:
        `¡Únete a "${event!.name}" en EventoCam y comparte tus fotos! 📸\n\n` +
        `Código: ${event!.code}\n${inviteUrl}`,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.date}>{formatEventDate(event.date)}</Text>

      <View style={styles.qrCard}>
        <QRCode value={inviteUrl} size={240} color={colors.text} backgroundColor={colors.white} />
      </View>

      <Text style={styles.codeLabel}>Código del evento</Text>
      <Text style={styles.code}>{event.code}</Text>

      <Text style={styles.hint}>
        Los invitados escanean este QR desde EventoCam (Unirme → Escanear) o escriben el código.
      </Text>

      <Button title="Compartir invitación" onPress={handleShare} style={styles.share} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  date: { marginTop: spacing.xs, fontSize: 15, color: colors.textMuted },
  qrCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeLabel: { marginTop: spacing.lg, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  code: { marginTop: spacing.xs, fontSize: 36, fontWeight: '800', letterSpacing: 6, color: colors.primaryDark },
  hint: { marginTop: spacing.md, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  share: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
