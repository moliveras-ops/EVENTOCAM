import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/lib/theme';

export function EmptyState({ emoji, title, message }: { emoji: string; title: string; message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  message: { marginTop: spacing.sm, fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
