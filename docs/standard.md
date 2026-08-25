# 🎯 Estándares de Código - Next.js (Senior Level)

## 1. Principios Fundamentales

### DRY (Don't Repeat Yourself)
- ❌ **NUNCA** duplicar código. Si necesitas la misma lógica en dos lugares, extrae una función/componente/utilidad.
- ✅ Crea funciones reutilizables en `/utils` o `/services`.
- ✅ Usa componentes compartidos en `/components`.
- ✅ Extrae constantes y configuraciones a archivos dedicados.
- ✅ Los componentes no deben tener más de 120 lineas de extensión.

### KISS (Keep It Simple, Stupid)
- ✅ Prioriza soluciones simples y directas sobre arquitecturas complejas.
- ✅ Evita sobre-ingeniería. Empieza simple y refactoriza cuando sea necesario.

### YAGNI (You Aren't Gonna Need It)
- ❌ No implementes funcionalidades "por si acaso".
- ✅ Implementa solo lo que necesitas ahora, con extensibilidad en mente.

### SOLID Principles
- **Single Responsibility**: Cada componente/función debe tener una sola responsabilidad.
- **Open/Closed**: Abierto para extensión, cerrado para modificación.
- **Liskov Substitution**: Los componentes deben ser intercambiables sin romper la funcionalidad.
- **Interface Segregation**: Interfaces pequeñas y específicas.
- **Dependency Inversion**: Depende de abstracciones, no de implementaciones concretas.

---

## 2. Arquitectura Next.js (App Router)

### Server Components vs Client Components
- ✅ **En este proyecto, prioriza Client Components (CSR) sobre Server Components (SSR)**.
- ✅ Marca componentes con `"use client"` por defecto para tener interactividad completa.
- ✅ Usa Server Components solo cuando sea estrictamente necesario:
  - Datos que deben ser secretos y no exponerse al cliente
  - Contenido estático que no requiere interactividad
  - Optimizaciones específicas de SEO para contenido público

- ✅ **Estructura recomendada**:
  ```
  page.tsx (Client Component)
    └── Component.tsx (Client Component)
        └── SubComponent.tsx (Client Component)
  ```

- ✅ **Ventajas de Client Components en este proyecto**:
  - Interactividad inmediata sin recargas
  - Mejor experiencia de usuario con estados locales
  - Facilita el uso de hooks y estado de React
  - Compatibilidad completa con librerías del cliente**

### Separación de Responsabilidades
- **Presentación** → `/components` (solo JSX + Tailwind)
- **Lógica de negocio** → `/services` (llamadas API, transformaciones)
- **Utilidades puras** → `/utils` (helpers, formatters, validators)
- **Tipos/Interfaces** → `/interfaces` y `/types`
- **Hooks personalizados** → `/hooks` (lógica reutilizable con estad**o)

---

## 3. TypeScript Best Practices

### Tipado Estricto
- ❌ **NUNCA** uses `any`. Usa `unknown` si el tipo es realmente desconocido.
- ✅ Define tipos explícitos para props, funciones y valores de retorno.
- ✅ Usa `type` para props de componentes, no `interface` ni `FC`.

### Estructura de Tipos
```typescript
// ✅ CORRECTO
type UserProps = {
  name: string;
  age: number;
};

const User = ({ name, age }: UserProps) => {
  // ...
};

// ❌ INCORRECTO
interface UserProps { ... }
const User: FC<UserProps> = ({ name, age }) => { ... };
```

### Tipos vs Interfaces
- **`type`**: Para props de componentes, uniones, intersecciones, tipos derivados.
- **`interface`**: Para contratos de objetos que pueden extenderse (APIs, modelos de datos).

---

## 4. Manejo de Datos y Estado

### React Query (TanStack Query)
- ✅ **SIEMPRE** usa React Query para todas las llamadas API.
- ✅ Usa `useQuery` para datos de lectura.
- ✅ Usa `useMutation` para operaciones de escritura.
- ✅ Centraliza queries en archivos dedicados (`/services` o `/queries`).

### Estado Local vs Global
- ✅ **Estado local**: `useState` para UI temporal (modales, formularios).
- ✅ **Estado global**: Solo cuando múltiples componentes no relacionados necesitan compartir estado.
- ❌ Evita prop drilling excesivo. Considera Context API o estado global si es necesario.

