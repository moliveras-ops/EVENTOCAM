import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/Button';
import { useEvents } from '@/lib/EventsContext';
import { EVENT_CODE_LENGTH } from '@/lib/ids';
import { parseInvite, type InvitePayload } from '@/lib/invite';
import { colors, radius, spacing } from '@/lib/theme';

/**
 * Pantalla para unirse a un evento. También es el destino del enlace
 * profundo eventocam://join?code=XXXXXX que contiene el QR.
 */
export default function JoinEventScreen() {
  const params = useLocalSearchParams<{ code?: string; name?: string; date?: string }>();
  const { ready, joinEvent } = useEvents();
  const [code, setCode] = useState(params.code ?? '');
  const [joining, setJoining] = useState(false);
  const autoJoined = useRef(false);

  async function join(payload: InvitePayload) {
    setJoining(true);
    try {
      const event = await joinEvent(payload);
      router.replace({ pathname: '/event/[id]', params: { id: event.id } });
    } catch (error) {
      Alert.alert('No se pudo unir al evento', String(error));
      setJoining(false);
    }
  }

  // Si se llega desde un QR o un enlace con código válido, se une automáticamente.
  useEffect(() => {
    if (!ready || autoJoined.current || !params.code) return;
    const invite = parseInvite(params.code);
    if (!invite) return;
    autoJoined.current = true;
    joinEvent({ code: invite.code, name: params.name, date: params.date })
      .then((event) => router.replace({ pathname: '/event/[id]', params: { id: event.id } }))
      .catch((error) => Alert.alert('No se pudo unir al evento', String(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, params.code]);

  function handleJoin() {
    const invite = parseInvite(code);
    if (!invite) {
      Alert.alert('Código no válido', `El código tiene ${EVENT_CODE_LENGTH} letras y números, p. ej. K7P2QX.`);
      return;
    }
    join(invite);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Escanea el QR del evento</Text>
        <Text style={styles.text}>Es la forma más rápida: apunta la cámara al código que te enseña el anfitrión.</Text>
        <Button title="Escanear código QR" onPress={() => router.push('/scan')} disabled={joining} />

        <Text style={styles.divider}>o escribe el código</Text>

        <TextInput
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder="K7P2QX"
          placeholderTextColor={colors.textMuted}
          style={styles.codeInput}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={EVENT_CODE_LENGTH}
          returnKeyType="go"
          onSubmitEditing={handleJoin}
        />
        <Button
          title="Unirme al evento"
          variant="secondary"
          onPress={handleJoin}
          loading={joining}
          disabled={code.trim().length < EVENT_CODE_LENGTH}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  title: { marginTop: spacing.sm, fontSize: 20, fontWeight: '700', color: colors.text },
  text: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  divider: { marginTop: spacing.lg, textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.text,
  },
});
