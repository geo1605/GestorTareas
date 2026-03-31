import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  GYM_DAYS: 'gym_days',
  PLANTS: 'plants',
  TASKS: 'tasks',
};

// ─── GYM ───────────────────────────────────────────────
export async function getGymDays() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GYM_DAYS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveGymDays(days) {
  await AsyncStorage.setItem(KEYS.GYM_DAYS, JSON.stringify(days));
}

// ─── PLANTS ─────────────────────────────────────────────
export async function getPlants() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PLANTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function savePlants(plants) {
  await AsyncStorage.setItem(KEYS.PLANTS, JSON.stringify(plants));
}

// ─── TASKS ──────────────────────────────────────────────
export async function getTasks() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveTasks(tasks) {
  await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}
