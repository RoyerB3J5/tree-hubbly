# Treehubly

Sitio web de Treehubly construido con Astro y React.

## Desarrollo local

```bash
npm run dev
npm run build
```

La guía de [funcionamiento y pruebas del onboarding](docs/onboarding.md) explica cómo recorrer las ocho etapas sin una cuenta ni llamadas a GoHighLevel. El modo demo está disponible únicamente durante `npm run dev`.

## Onboarding en cPanel

`/onboarding/` muestra el paso activo de los ocho pasos del pipeline de GoHighLevel. La compilación es estática: publica el contenido de `dist/` en el document root del dominio con HTTPS. Los endpoints de `public/onboarding/api/` se incluyen en la compilación y requieren PHP 8.1+ y la extensión cURL. [Documentación del despliegue estático de Astro](https://docs.astro.build/en/basics/project-structure/) · [MultiPHP Manager](https://docs.cpanel.net/cpanel/software/multiphp-manager-for-cpanel/)

Crea `treehubly-onboarding.php` un nivel por encima del document root. Si el document root es `/home/usuario/public_html`, la ruta será `/home/usuario/treehubly-onboarding.php`. PHP también acepta una ruta privada explícita en la variable de servidor `TREEHUBLY_ONBOARDING_CONFIG`. El proceso de PHP necesita permiso de escritura en ese directorio para guardar el límite de intentos y coordinar las actualizaciones de progreso.

```php
<?php
return [
    'api_token' => 'token de GoHighLevel',
    'location_id' => 'ID de la ubicación de GoHighLevel',
    'preview_email' => '',
];
```

Usa un token con acceso de lectura a contactos y lectura y escritura de oportunidades. El correo de prueba es opcional; si lo configuras, debe corresponder a un contacto con PIN y una oportunidad del pipeline de onboarding. Las confirmaciones de pasos con esa cuenta actualizan su oportunidad en GoHighLevel. La búsqueda conserva la versión `2021-07-28` que usa la aplicación original, marcada como obsoleta por HighLevel. [Búsqueda de oportunidades](https://marketplace.gohighlevel.com/docs/2021-07-28/ghl/opportunities/search-opportunity/index.html)

Para servir la compilación con PHP en local, ejecuta `php -S 127.0.0.1:8080 -t dist` con cURL habilitado y visita `http://127.0.0.1:8080/onboarding/login/`.

Los títulos y descripciones de los pasos se configuran en `src/content/onboardingSteps.ts`. El modelo admite contenido de tipo video o iframe, aunque la interfaz actual todavía muestra un marcador de posición. El recorrido avanza mediante confirmación manual; la condición para completar cada video o formulario queda pendiente de definir.

La ruta `/onboarding/` monta una instancia de `OnboardingFlow.tsx` y conserva el avance entre pasos sin cambiar la URL. Al confirmar el paso 8, abre `/onboarding/complete/`. El formulario de acceso está en `/onboarding/login/`; **Guardar y salir** y una sesión caducada llevan de vuelta a esa ruta.

- `state.kind` indica si se está cargando (`loading`), falta iniciar sesión (`signed-out`), hay un paso activo (`step`) o terminó el onboarding (`completed`).
- `steps` proporciona el contenido y estado de cada paso (`completed`, `current` o `locked`) una vez cargado el progreso. `totalSteps` está disponible desde el inicio.
- `completeCurrentStep()` confirma el paso activo con PHP. `refreshProgress()` consulta el avance de GoHighLevel. `busy` y `error` permiten mostrar el estado de esas operaciones.
- `signOut()` cierra la sesión actual.
