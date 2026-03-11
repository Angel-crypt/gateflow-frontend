# gateflow-frontend

Frontend del Sistema de Gestión de Accesos para Parques Industriales.

Aplicación web construida con React + Vite, orientada a tres tipos de usuario: administrador del parque, guardia de seguridad y usuario de empresa.

---

## Tecnologías utilizadas

| Herramienta | Versión | Motivo |
|---|---|---|
| React | 18+ | Librería UI basada en componentes |
| Vite | 5+ | Bundler rápido con HMR |
| SWC | vía plugin | Compilador en Rust, reemplaza Babel |
| React Router DOM | 6+ | Ruteo del lado del cliente con rutas protegidas por rol |
| Axios | 1+ | Cliente HTTP para consumir la API de Django |
| TanStack Query | 5+ | Manejo de estado del servidor y caché de peticiones |

---

## Requisitos previos

Verifica tu versión antes de instalar:

```bash
node -v
npm -v
```

---

## Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/Angel-crypt/parkaccess-frontend.git

# 2. Entra a la carpeta
cd parkaccess-frontend

# 3. Instala las dependencias
npm install
```

---

## Comandos disponibles

```bash
# Inicia el servidor de desarrollo
npm run dev

# Compila el proyecto para producción
npm run build

# Previsualiza el build de producción localmente
npm run preview

# Revisa errores de linting
npm run lint
```

El servidor de desarrollo corre en `http://localhost:5173` por defecto.

---

## Estructura de carpetas

```
parkaccess-frontend/
├── public/                  # Archivos estáticos públicos
├── src/
│   ├── api/                 # Configuración de Axios e instancias por módulo
│   ├── auth/                # Lógica de autenticación, contexto de sesión y token
│   ├── components/          # Componentes reutilizables entre roles
│   ├── layouts/             # Estructuras visuales por rol (sidebar, navbar)
│   ├── pages/
│   │   ├── admin/           # Pantallas del administrador del parque
│   │   ├── guard/           # Pantallas del guardia de seguridad
│   │   └── company/         # Pantallas del usuario de empresa
│   ├── router/              # Definición de rutas y guardias por rol
│   ├── App.jsx              # Componente raíz
│   └── main.jsx             # Punto de entrada de la aplicación
├── index.html
├── vite.config.js
└── package.json
```

### Descripción de carpetas clave

**`src/api/`**
Contiene la instancia base de Axios con la URL del backend y los interceptores de autenticación. Cada módulo tiene su propio archivo (por ejemplo `access.api.js`, `passes.api.js`).

**`src/auth/`**
Maneja el contexto de sesión del usuario autenticado, el almacenamiento del token JWT y el hook `useAuth` que exponen el rol y los datos del usuario a toda la app.

**`src/components/`**
Componentes genéricos sin lógica de negocio: botones, inputs, tablas, badges de estado, mensajes de error. Usados por los tres roles.

**`src/layouts/`**
Un layout por rol. Cada uno define la estructura visual base: el sidebar del administrador, la barra superior del guardia, la vista simplificada de empresa. Las páginas de cada rol se renderizan dentro de su layout correspondiente.

**`src/pages/`**
Separado estrictamente por rol. Cada subcarpeta contiene únicamente las pantallas que ese rol puede ver. Ninguna página cruza carpetas de rol.

**`src/router/`**
Define todas las rutas de la aplicación. Incluye un componente `ProtectedRoute` que lee el rol del usuario autenticado y redirige si no tiene acceso a la ruta solicitada.

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Para producción, crea `.env.production` con la URL del backend desplegado.

> Los archivos `.env` no se suben al repositorio. Están incluidos en `.gitignore`.
