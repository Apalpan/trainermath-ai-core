# CONEIC Cusco 2026 Mobile

Demo mobile premium para el XXXIII CONEIC Cusco 2026. La app esta enfocada en validar la experiencia del participante: onboarding, login, QR, agenda, mapa, visitas, horas, certificados, rankings y asistente IA en modo demo.

## Links del demo

- App directa: https://apalpan.github.io/trainermath-ai-core/coneic-cusco-2026-mobile/
- Visualizador web: https://apalpan.github.io/trainermath-ai-core/visualizador-coneic/

## Credenciales demo

- Usuario: `Alejandro Palpan`
- Correo: `apalpan@coneic.com`
- Clave demo: `12345678`
- Rol: participante verificado / invitado estrategico GEN+
- Codigo: `CNE-2026-00001`

## Flujo demo recomendado

1. Abrir onboarding y mostrar la escala del evento: UAC, 10-14 agosto, 6000 participantes.
2. Entrar con `apalpan@coneic.com / 12345678`.
3. Mostrar Home como centro de control del participante.
4. Abrir QR y explicar check-in verificable.
5. Revisar agenda, timeline del dia y mapa.
6. Preguntar al asistente por agenda, QR, horas, certificados, visitas, mapa o pagos.
7. Cerrar con certificados y horas acumuladas.

## Asistente IA

El asistente esta activo en modo demo avanzado. No llama a OpenAI desde el frontend. Responde por intencion usando una base local de conocimiento del evento y muestra acciones rapidas para navegar dentro de la app.

Para activar IA real despues, usar un backend o funcion serverless como proxy seguro. Ver: `docs/assistant-ai.md`.

## Stack

- Expo SDK 56
- React Native + TypeScript
- React Navigation
- Zustand
- React Hook Form + Zod
- AsyncStorage
- expo-linear-gradient y expo-haptics
- lucide-react-native
- react-native-qrcode-svg

## Instalacion

```bash
npm install
```

## Ejecucion local

```bash
npx expo start
```

Para web:

```bash
npm run web
```

## Validacion

```bash
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## Variables publicas

Copiar `.env.example` si se necesita configurar entorno:

```bash
EXPO_PUBLIC_ASSISTANT_MODE=demo
EXPO_PUBLIC_AI_PROXY_URL=
EXPO_PUBLIC_EVENT_ID=coneic-cusco-2026
```

## Modulos implementados

- Splash y onboarding interactivo con identidad CONEIC Cusco 2026.
- Login demo validado.
- Home ejecutivo con timeline, metricas vivas y acciones sugeridas.
- Perfil y QR de participante.
- Agenda, detalle de evento, ponencias, concursos y visitas.
- Mapa esquematico con pins.
- Check-in/asistencia y modo staff demo.
- Certificados con estados y QR de verificacion.
- Estadisticas, rankings y notificaciones.
- Asistente IA demo con intenciones, confianza, fuente y quick actions.

## Arquitectura preparada para backend

- `src/mocks`: datos demo reemplazables por API.
- `src/services`: capa asincrona con Promises simuladas.
- `src/store`: estado de sesion, agenda y notificaciones.
- `src/screens`: pantallas de producto.
- `src/components`: componentes reutilizables.

## Pendientes para produccion

- API real para usuarios, agenda, cupos, check-in, certificados y soporte.
- Autenticacion con token seguro y refresh.
- QR firmado, sin datos sensibles en payload.
- Validacion anti-duplicidad de asistencia.
- Panel operativo para comite y staff.
- Emision real de certificados con QR auditable.
- Proxy IA con logs, guardrails, rate limiting y fuentes curadas.
