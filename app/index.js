import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import { getGymDays, saveGymDays } from "../utils/storage";
import { COLORS, RADIUS, SPACING } from "../utils/theme";

// ─── Exercise Weight Editor ────────────────────────────────────
function ExerciseItem({ exercise, onUpdateWeight, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [tempWeight, setTempWeight] = useState(String(exercise.weight || ""));

  const handleSave = () => {
    const parsed = parseFloat(tempWeight);
    if (!isNaN(parsed)) onUpdateWeight(exercise.id, parsed);
    setEditing(false);
  };

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseSets}>
          {exercise.sets} series × {exercise.reps} reps
        </Text>
      </View>

      {editing ? (
        <View style={styles.weightEdit}>
          <TextInput
            style={styles.weightInput}
            value={tempWeight}
            onChangeText={setTempWeight}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
          />
          <Text style={styles.weightUnit}>kg</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>✓</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setEditing(true)}
          style={styles.weightPill}
        >
          <Text style={styles.weightValue}>{exercise.weight || 0} kg</Text>
          <Text style={styles.weightEditHint}>✎</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => onDelete(exercise.id)}
        style={styles.deleteBtn}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Add Exercise Modal ────────────────────────────────────────
function AddExerciseModal({ visible, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");

  const reset = () => {
    setName("");
    setSets("3");
    setReps("10");
    setWeight("0");
  };

  const handleAdd = () => {
    if (!name.trim()) return Alert.alert("Falta el nombre del ejercicio");
    onAdd({
      id: uuid.v4(),
      name: name.trim(),
      sets: parseInt(sets) || 3,
      reps: parseInt(reps) || 10,
      weight: parseFloat(weight) || 0,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Nuevo Ejercicio</Text>

          <Text style={styles.inputLabel}>Nombre del ejercicio</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="ej. Press banca"
            placeholderTextColor={COLORS.textMuted}
          />

          <View style={styles.row3}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Series</Text>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={setSets}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.gym }]}
            onPress={handleAdd}
          >
            <Text style={[styles.primaryBtnText, { color: "#000" }]}>
              Agregar
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Add Day Modal ─────────────────────────────────────────────
function AddDayModal({ visible, onClose, onAdd }) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return Alert.alert("Escribe el nombre del día");
    onAdd(name.trim());
    setName("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Nuevo Día</Text>
          <Text style={styles.inputLabel}>Nombre del día</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="ej. Día 1 – Pecho y Tríceps"
            placeholderTextColor={COLORS.textMuted}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.gym }]}
            onPress={handleAdd}
          >
            <Text style={[styles.primaryBtnText, { color: "#000" }]}>
              Crear día
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Gym Screen ───────────────────────────────────────────
export default function GymScreen() {
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddDay, setShowAddDay] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getGymDays().then(setDays);
    }, []),
  );

  const persist = (newDays) => {
    setDays(newDays);
    saveGymDays(newDays);
  };

  const addDay = (name) => {
    const newDay = { id: uuid.v4(), name, exercises: [] };
    const updated = [...days, newDay];
    persist(updated);
    setSelectedDay(newDay);
  };

  const deleteDay = (dayId) => {
    Alert.alert("Eliminar día", "¿Seguro?", [
      { text: "Cancelar" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          const updated = days.filter((d) => d.id !== dayId);
          persist(updated);
          if (selectedDay?.id === dayId) setSelectedDay(null);
        },
      },
    ]);
  };

  const addExercise = (exercise) => {
    const updated = days.map((d) =>
      d.id === selectedDay.id
        ? { ...d, exercises: [...d.exercises, exercise] }
        : d,
    );
    persist(updated);
    setSelectedDay(updated.find((d) => d.id === selectedDay.id));
  };

  const updateWeight = (exerciseId, newWeight) => {
    const updated = days.map((d) =>
      d.id === selectedDay.id
        ? {
            ...d,
            exercises: d.exercises.map((e) =>
              e.id === exerciseId ? { ...e, weight: newWeight } : e,
            ),
          }
        : d,
    );
    persist(updated);
    setSelectedDay(updated.find((d) => d.id === selectedDay.id));
  };

  const deleteExercise = (exerciseId) => {
    const updated = days.map((d) =>
      d.id === selectedDay.id
        ? { ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) }
        : d,
    );
    persist(updated);
    setSelectedDay(updated.find((d) => d.id === selectedDay.id));
  };

  const currentDay = selectedDay
    ? days.find((d) => d.id === selectedDay.id)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>MÓDULO</Text>
          <Text style={styles.headerTitle}>Gym 💪</Text>
          <Text style={styles.headerSub}>Registra tu rutina y progreso</Text>
        </View>

        {/* Days list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Días de entrenamiento</Text>
            <TouchableOpacity
              style={styles.addCircle}
              onPress={() => setShowAddDay(true)}
            >
              <Text style={styles.addCircleText}>+</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daysRow}
          >
            {days.map((day) => (
              <TouchableOpacity
                key={day.id}
                onPress={() => setSelectedDay(day)}
                onLongPress={() => deleteDay(day.id)}
                style={[
                  styles.dayChip,
                  selectedDay?.id === day.id && styles.dayChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    selectedDay?.id === day.id && styles.dayChipTextActive,
                  ]}
                >
                  {day.name}
                </Text>
                <Text style={styles.dayChipCount}>
                  {day.exercises.length} ejercicios
                </Text>
              </TouchableOpacity>
            ))}
            {days.length === 0 && (
              <Text style={styles.emptyHint}>
                Toca + para agregar tu primer día
              </Text>
            )}
          </ScrollView>
        </View>

        {/* Exercises for selected day */}
        {currentDay && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{currentDay.name}</Text>
              <TouchableOpacity
                style={[
                  styles.addCircle,
                  { backgroundColor: COLORS.gymBg, borderColor: COLORS.gym },
                ]}
                onPress={() => setShowAddExercise(true)}
              >
                <Text style={[styles.addCircleText, { color: COLORS.gym }]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>

            {currentDay.exercises.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardEmoji}>🏋️</Text>
                <Text style={styles.emptyCardText}>Sin ejercicios aún</Text>
                <Text style={styles.emptyCardSub}>
                  Toca + para agregar ejercicios
                </Text>
              </View>
            ) : (
              currentDay.exercises.map((ex) => (
                <ExerciseItem
                  key={ex.id}
                  exercise={ex}
                  onUpdateWeight={updateWeight}
                  onDelete={deleteExercise}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <AddDayModal
        visible={showAddDay}
        onClose={() => setShowAddDay(false)}
        onAdd={addDay}
      />
      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onAdd={addExercise}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },

  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.gym,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 36, fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  section: { marginHorizontal: SPACING.md, marginBottom: SPACING.lg },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },

  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addCircleText: { fontSize: 20, color: COLORS.textDim, lineHeight: 28 },

  daysRow: { flexDirection: "row" },
  dayChip: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    minWidth: 110,
  },
  dayChipActive: { backgroundColor: COLORS.gymBg, borderColor: COLORS.gym },
  dayChipText: { fontSize: 13, fontWeight: "600", color: COLORS.textDim },
  dayChipTextActive: { color: COLORS.gym },
  dayChipCount: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  emptyHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    alignSelf: "center",
    marginLeft: 8,
    marginTop: 6,
  },

  exerciseRow: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  exerciseSets: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  weightPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gymBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.gym,
    marginHorizontal: SPACING.sm,
  },
  weightValue: { fontSize: 13, fontWeight: "700", color: COLORS.gym },
  weightEditHint: { fontSize: 11, color: COLORS.gymDim, marginLeft: 4 },

  weightEdit: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.sm,
  },
  weightInput: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    color: COLORS.gym,
    fontSize: 14,
    fontWeight: "700",
    width: 60,
    borderWidth: 1,
    borderColor: COLORS.gym,
  },
  weightUnit: { color: COLORS.textMuted, fontSize: 12, marginLeft: 4 },
  saveBtn: {
    backgroundColor: COLORS.gym,
    borderRadius: RADIUS.sm,
    padding: 6,
    marginLeft: 6,
  },
  saveBtnText: { color: "#000", fontWeight: "800" },

  deleteBtn: { padding: 6 },
  deleteBtnText: { color: COLORS.textMuted, fontSize: 14 },

  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyCardEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  emptyCardText: { fontSize: 15, fontWeight: "600", color: COLORS.textDim },
  emptyCardSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  // Modals
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  row3: { flexDirection: "row", gap: SPACING.sm },
  col: { flex: 1 },

  primaryBtn: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
});
