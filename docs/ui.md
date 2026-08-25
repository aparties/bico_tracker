# Sistema de Diseño: Skiz-Inspired (Bicode Tracker)

Este documento define la identidad visual "Modern & Trendy" inspirada en el modelo Skiz y adaptada para Bicode Tracker. La estética se basa en verdes profundos, formas extremadamente redondeadas, marca personalizada y un look limpio y minimalista.

## 1. Paleta de Colores

### Fondos (Backgrounds)
- **Principal**: `#0b241c` (Bosque Oscuro Profundo).
- **Secundario**: `#143028` (Para cards, secciones y paneles flotantes).
- **Inputs/Campos**: `#081a14` (Más oscuro que el fondo principal para dar profundidad).

### Acentos y Acciones
- **Primario (Mint)**: `#57cc99` (Usar para botones principales, éxitos y marcas de selección).
- **Secundario (Sage)**: `#80ed99` (Para degradados, fechas destacadas y decoraciones).
- **Iconos**: Círculos de fondo `#57cc99/10` con icono en `#57cc99`.

---

## 2. Formas y Bordes (Shapes)
- **Botones**: `rounded-full` (Pill-shaped) para acciones principales.
- **Inputs**: `rounded-2xl` o `rounded-full` (en la caja de comandos de voz).
- **Cards/Contenedores**: `rounded-[32px]` o `rounded-[40px]` (Esquinas muy redondeadas y suaves).
- **Bordes**: `border-[#1d4034]` (Sutiles y de bajo contraste verde oscuro).

---

## 3. Elementos de Marca Personalizados

### A. Badge Oficial de Bicode Control
Un contenedor circular que alberga el logo corporativo junto con la marca:
- **Logo**: Imagen circular de 32x32px (`public/logo.png`), que también funciona como favicon en [`src/app/icon.png`](file:///e:/Antigravity_Projects/Bicode_Tracker/src/app/icon.png).
- **Nombre**: Texto "Bicode Control" con tipografía de alto peso visual y subtítulo "System" en color Mint.

### B. Cápsula del Tiempo Dinámica (Perú GMT-5)
Para contextualizar al usuario en su zona horaria local:
- Un contenedor flotante `bg-[#143028]` que renderiza dinámicamente la fecha actual de Lima, Perú (GMT-5).
- Contiene un indicador LED Mint Green con la animación `animate-pulse` para simular sincronización en tiempo real.

---

## 4. Tipografía & Textos
- **Títulos**: `text-white`, `font-black`, `tracking-tight`.
- **Cuerpo**: `text-[#a8b5b0]` (Gris verdoso suave) para evitar fatiga visual.
- **Micro-labels**: `text-[#57cc99]`, `font-semibold`, `text-xs`.

---

## 5. Vistas de Planificación e Interactividad

### A. Kanban Board Layout
Columnas verticales de flujo con esquinas suaves y sutiles animaciones. El estado "URGENTE" en las tarjetas tiene un parpadeo de advertencia en color rojo y sombreado difuso para denotar criticidad inmediata.

### B. Calendar Layout
Estructurado en un contenedor oscuro con tres vistas:
- **Diario (Agenda)**: Lista cronológica de tareas.
- **Mensual (Grid)**: Cuadrícula limpia. Los días con tareas activas muestran un indicador de conteo. El día actual se destaca con un círculo Mint sólido.
- **Anual (Heatmap)**: Vista compacta de 12 meses donde cada día con tareas muestra un indicador de calor con el color según el nivel de prioridad (rojo para URGENT, verde para otras).

### C. Línea de Tiempo de Logs (Actividades)
Línea vertical sutil con puntos interactivos para graficar el historial de auditoría de cada tarea:
- Verde para la creación (`CREATE`).
- Azul para cambios de columna (`STATUS_CHANGE`).
- Naranja para modificaciones temporales (`DATE_UPDATE`).