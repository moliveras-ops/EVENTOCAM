export type EventRole = 'host' | 'guest';

export interface EventoCamEvent {
  id: string;
  /** Código corto que los invitados usan para unirse (p. ej. "K7P2QX"). */
  code: string;
  name: string;
  /** Fecha del evento en formato ISO (AAAA-MM-DD). */
  date: string;
  role: EventRole;
  createdAt: number;
  /** Si está activo, cada foto hecha con la cámara se guarda también en el álbum del evento. */
  autoSaveToAlbum?: boolean;
}

export interface EventPhoto {
  id: string;
  eventId: string;
  /** URI local del archivo dentro del directorio de documentos de la app. */
  uri: string;
  author: string;
  createdAt: number;
  width?: number;
  height?: number;
  /** true cuando la foto ya está en el álbum del evento de la galería del teléfono. */
  savedToAlbum?: boolean;
}

export interface NewEventInput {
  name: string;
  date: string;
}
