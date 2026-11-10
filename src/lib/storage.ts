import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { generateEventCode, generateId } from './ids';
import type { EventoCamEvent, EventPhoto, EventRole, NewEventInput } from './types';

const KEYS = {
  events: 'eventocam:events',
  photos: 'eventocam:photos',
  profileName: 'eventocam:profile-name',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function eventDirectory(eventId: string): Directory {
  return new Directory(Paths.document, 'eventocam', eventId);
}

// ---------- Perfil ----------

export async function loadProfileName(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.profileName)) ?? '';
}

export async function saveProfileName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.profileName, name.trim());
}

// ---------- Eventos ----------

export async function loadEvents(): Promise<EventoCamEvent[]> {
  return readJson<EventoCamEvent[]>(KEYS.events, []);
}

export async function createEvent(input: NewEventInput): Promise<EventoCamEvent> {
  const events = await loadEvents();
  const existingCodes = new Set(events.map((e) => e.code));
  let code = generateEventCode();
  while (existingCodes.has(code)) code = generateEventCode();

  const event: EventoCamEvent = {
    id: generateId(),
    code,
    name: input.name.trim(),
    date: input.date,
    role: 'host',
    createdAt: Date.now(),
  };
  await writeJson(KEYS.events, [event, ...events]);
  return event;
}

/**
 * Une al usuario a un evento por su código. Si el evento ya existe en este
 * dispositivo lo devuelve; si no, crea una copia local como invitado.
 */
export async function joinEvent(params: {
  code: string;
  name?: string;
  date?: string;
}): Promise<EventoCamEvent> {
  const events = await loadEvents();
  const existing = events.find((e) => e.code === params.code);
  if (existing) return existing;

  const role: EventRole = 'guest';
  const event: EventoCamEvent = {
    id: generateId(),
    code: params.code,
    name: params.name?.trim() || `Evento ${params.code}`,
    date: params.date ?? new Date().toISOString().slice(0, 10),
    role,
    createdAt: Date.now(),
  };
  await writeJson(KEYS.events, [event, ...events]);
  return event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const [events, photos] = await Promise.all([loadEvents(), loadAllPhotos()]);
  await Promise.all([
    writeJson(
      KEYS.events,
      events.filter((e) => e.id !== eventId),
    ),
    writeJson(
      KEYS.photos,
      photos.filter((p) => p.eventId !== eventId),
    ),
  ]);
  const dir = eventDirectory(eventId);
  if (dir.exists) dir.delete();
}

// ---------- Fotos ----------

async function loadAllPhotos(): Promise<EventPhoto[]> {
  return readJson<EventPhoto[]>(KEYS.photos, []);
}

export async function loadPhotos(eventId: string): Promise<EventPhoto[]> {
  const photos = await loadAllPhotos();
  return photos.filter((p) => p.eventId === eventId).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Copia una imagen (de la cámara o de la galería) al almacenamiento
 * permanente de la app y la registra en el evento.
 */
export async function addPhoto(params: {
  eventId: string;
  sourceUri: string;
  author: string;
  width?: number;
  height?: number;
}): Promise<EventPhoto> {
  const dir = eventDirectory(params.eventId);
  dir.create({ intermediates: true, idempotent: true });

  const id = generateId();
  const source = new File(params.sourceUri);
  const extension = source.extension || '.jpg';
  const destination = new File(dir, `${id}${extension}`);
  await source.copy(destination);

  const photo: EventPhoto = {
    id,
    eventId: params.eventId,
    uri: destination.uri,
    author: params.author.trim() || 'Anónimo',
    createdAt: Date.now(),
    width: params.width,
    height: params.height,
  };
  const photos = await loadAllPhotos();
  await writeJson(KEYS.photos, [photo, ...photos]);
  return photo;
}

export async function deletePhoto(photoId: string): Promise<void> {
  const photos = await loadAllPhotos();
  const photo = photos.find((p) => p.id === photoId);
  if (!photo) return;
  const file = new File(photo.uri);
  if (file.exists) file.delete();
  await writeJson(
    KEYS.photos,
    photos.filter((p) => p.id !== photoId),
  );
}
