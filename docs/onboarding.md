# Onboarding de Treehubly

## Probar el frontend sin cuenta

Inicia Astro desde la raíz de `tree-hubbly`.

```bash
npm run dev
```

Usa el puerto que indique Astro. Estos enlaces usan el puerto por defecto.

| Qué quieres probar | Página local |
| --- | --- |
| Recorrer los ocho pasos desde el inicio | [Empezar en el paso 1](http://localhost:4321/onboarding/?demo=1) |
| Diseñar un paso específico | [Abrir el paso 4](http://localhost:4321/onboarding/?demo=1&step=4). Cambia `step` a cualquier número del 1 al 8. |
| Revisar la página final directamente | [Ver el onboarding completado](http://localhost:4321/onboarding/complete/?demo=1&step=complete) |
| Revisar un error de guardado y su reintento | [Simular un error al confirmar el paso 4](http://localhost:4321/onboarding/?demo=1&step=4&fail=once) |
| Probar el flujo desde la pantalla de acceso | [Abrir el inicio de sesión de prueba](http://localhost:4321/onboarding/login/?demo=1). Pulsa **Ingresar** con los datos ficticios precargados. |

En este modo puedes entrar directamente a los pasos. Astro simula la sesión y el progreso en el navegador. La prueba funciona sin PHP, sin una cuenta y sin llamadas a GoHighLevel. El modo se habilita únicamente con `npm run dev`.

El progreso simulado se conserva al recargar la pestaña. Cada punto de partida tiene su propio progreso. Para repetir una prueba desde cero, abre el enlace en una pestaña nueva pegándolo en la barra de direcciones, o borra las claves que empiezan por `treehubly:onboarding-demo:` en **DevTools → Application → Session storage**.

El enlace de login muestra el formulario aunque exista una sesión simulada en la pestaña. Al enviar los datos de prueba, vuelves al progreso que tenías guardado.

## Archivos para cambiar el diseño

| Archivo | Responsabilidad |
| --- | --- |
| [OnboardingFlow.tsx](../src/components/onboarding/OnboardingFlow.tsx) | Renderiza el paso activo y el progreso dentro de `/onboarding/`. |
| [onboardingSteps.ts](../src/content/onboardingSteps.ts) | Define los títulos, descripciones y el contenido opcional de cada paso. El orden coincide con el pipeline de GoHighLevel. |
| [OnboardingLogin.tsx](../src/components/onboarding/OnboardingLogin.tsx) | Renderiza el acceso en su propia pantalla, `/onboarding/login/`. |
| [OnboardingComplete.tsx](../src/components/onboarding/OnboardingComplete.tsx) | Renderiza la página final, `/onboarding/complete/`. |
| [useOnboarding.ts](../src/onboarding/useOnboarding.ts) | Mantiene el estado y conecta la interfaz con la sesión y el progreso. |
| [api.ts](../src/onboarding/api.ts) y [demo.ts](../src/onboarding/demo.ts) | Envían las solicitudes a PHP o las simulan en desarrollo. |

El modelo de pasos admite `content` con tipo `video` (URL y subtítulos opcionales) o `iframe` (URL embebida). La vista todavía muestra un marcador de posición y no renderiza esos recursos; la integración visual está pendiente.

```ts
content: { kind: "video", src: "/videos/introduccion.mp4" }
content: { kind: "iframe", src: "https://example.com/formulario" }
```

## Cómo funciona el avance

- `useOnboarding()` entrega `state.kind` con los estados `loading`, `signed-out`, `step` y `completed`.
- `steps` contiene el contenido y el estado de cada paso, `completed`, `current` o `locked`. El arreglo se llena al cargar el progreso.
- `completeCurrentStep()` confirma el paso activo. La interfaz avanza dentro de `/onboarding/` hasta que se confirma el paso 8 y se abre `/onboarding/complete/`. La página final actual muestra el mensaje de finalización, sin un contador visible de 8 de 8. `busy` sirve para bloquear la acción durante el guardado y `error` para mostrar fallos. `refreshProgress()` vuelve a consultar el progreso.
- En cPanel, PHP verifica la sesión y consulta la oportunidad asociada al contacto. GoHighLevel guarda el avance como etapa del pipeline. Al confirmar el paso 8 se guarda la etapa «Completo». Si la sesión caduca, se abre la pantalla de inicio de sesión.

## Pruebas al modificar el frontend

- Desde el paso 1, confirma cada paso y verifica que cambien el título, el paso activo y el progreso en la misma página. Al confirmar el paso 8 debes llegar a `/onboarding/complete/`. Si abres esa URL con pasos pendientes, debes volver al paso activo.
- Abre directamente el paso 4. Si tu diseño muestra la lista de pasos, los tres primeros deben aparecer como completados, el cuarto como activo y los restantes como bloqueados.
- Confirma un paso y recarga la pestaña. Debe aparecer el siguiente paso pendiente.
- En el escenario de error, la primera confirmación debe mostrar el mensaje y conservar el paso y el progreso. Vuelve a confirmar para comprobar que avance una sola vez.
- El renderizado de video e iframe está pendiente. Cuando se integre, prueba un paso de cada tipo en móvil y escritorio.
- Pulsa **Guardar y salir** desde el recorrido o la página final. Debes volver al acceso. En el modo demo, prueba un PIN incorrecto para ver el mensaje de error y usa después `prueba@example.com` con PIN `2468` para recuperar el progreso de esa pestaña.

La prueba local cubre el comportamiento de la interfaz. Para verificar el PIN, las cookies de sesión y la actualización de una etapa real, usa un contacto de prueba y el entorno PHP descrito en la [configuración de cPanel](../README.md#onboarding-en-cpanel). El avance provisional es manual. La regla definitiva para completar cada video o formulario se definirá cuando estén listos los recursos.