### Server State vs Client State
- ✅ **Server State**: Siempre en React Query.
- ✅ **Client State**: useState, useReducer, o Zustand/Jotai si es necesario.

---

## 5. Performance

### Optimización de Componentes
- ✅ Usa `React.memo()` para componentes que se re-renderizan frecuentemente.
- ✅ Usa `useMemo()` para cálculos costosos.
- ✅ Usa `useCallback()` para funciones pasadas como props a componentes memoizados.

### Imágenes y Assets
- ✅ **SIEMPRE** usa `next/image` para imágenes.
- ✅ Define `width` y `height` o usa `fill` con contenedor.
- ✅ Usa `priority` solo para imágenes above-the-fold.

### Code Splitting
- ✅ Usa `dynamic()` con `ssr: false` para componentes pesados que no necesitan SSR.
- ✅ Lazy load componentes que no son críticos.

### Bundle Size
- ✅ Importa solo lo que necesitas: `import { debounce } from 'lodash-es'` en lugar de `import _ from 'lodash'`.
- ✅ Usa tree-shaking friendly libraries.

---

## 6. Manejo de Errores

### Error Boundaries
- ✅ Implementa Error Boundaries para capturar errores de renderizado.
- ✅ Usa `error.tsx` en App Router para manejo de errores por ruta.

### Validación
- ✅ **SIEMPRE** valida datos del lado del servidor.
- ✅ Usa Zod para validación de schemas.
- ✅ Valida también en el cliente para mejor UX.

### Mensajes de Error
- ✅ Mensajes claros y útiles para el usuario.
- ✅ Logs detallados en desarrollo, mensajes genéricos en producción.
- ✅ Usa toasts (react-hot-toast) para notificaciones, nunca `alert()`.

---

## 7. Seguridad

### Autenticación y Autorización
- ✅ Usa NextAuth para autenticación.
- ✅ Implementa middleware para proteger rutas.
- ✅ Valida permisos en el servidor, no solo en el cliente.

### Validación de Inputs
- ✅ Valida y sanitiza todos los inputs del usuario.
- ✅ Usa prepared statements para queries SQL.
- ✅ Valida tipos y formatos antes de procesar.

### Variables de Entorno
- ✅ **NUNCA** expongas secrets en el código del cliente.
- ✅ Usa `NEXT_PUBLIC_` solo para variables que deben estar en el cliente.
- ✅ Valida que las variables de entorno existan al iniciar la app.

---

## 8. Estructura de Archivos

### Organización
```
src/
  app/              # App Router (rutas, layouts, loading, error)
  components/       # Componentes reutilizables (solo presentación)
  hooks/           # Custom hooks
  services/        # Llamadas API y lógica de negocio
  utils/           # Funciones puras y helpers
  interfaces/      # *.interface.ts
  types/           # *.type.ts
  lib/             # Configuraciones (Supabase, etc.)
```

### Naming Conventions
- ✅ Componentes: PascalCase (`UserProfile.tsx`)
- ✅ Utilidades: camelCase (`formatDate.ts`)
- ✅ Constantes: UPPER_SNAKE_CASE (`API_BASE_URL`)
- ✅ Hooks: camelCase con prefijo `use` (`useAuth.ts`)

---

## 9. Testing

### Estrategia de Testing
- ✅ Tests de comportamiento (behavior-driven), no de implementación.
- ✅ Tests de integración para flujos críticos.
- ✅ Tests unitarios para utilidades y funciones puras.

### Configuración
- ✅ No esperes imports de React en componentes (React 18+ no lo requiere).
- ✅ Mockea dependencias externas (APIs, servicios).

---

## 10. Código Limpio

### Funciones
- ✅ Funciones pequeñas y con un solo propósito (≤50 líneas idealmente).
- ✅ Nombres descriptivos que explican qué hace la función.
- ✅ Máximo 3-4 parámetros. Usa objetos para más parámetros.

### Componentes
- ✅ Componentes pequeños y atómicos (≤100 líneas idealmente).
- ✅ Extrae lógica compleja a hooks o utilidades.
- ✅ Props claras y bien tipadas.

### Comentarios
- ✅ Comenta el "por qué", no el "qué".
- ✅ Código auto-documentado > comentarios.
- ❌ No dejes código comentado. Usa git para historial.

