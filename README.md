# EventoCam 📸

App móvil (Android e iOS) para reunir las fotos de un evento: bodas, cumpleaños, fiestas…
El anfitrión crea el evento y comparte un **código QR**. Los invitados se unen escaneándolo
y hacen fotos desde la app o las suben desde su galería.

Hecha con **Expo SDK 58**, **React Native 0.88**, **Expo Router** y TypeScript.

## Funcionalidades

- **Crear eventos** con nombre y fecha. Cada uno recibe un código de 6 caracteres (p. ej. `K7P2QX`).
- **Invitar** con QR o compartiendo el enlace `eventocam://join?code=…`.
- **Unirse a un evento** escaneando el QR con la cámara o escribiendo el código.
- **Cámara integrada**: cámara trasera o frontal, flash (no / auto / sí) y un contador de fotos hechas.
- **Subir fotos de la galería**, hasta 20 de una vez.
- **Galería del evento** en cuadrícula, con el autor y la hora de cada foto.
- **Carpeta del evento en la galería del teléfono**: cada evento tiene su álbum
  (`EventoCam - <nombre del evento>`). Se puede guardar todo con un botón, o activar el
  guardado automático para que cada foto hecha con la cámara vaya directa a la carpeta.
  Las fotos ya guardadas llevan una ✓ y no se duplican.
- **Detalle de foto**: guardarla en la carpeta del evento, compartirla o borrarla.
- **Nombre del usuario**: aparece como autor de sus fotos.

## Requisitos

- Node.js 20 o superior
- En el móvil: la app **Expo Go**, o una *development build* (ver más abajo)

## Puesta en marcha

```bash
npm install
npm start          # inicia el servidor de desarrollo (Metro)
```

Escanea el QR que aparece en la terminal con Expo Go (Android) o con la app Cámara (iOS).

Otros comandos:

```bash
npm run android    # abre en un emulador o dispositivo Android
npm run ios        # abre en el simulador de iOS (requiere macOS)
npm run typecheck  # comprobación de tipos con TypeScript
npm run lint       # ESLint
```

### Compilar la app instalable

Con [EAS Build](https://docs.expo.dev/build/introduction/) no hace falta Xcode ni Android Studio:

```bash
npx eas-cli@latest build --platform android   # genera APK/AAB
npx eas-cli@latest build --platform ios
```

Las carpetas `android/` e `ios/` se generan solas (*Continuous Native Generation*).
Los permisos y la configuración nativa se ajustan en `app.json`.

## Estructura

```
src/
├── app/                       # Pantallas (Expo Router: cada archivo es una ruta)
│   ├── _layout.tsx            # Navegación raíz (Stack) y proveedor de estado
│   ├── index.tsx              # Inicio: mis eventos, mi nombre, crear / unirme
│   ├── create.tsx             # Formulario de nuevo evento
│   ├── join.tsx               # Unirse por código; destino del enlace del QR
│   ├── scan.tsx               # Lector de códigos QR
│   └── event/[id]/
│       ├── index.tsx          # Galería del evento
│       ├── camera.tsx         # Cámara para hacer fotos
│       ├── qr.tsx             # QR y código para invitar
│       └── photo/[photoId].tsx  # Foto a pantalla completa
├── components/                # Botón y estado vacío reutilizables
└── lib/
    ├── types.ts               # Modelos: evento y foto
    ├── storage.ts             # Persistencia (AsyncStorage + expo-file-system)
    ├── deviceAlbum.ts         # Álbum del evento en la galería del teléfono
    ├── EventsContext.tsx      # Estado global de eventos y perfil
    ├── invite.ts              # Generación y lectura de enlaces de invitación
    ├── ids.ts                 # IDs y códigos de evento
    └── theme.ts               # Colores, espaciados y formato de fechas
```

## Cómo se guardan los datos

En esta primera versión todo se guarda **en el propio dispositivo**:

- Los datos de eventos y fotos se guardan en `AsyncStorage`.
- Las imágenes se copian a la carpeta de documentos de la app (`Paths.document/eventocam/<idEvento>/`).
- Opcionalmente, se copian también a un álbum con el nombre del evento en la galería del teléfono
  (`src/lib/deviceAlbum.ts`). En Android es una carpeta en `Pictures/`; en iOS, un álbum de Fotos.
  Así, aunque se desinstale la app, esas fotos siguen en el teléfono.

Cuando un invitado se une con un código, se crea en su móvil una copia local del evento.
Las fotos que hace cada persona **no se envían todavía a los demás dispositivos**.

### Próximo paso: galería compartida

Para que todos vean las fotos de todos, hace falta un backend (por ejemplo Firebase o Supabase)
que almacene las imágenes y los eventos. Todo el acceso a datos pasa por `src/lib/storage.ts`.
Ahí bastaría con:

1. Que `createEvent` / `joinEvent` registren y busquen el evento por código en el servidor.
2. Que `addPhoto` suba el archivo además de guardarlo en local.
3. Que `loadPhotos` descargue la lista de fotos del evento.

Las pantallas no tendrían que cambiar.
