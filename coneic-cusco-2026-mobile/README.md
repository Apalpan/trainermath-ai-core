# CONEIC Cusco 2026 Mobile

App mobile V1 para el XXXIII CONEIC Cusco 2026, Congreso Nacional de Estudiantes de Ingeniería Civil. Es una primera versión funcional en Expo, React Native y TypeScript, diseñada como extensión mobile premium de la landing oficial: experiencia oscura, institucional, tecnológica y con señales andinas/cusqueñas.

Referencia visual y contenido: https://www.xxxiiiconeiccusco2026.com/

## Stack

- Expo SDK 56
- React Native + TypeScript
- React Navigation para stack + bottom tabs
- Zustand para sesión, agenda y notificaciones
- React Hook Form + Zod para login validado
- AsyncStorage para sesión local mock
- expo-linear-gradient y expo-haptics
- lucide-react-native para iconografía
- react-native-qrcode-svg para QR
- date-fns para fechas

## Cómo instalar

```bash
npm install
```

## Cómo correr

```bash
npx expo start
```

Para iOS:

```bash
npx expo start --ios
```

Para Android:

```bash
npx expo start --android
```

Para dev build local si aplica:

```bash
npx expo run:ios
npx expo run:android
```

## Credenciales mock

- Correo: `participante@coneic.com`
- DNI/clave: `12345678`

## Estructura

```txt
src/
  components/
    cards/
    feedback/
    layout/
    ui/
  constants/
  mocks/
  navigation/
  screens/
  services/
  store/
  types/
  utils/
```

## Módulos implementados

- Splash / loading
- Onboarding de 3 slides
- Login con validación y sesión local
- Home dashboard con próximo evento, QR, certificación, avisos y accesos rápidos
- Perfil del participante con QR y credencial
- Agenda de 5 días con filtros por tipo y agregar a mi agenda
- Detalle de evento con variantes para ponencia, concurso y visita
- Ponencias con búsqueda, filtros, detalle y agregar a agenda
- Concursos con categorías, detalle y ranking mock
- Visitas técnicas/turísticas con reserva mock
- Mapa esquemático con pins, filtros y bottom sheet
- Check-in/asistencia con historial y modo staff demo
- Certificados con estados, QR de verificación y descarga mock
- Estadísticas con ranking, medallero y barras nativas
- Asistente CONEIC rule-based con respuestas y enlaces internos
- Notificaciones leídas/no leídas
- Configuración, selector visual de idioma y logout

## Decisiones técnicas

Se usa React Navigation en vez de Expo Router para esta V1 porque el producto necesita un grafo explícito de tabs persistentes, stack interno y pantallas modales/detalle que todavía cambiarán rápido durante validación. Esto deja el flujo claro para el equipo, reduce magia de archivos en una primera entrega y sigue siendo compatible con una migración futura si se decide adoptar rutas file-based.

La UI usa StyleSheet moderno en vez de NativeWind para reducir dependencias de configuración en Expo Go y mantener performance/control visual en componentes mobile. La estructura separa mocks, servicios, stores, tipos y pantallas para que el backend real pueda entrar sin reescribir la UI.

## Pendientes para producción

- API backend real para usuarios, agenda, cupos, check-in y certificados.
- Autenticación con token seguro y refresh.
- QR firmado o hash, nunca DNI completo.
- Validación de asistencia contra backend.
- Prevención de duplicidad de check-in por evento.
- Modo offline básico para staff y sincronización posterior.
- Logs de check-in, auditoría y trazabilidad.
- CDN para imágenes de ponentes, sedes y sponsors.
- Rate limiting y monitoreo.
- Backups y panel operativo para comité.
- Traducción completa si se activa UI multiidioma.

## Backend recomendado

API REST modular:

- `POST /auth/login`
- `GET /participants/me`
- `GET /events?day=&type=&page=`
- `POST /participants/me/agenda`
- `GET /attendance/me`
- `POST /staff/checkins`
- `GET /certificates/me`
- `GET /stats/summary`
- `GET /notifications`

Base de datos relacional para participantes, eventos, inscripciones, asistencias, certificados y rankings. Cache para agenda pública y estadísticas. Cola ligera para emisión de certificados y notificaciones.

## Escalabilidad para 6000 usuarios

- FlatList en listas operativas.
- IDs estables en mocks y servicios.
- Capa services aislada para sustituir mocks por API.
- Estado global mínimo para evitar renders innecesarios.
- Paginación futura prevista en agenda/ponencias.
- QR y check-in diseñados para operar con backend y fallback offline.

## Flujo futuro de QR/check-in

1. Usuario autenticado recibe token firmado asociado a `participantCode`.
2. Staff escanea QR desde modo operador.
3. App valida firma local básica y consulta backend.
4. Backend confirma inscripción, evento, ventana horaria y duplicidad.
5. Se registra asistencia con `eventId`, `participantId`, `staffId`, timestamp y device.
6. Si no hay internet, se guarda en cola offline cifrada y se sincroniza al recuperar conexión.

## Publicación futura en App Store

- Definir iconos finales, splash nativo y assets oficiales.
- Configurar EAS Build y perfiles de distribución.
- Revisar privacidad, permisos y textos de soporte.
- Probar en iPhone SE, iPhone 13/14/15 y Pro Max.
- Preparar screenshots, metadata y cuenta Apple Developer del comité.
