# Electiva Frontend

Proyecto React (Vite) para visualización en tiempo real y gráficos históricos usando Vega-Lite.

Comandos rápidos (PowerShell):

```powershell
cd Frontend
npm install --legacy-peer-deps
npm run dev
```

API esperada: backend en `http://localhost:8080` con endpoints `/api/datos` y `/api/dispositivos`.

Si tu backend corre en otro puerto, configura la variable de entorno para el dev server de Vite:

```powershell
# Windows PowerShell
$env:VITE_API_URL = 'http://localhost:8080'
npm run dev
```

O añade un archivo `.env` en `Frontend/` con:

```
VITE_API_URL=http://localhost:8080
```

Cuando el backend esté en `8080`, la app Vite se conectará correctamente (sockets y endpoints).
# Frontend

Carpeta para la parte frontend del proyecto Electiva.

Instrucciones rápidas:

- Abrir `index.html` en el navegador para la versión estática inicial.
- Para servir localmente: `npx serve Frontend` o `python3 -m http.server --directory Frontend 8000`.
- Si vas a usar un framework (React/Vue/etc.), crea ahí la estructura del proyecto y añade instrucciones aquí.
