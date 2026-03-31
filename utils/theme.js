export const COLORS = {
  // Base Backgrounds (Deep OLED Dark)
  bg: "#050508", // Un poco más profundo para resaltar las cards
  bgCard: "#12121a",
  bgElevated: "#1c1c28",

  // Borders & Dividers
  border: "#262635",
  borderLight: "#3a3a50",
  outline: "#ffffff10", // Para bordes sutiles internos

  // Gym Section (Acid Yellow/Green)
  gym: "#e8ff47",
  gymDim: "#b5c92e",
  gymBg: "#1a1f04",
  gymText: "#f4ff9d", // Texto específico para contraste en fondos gymBg

  // Plants Section (Neon Mint)
  plants: "#47ffb8",
  plantsDim: "#39cc93",
  plantsBg: "#041a12",
  plantsText: "#a3ffdb",

  // Tasks Section (Sunset Orange)
  tasks: "#ff6b47",
  tasksDim: "#cc5639",
  tasksBg: "#1a0804",
  tasksText: "#ffb5a3",

  // Neutrals & Feedback
  text: "#f8f8fc", // Casi blanco puro para legibilidad
  textDim: "#a6a6bc", // Texto secundario
  textMuted: "#62627a", // Placeholders o fechas

  success: "#00ff73",
  danger: "#ff3d4d",
  warning: "#ffb800", // Añadido para avisos de riego o tareas vencidas
  white: "#ffffff",
  overlay: "rgba(0,0,0,0.6)", // Para modales
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

// Sombras más realistas con opacidades variables
export const SHADOWS = {
  gym: {
    shadowColor: COLORS.gym,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  plants: {
    shadowColor: COLORS.plants,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  tasks: {
    shadowColor: COLORS.tasks,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
};

// Estilos de texto predefinidos para ahorrar código
export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  h2: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  body: { fontSize: 16, fontWeight: "400", color: COLORS.textDim },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
};
