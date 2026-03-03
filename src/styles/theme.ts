// @ts-nocheck
// theme.ts
// Este archivo funciona como un "diccionario" de diseño central.
// En lugar de poner colores o tamaños manualmente en cada pantalla, los guardamos aquí.
// Así, si algún día queremos cambiar el rojo por otro rojo, solo cambiamos este archivo
// y toda la aplicación se actualizará automáticamente.

export const theme = {
  // Aquí definimos la "paleta de colores" de nuestra aplicación.
  colors: {
    background: '#FFFFFF', // Blanco puro, usado para el fondo general de las pantallas.
    primary: '#E12A1B', // Rojo Fuego. Es nuestro color principal para botones y acentos.
    secondary: '#FF8800', // Naranja Fuego. Usado para elementos secundarios llamativos.
    accent: '#FF751F', // Naranja secundario, útil para gradientes o detalles.
    text: '#000000', // Negro fuerte para que el texto principal sea muy legible.
    textLight: '#666666', // Gris oscuro para textos secundarios (menos importantes).
    surface: '#F8F9FA', // Un gris ultra claro. Se usa para el fondo de las "tarjetas" o bloques.
    error: '#D32F2F', // Rojo oscuro clásico para mensajes o botones de error/peligro.
    success: '#E12A1B', // Usamos nuestro rojo principal también para el éxito en este tema.
    border: '#E0E0E0', // Un gris claro para bordes sutiles.
  },

  // 'spacing' (espaciado) define los márgenes (espacio por fuera) y paddings (espacio por dentro).
  // Los números representan píxeles. Esto mantiene el diseño simétrico e uniforme.
  spacing: {
    xs: 4,   // Extra pequeño (para separación muy sutil)
    sm: 8,   // Pequeño (separación de textos cortos)
    md: 16,  // Medio (el espaciado estándar para la mayoría de los bordes)
    lg: 24,  // Grande (separación entre bloques grandes)
    xl: 32,  // Extra grande
    xxl: 48, // Doble extra grande (para separar secciones completamente distintas)
  },

  // 'borderRadius' define qué tan redondas serán las esquinas de los elementos (botones, tarjetas).
  borderRadius: {
    sm: 8,   // Esquinas apenas redondeadas
    md: 16,  // Esquinas más suaves (el estándar en la app)
    lg: 24,  // Esquinas muy redondeadas
    full: 9999, // Un número gigante para hacer que un cuadrado se vuelva un círculo perfecto
  },

  // 'typography' guarda los tamaños y grosores (fontWeight) de nuestros textos.
  // 'h1', 'h2', 'h3' son títulos (headers), 'body' es texto normal, 'caption' texto chiquito.
  typography: {
    h1: { fontSize: 32, fontWeight: '700' }, // Título principal gigante y grueso ('700' es negrita)
    h2: { fontSize: 24, fontWeight: '600' }, // Título secundario
    h3: { fontSize: 20, fontWeight: '600' }, // Subtítulo para secciones
    h4: { fontSize: 18, fontWeight: '600' }, // Subtítulo más sutil
    body: { fontSize: 16, fontWeight: '400' }, // Texto de lectura ('400' es el grosor normal)
    caption: { fontSize: 12, fontWeight: '400' }, // Letra pequeña para notas o subtítulos menores
  }
} as const;
// 'as const' le dice a TypeScript que estos valores son fijos (constantes) 
// y nunca van a cambiar, ayudando a prevenir errores en el código.
