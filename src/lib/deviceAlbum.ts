import { Album, Asset, getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library';

import type { EventoCamEvent } from './types';

const ALBUM_PREFIX = 'EventoCam';

/** Nombre del álbum (carpeta en Android) donde se guardan las fotos del evento. */
export function eventAlbumName(event: Pick<EventoCamEvent, 'name'>): string {
  // En Android el álbum es una carpeta: se quitan los caracteres no válidos en rutas.
  const safeName = event.name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'Evento';
  return `${ALBUM_PREFIX} - ${safeName}`;
}

/**
 * Pide acceso a la galería. Se pide lectura además de escritura porque,
 * para encontrar el álbum del evento y añadirle fotos, hay que poder verlo.
 */
export async function ensureLibraryPermission(): Promise<boolean> {
  const current = await getPermissionsAsync(false, ['photo']);
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await requestPermissionsAsync(false, ['photo']);
  return requested.granted;
}

/**
 * Guarda archivos locales en el álbum del evento y lo crea si no existe.
 * Devuelve las URIs que se guardaron bien (puede ser un subconjunto si alguna falla).
 */
export async function saveToEventAlbum(
  event: Pick<EventoCamEvent, 'name'>,
  fileUris: string[],
): Promise<string[]> {
  if (fileUris.length === 0) return [];
  if (!(await ensureLibraryPermission())) {
    throw new Error('Sin permiso para acceder a la galería. Actívalo en los ajustes del teléfono.');
  }

  const name = eventAlbumName(event);
  const saved: string[] = [];
  let album = await Album.get(name);
  let pending = fileUris;

  if (!album) {
    // Album.create necesita al menos una foto: se crea con la primera.
    const [first, ...rest] = fileUris;
    const firstAsset = await Asset.create(first);
    album = await Album.create(name, [firstAsset], true);
    saved.push(first);
    pending = rest;
  }

  for (const uri of pending) {
    try {
      await Asset.create(uri, album);
      saved.push(uri);
    } catch {
      // Se sigue con el resto; quien llama sabe cuáles no se guardaron.
    }
  }
  return saved;
}