---

## 11. Accesibilidad (a11y)

### HTML Semántico
- ✅ Usa elementos HTML semánticos (`<nav>`, `<main>`, `<article>`, etc.).
- ✅ Usa `aria-label` cuando el texto visible no es suficiente.

### Navegación por Teclado
- ✅ Asegura que toda la funcionalidad sea accesible por teclado.
- ✅ Usa `tabIndex` apropiadamente.

### Contraste y Colores
- ✅ Mantén contraste suficiente (WCAG AA mínimo).
- ✅ No dependas solo del color para transmitir información.

---

## 12. Convenciones Específicas del Proyecto

### Tailwind CSS
- ✅ Usa solo clases de Tailwind, evita CSS custom.
- ✅ Usa la paleta de colores del proyecto (`pch-*`).
- ✅ No modifiques `tailwind.config.ts` sin necesidad.

### Íconos
- ✅ Usa **lucide-react** exclusivamente.
- ❌ No uses SVGs hard-coded ni otras librerías de íconos.

### Dependencias
- ✅ Usa **Yarn** para gestión de dependencias.
- ✅ Verifica si la funcionalidad ya existe antes de instalar nuevas librerías.

### Formularios
- ✅ Usa `@tanstack/react-form` para manejo de formularios.
- ✅ Valida con Zod en todos los formularios.

---

## 13. Git y Versionado

### Commits
- ✅ Commits atómicos y descriptivos.
- ✅ Usa mensajes claros: "feat: agregar autenticación" en lugar de "cambios".

### Branches
- ✅ Usa branches descriptivos.
- ✅ Mantén `main` siempre estable.

---

## 14. Documentación

### Código
- ✅ Documenta funciones complejas con JSDoc.
- ✅ Mantén README actualizado.
- ✅ Documenta decisiones arquitectónicas importantes.

### API
- ✅ Documenta endpoints con ejemplos de request/response.
- ✅ Define DTOs claramente.

---

## 15. Checklist Pre-Deploy

Antes de hacer merge o deploy, verifica:

- [ ] ✅ `npx tsc` sin errores
- [ ] ✅ `yarn test --run` pasa todos los tests
- [ ] ✅ `yarn lint` sin errores
- [ ] ✅ `yarn build` exitoso
- [ ] ✅ No hay `console.log` de debug
- [ ] ✅ No hay `any` types
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Errores manejados apropiadamente
- [ ] ✅ Performance aceptable (Lighthouse score > 90)

---

## 16. Anti-Patterns a Evitar

- ❌ **Prop Drilling**: Usa Context o estado global si pasas props más de 3 niveles.
- ❌ **God Components**: Componentes que hacen demasiado. Divídelos.
- ❌ **Magic Numbers/Strings**: Usa constantes con nombres descriptivos.
- ❌ **Side Effects en Render**: Usa `useEffect` para side effects.
- ❌ **Mutaciones Directas**: No mutes estado directamente, usa setters.
- ❌ **Fetch en useEffect**: Usa React Query en su lugar.
- ❌ **Server Components innecesarios**: En este proyecto, prioriza Client Components para mejor interactividad.
- ❌ **Re-inventar la rueda**: Usa librerías establecidas cuando sea apropiado.

---

## 17. Refactoring Guidelines

- ✅ Refactoriza cuando encuentres código duplicado (DRY).
- ✅ Refactoriza cuando un componente/función crece demasiado.
- ✅ Refactoriza cuando la complejidad ciclomática es alta.
- ✅ Haz refactors pequeños e incrementales.
- ✅ Asegura que los tests pasen después de cada refactor.

---

## Resumen de Prioridades

1. **DRY**: No repetir código.
2. **TypeScript estricto**: Sin `any`, tipos explícitos.
3. **Client Components por defecto**: Prioriza CSR sobre SSR para mejor interactividad.
4. **React Query**: Para todas las llamadas API.
5. **Separación de responsabilidades**: Lógica fuera de componentes.
6. **Performance**: Optimiza imágenes, code splitting, memoización.
7. **Seguridad**: Validación, autenticación, variables de entorno.
8. **Testing**: Tests de comportamiento, no de implementación.
9. **Código limpio**: Funciones y componentes pequeños y claros.
10. **Accesibilidad**: HTML semántico, navegación por teclado.

