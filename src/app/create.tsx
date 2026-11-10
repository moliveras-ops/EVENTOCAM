import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/Button';
import { useEvents } from '@/lib/EventsContext';
import { colors, radius, spacing } from '@/lib/theme';

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export default function CreateEventScreen() {
  const { createEvent } = useEvents();
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && isValidIsoDate(date);

  async function handleCreate() {
    if (!canSave) {
      Alert.alert('Revisa los datos', 'Escribe un nombre y una fecha con el formato AAAA-MM-DD.');
      return;
    }
    setSaving(true);
    try {
      const event = await createEvent({ name, date });
      router.replace({ pathname: '/event/[id]', params: { id: event.id, created: '1' } });
    } catch (error) {
      Alert.alert('No se pudo crear el evento', String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nombre del evento</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej. Boda de Ana y Pablo"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoFocus
          maxLength={60}
          autoCapitalize="sentences"
        />

        <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="2026-12-31"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        <Text style={styles.hint}>
          Al crearlo se generará un código y un QR para que tus invitados se unan.
        </Text>

        <Button title="Crear evento" onPress={handleCreate} loading={saving} disabled={!canSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.xs },
  label: { marginTop: spacing.md, fontSize: 13, fontWeight: '600', color: colors.textMuted },
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
  hint: { marginVertical: spacing.lg, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
