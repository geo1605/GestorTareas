import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"; // <-- Agregado para íconos
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

// ─── Sombras reutilizables ─────────────────────────────────────
const SHADOWS = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: COLORS.gym || "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
};

// ─── Exercise Weight Editor ────────────────────────────────────
function ExerciseItem({ exercise, onUpdateWeight, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [tempWeight, setTempWeight] = useState(String(exercise.weight || ""));

  const handleSave = () => {
    const parsed = parseFloat(tempWeight);
    if (!isNaN(parsed)) {
      onUpdateWeight(exercise.id, parsed);
    } else {
      setTempWeight(String(exercise.weight || ""));
    }
    setEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Eliminar ejercicio",
      `¿Seguro que deseas eliminar "${exercise.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => onDelete(exercise.id),
        },
      ],
    );
  };

  return (
    <View style={[styles.exerciseRow, SHADOWS.card]}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseSets}>
          <Ionicons name="repeat" size={12} color={COLORS.textMuted} />{" "}
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
            onBlur={handleSave}
          />
          <Text style={styles.weightUnit}>kg</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="checkmark-sharp" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setEditing(true)}
          style={styles.weightPill}
          activeOpacity={0.7}
        >
          <Text style={styles.weightValue}>
            {exercise.weight || 0}{" "}
            <Text style={styles.weightUnitSmall}>kg</Text>
          </Text>
          <Ionicons
            name="pencil"
            size={12}
            color={COLORS.gym}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={confirmDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
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
    if (!name.trim())
      return Alert.alert("Ups", "Falta el nombre del ejercicio");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayInner} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Nuevo Ejercicio</Text>

            <Text style={styles.inputLabel}>Nombre del ejercicio</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="barbell-outline"
                size={18}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputFlex}
                value={name}
                onChangeText={setName}
                placeholder="ej. Press de banca"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.row3}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Series</Text>
                <TextInput
                  style={styles.inputBox}
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.inputBox}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, SHADOWS.button]}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Agregar Ejercicio</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Day Modal ─────────────────────────────────────────────
function AddDayModal({ visible, onClose, onAdd }) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return Alert.alert("Ups", "Escribe el nombre del día");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayInner} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Nuevo Día de Rutina</Text>

            <Text style={styles.inputLabel}>Nombre del día</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputFlex}
                value={name}
                onChangeText={setName}
                placeholder="ej. Pecho y Tríceps"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, SHADOWS.button]}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Crear Día</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
      getGymDays().then((data) => {
        setDays(data);
        if (data.length > 0 && !selectedDay) setSelectedDay(data[0]);
      });
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
    Alert.alert(
      "Eliminar rutina",
      "¿Eliminar este día y todos sus ejercicios?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            const updated = days.filter((d) => d.id !== dayId);
            persist(updated);
            if (selectedDay?.id === dayId) setSelectedDay(updated[0] || null);
          },
        },
      ],
    );
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
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>MÓDULO</Text>
          <Text style={styles.headerTitle}>Gym</Text>
          <Text style={styles.headerSub}>
            Registra tu rutina y supera tus límites
          </Text>
        </View>

        {/* Days list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tus Rutinas</Text>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowAddDay(true)}
            >
              <Ionicons name="add" size={24} color={COLORS.gym} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daysRow}
            contentContainerStyle={{
              paddingRight: SPACING.md,
              paddingLeft: SPACING.md,
              paddingBottom: 10,
            }}
          >
            {days.map((day) => {
              const isActive = selectedDay?.id === day.id;
              return (
                <TouchableOpacity
                  key={day.id}
                  onPress={() => setSelectedDay(day)}
                  onLongPress={() => deleteDay(day.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.dayChip,
                    isActive ? styles.dayChipActive : SHADOWS.card,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      isActive && styles.dayChipTextActive,
                    ]}
                  >
                    {day.name}
                  </Text>
                  <View style={styles.dayChipBadge}>
                    <Text
                      style={[
                        styles.dayChipCount,
                        isActive && { color: COLORS.gym },
                      ]}
                    >
                      {day.exercises.length} ej.
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {days.length === 0 && (
              <TouchableOpacity
                style={styles.emptyDayChip}
                onPress={() => setShowAddDay(true)}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={COLORS.gym}
                />
                <Text style={styles.emptyHint}>Crear primer día</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Exercises for selected day */}
        {currentDay && (
          <View style={[styles.section, { marginHorizontal: SPACING.md }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{currentDay.name}</Text>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: COLORS.gym }]}
                onPress={() => setShowAddExercise(true)}
              >
                <Ionicons name="add" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {currentDay.exercises.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyCard}
                onPress={() => setShowAddExercise(true)}
                activeOpacity={0.7}
              >
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons
                    name="weight-lifter"
                    size={48}
                    color={COLORS.gym}
                  />
                </View>
                <Text style={styles.emptyCardText}>No hay ejercicios aquí</Text>
                <Text style={styles.emptyCardSub}>
                  Toca para comenzar a armar tu rutina
                </Text>
              </TouchableOpacity>
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
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.gym,
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerEmoji: { fontSize: 32 },
  headerSub: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "500",
  },

  section: { marginBottom: SPACING.xl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gymBg,
    alignItems: "center",
    justifyContent: "center",
  },

  daysRow: { flexDirection: "row" },
  dayChip: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.md,
    minWidth: 130,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayChipActive: {
    backgroundColor: COLORS.gymBg,
    borderColor: COLORS.gym,
  },
  dayChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDim,
    marginBottom: 6,
  },
  dayChipTextActive: { color: COLORS.gym },
  dayChipBadge: {
    backgroundColor: COLORS.bgElevated,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayChipCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },

  emptyDayChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyHint: {
    color: COLORS.gym,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  exerciseRow: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseInfo: { flex: 1, paddingRight: 10 },
  exerciseName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseSets: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },

  weightPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  weightValue: { fontSize: 15, fontWeight: "800", color: COLORS.gym },
  weightUnitSmall: { fontSize: 12, fontWeight: "600" },

  weightEdit: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.sm,
  },
  weightInput: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    width: 60,
    borderWidth: 1,
    borderColor: COLORS.gym,
    textAlign: "center",
  },
  weightUnit: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: COLORS.gym,
    borderRadius: RADIUS.md,
    padding: 6,
    marginLeft: 10,
  },

  deleteBtn: { padding: 8, opacity: 0.6 },

  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    padding: SPACING.xl,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gymBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyCardText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyCardSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Modals
  overlay: { flex: 1 },
  overlayInner: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === "ios" ? 50 : SPACING.xl,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: SPACING.xl,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: { marginRight: 10 },
  inputFlex: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 16 : 12,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },

  row3: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.lg },
  col: { flex: 1 },
  inputBox: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Platform.OS === "ios" ? 16 : 12,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  primaryBtn: {
    backgroundColor: COLORS.gym,
    borderRadius: RADIUS.full,
    padding: 18,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 0.5,
  },
});
