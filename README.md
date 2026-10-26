# Venta de celulares

Aplicación Angular standalone para tienda online, mostrador, pedidos, garantías y tablero comercial.

## Inicio

```sh
npm install
npm start
```

Abrir la dirección local que muestra Angular CLI. `npm run build` genera la versión de producción.

## Datos de prueba

`src/environments/environment.ts` define `useMock: true` por defecto; así la aplicación funciona sin backend. El selector del encabezado cambia el rol del usuario de prueba. Para conectar el backend local, cambiar `useMock` a `false`: las peticiones usan `apiBaseUrl` y el proxy de `/api` apunta a `http://localhost:8080`. No se requieren credenciales para los mocks.

## Organización

`src/app/features/` contiene una carpeta y rutas lazy por funcionalidad. `src/app/core/` contiene sesión, HTTP y navegación; `src/app/shared/` contiene tipos y componentes reutilizables. `src/styles.scss` reúne las variables y estilos globales.
