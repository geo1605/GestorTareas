import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import {
  cancelNotification,
  scheduleTaskNotification,
} from "../utils/notifications";
import { getTasks, saveTasks } from "../utils/storage";
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from "../utils/theme";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const DAY_NAMES = {
  L: "Lun",
  M: "Mar",
  X: "Mié",
  J: "Jue",
  V: "Vie",
  S: "Sáb",
  D: "Dom",
};

// Helper para obtener la fecha local actual en formato YYYY-MM-DD
const getLocalToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ─── Task Card Component ───────────────────────────────────────
function TaskCard({ task, onToggle, onDelete }) {
  const repeatLabel = task.repeats
    ? task.repeatDays.map((d) => DAY_NAMES[d]).join(", ")
    : "Una vez";

  return (
    <View
      style={[
        styles.taskCard,
        task.completed && styles.taskCardDone,
        !task.completed && SHADOWS.soft,
      ]}
    >
      <TouchableOpacity
        onPress={() => onToggle(task.id)}
        style={styles.taskCheckArea}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
      >
        <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
          {task.completed && (
            <Ionicons name="checkmark-sharp" size={16} color={COLORS.bg} />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text
          style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
        >
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          {task.hasTime && task.time && (
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={12} color={COLORS.tasksDim} />
              <Text style={styles.metaPillText}>{task.time}</Text>
            </View>
          )}
          <View style={styles.metaPill}>
            <Ionicons
              name={task.repeats ? "repeat-outline" : "calendar-outline"}
              size={12}
              color={COLORS.tasksDim}
            />
            <Text style={styles.metaPillText}>{repeatLabel}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => onDelete(task.id)}
        style={styles.deleteBtn}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Add Task Modal ────────────────────────────────────────────
function AddTaskModal({ visible, onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [repeats, setRepeats] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const [hasTime, setHasTime] = useState(false);
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");

  const reset = () => {
    setTitle("");
    setRepeats(false);
    setRepeatDays([]);
    setHasTime(false);
    setHour("08");
    setMinute("00");
  };

  const toggleDay = (day) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleAdd = () => {
    if (!title.trim())
      return Alert.alert("Error", "Escribe el nombre de la tarea");
    if (repeats && repeatDays.length === 0)
      return Alert.alert("Error", "Selecciona al menos un día");

    const timeStr = hasTime
      ? `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
      : null;

    onAdd({
      title: title.trim(),
      repeats,
      repeatDays: repeats ? repeatDays : [],
      hasTime,
      time: timeStr,
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

          <View style={styles.sheetHeader}>
            <Text style={TYPOGRAPHY.h2}>Nueva Tarea</Text>
            <Ionicons name="checkbox" size={24} color={COLORS.tasks} />
          </View>

          <Text style={styles.inputLabel}>¿Qué necesitas hacer?</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Estudiar, Comprar despensa..."
            placeholderTextColor={COLORS.textMuted}
            autoFocus
          />

          {/* Repeat toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>¿Es una tarea recurrente?</Text>
            <Switch
              value={repeats}
              onValueChange={setRepeats}
              trackColor={{ false: COLORS.borderLight, true: COLORS.tasksDim }}
              thumbColor={repeats ? COLORS.tasks : COLORS.textMuted}
            />
          </View>

          {repeats && (
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={styles.inputLabel}>Selecciona los días</Text>
              <View style={styles.daysRow}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayBtn,
                      repeatDays.includes(day) && styles.dayBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayBtnText,
                        repeatDays.includes(day) && styles.dayBtnTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Time toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>¿Recordatorio con hora?</Text>
            <Switch
              value={hasTime}
              onValueChange={setHasTime}
              trackColor={{ false: COLORS.borderLight, true: COLORS.tasksDim }}
              thumbColor={hasTime ? COLORS.tasks : COLORS.textMuted}
            />
          </View>

          {hasTime && (
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={styles.inputLabel}>Hora de notificación (24h)</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={hour}
                  onChangeText={setHour}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="08"
                  placeholderTextColor={COLORS.textMuted}
                  selectTextOnFocus
                />
                <Text style={styles.timeSep}>:</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={minute}
                  onChangeText={setMinute}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={COLORS.textMuted}
                  selectTextOnFocus
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, SHADOWS.tasks]}
            onPress={handleAdd}
          >
            <Text style={styles.primaryBtnText}>Guardar Tarea</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("pending");

  const persist = (newTasks) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  useFocusEffect(
    useCallback(() => {
      getTasks().then((loadedTasks) => {
        if (!loadedTasks) return;

        const today = getLocalToday();
        let hasChanges = false;

        // Revisamos si alguna tarea recurrente completada debe reiniciarse hoy
        const refreshedTasks = loadedTasks.map((t) => {
          if (t.repeats && t.completed && t.lastCompletedDate !== today) {
            hasChanges = true;
            return { ...t, completed: false, lastCompletedDate: null };
          }
          return t;
        });

        // Si hubo reinicios, guardamos el nuevo estado en storage
        if (hasChanges) {
          persist(refreshedTasks);
        } else {
          setTasks(refreshedTasks);
        }
      });
    }, []),
  );

  const addTask = async (taskData) => {
    const newTask = {
      id: uuid.v4(),
      ...taskData,
      completed: false,
      lastCompletedDate: null,
      createdAt: Date.now(),
      notifIds: [],
    };
    const notifIds = await scheduleTaskNotification(newTask).catch(() => []);
    newTask.notifIds = notifIds;
    persist([...tasks, newTask]);
  };

  const toggleTask = (taskId) => {
    const today = getLocalToday();

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const isNowCompleted = !t.completed;
        return {
          ...t,
          completed: isNowCompleted,
          lastCompletedDate: isNowCompleted ? today : null,
        };
      }
      return t;
    });
    persist(updated);
  };

  const deleteTask = (taskId) => {
    Alert.alert("Eliminar tarea", "¿Estás seguro de que deseas borrarla?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const task = tasks.find((t) => t.id === taskId);
          if (task?.notifIds) {
            for (const nid of task.notifIds) await cancelNotification(nid);
          }
          persist(tasks.filter((t) => t.id !== taskId));
        },
      },
    ]);
  };

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Consistente */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>ORGANIZACIÓN</Text>
            <Text style={TYPOGRAPHY.h1}>
              Mis Tareas <Text style={{ color: COLORS.tasks }}>✓</Text>
            </Text>
            <Text style={styles.headerSub}>
              {pendingCount > 0
                ? `${pendingCount} tarea${pendingCount !== 1 ? "s" : ""} pendiente${pendingCount !== 1 ? "s" : ""}`
                : "Todo al día 🎉"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.mainAddBtn, SHADOWS.tasks]}
            onPress={() => setShowAdd(true)}
            accessibilityRole="button"
            accessibilityLabel="Agregar nueva tarea"
          >
            <Ionicons name="add" size={24} color={COLORS.bg} />
          </TouchableOpacity>
        </View>

        {/* Sticky Filters */}
        <View style={styles.stickyNav}>
          <View style={styles.filterRow}>
            {[
              { id: "pending", label: "Pendientes", icon: "time-outline" },
              { id: "all", label: "Todas", icon: "list" },
              { id: "done", label: "Completadas", icon: "checkmark-done" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilter(tab.id)}
                style={[
                  styles.filterBtn,
                  filter === tab.id && styles.filterBtnActive,
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={
                    filter === tab.id ? COLORS.tasksText : COLORS.textMuted
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterBtnText,
                    filter === tab.id && styles.filterBtnTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Task List */}
        <View style={styles.content}>
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name={
                  filter === "done"
                    ? "shield-checkmark-outline"
                    : "document-text-outline"
                }
                size={48}
                color={COLORS.borderLight}
              />
              <Text style={styles.emptyCardText}>
                {filter === "done"
                  ? "No hay tareas completadas"
                  : "No tienes tareas pendientes"}
              </Text>
              {filter !== "done" && (
                <Text style={styles.emptyCardSub}>
                  Toca el botón + para comenzar a organizarte
                </Text>
              )}
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddTaskModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    marginTop: 10,
  },
  kicker: { ...TYPOGRAPHY.caption, color: COLORS.tasks, marginBottom: -4 },
  headerSub: { ...TYPOGRAPHY.body, marginTop: 4 },

  mainAddBtn: {
    backgroundColor: COLORS.tasks,
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  stickyNav: {
    backgroundColor: COLORS.bg,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  filterBtnActive: {
    backgroundColor: COLORS.tasksBg,
    borderColor: COLORS.tasks + "50",
  },
  filterBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  filterBtnTextActive: { color: COLORS.tasksText },

  content: { padding: SPACING.lg, paddingTop: SPACING.md },

  taskCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  taskCardDone: { opacity: 0.6, borderColor: "transparent" },

  taskCheckArea: { marginRight: SPACING.md },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgElevated,
  },
  checkboxDone: { backgroundColor: COLORS.tasks, borderColor: COLORS.tasks },

  taskContent: { flex: 1 },
  taskTitle: { ...TYPOGRAPHY.h2, fontSize: 16, marginBottom: 4 },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },

  taskMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  metaPillText: { fontSize: 11, color: COLORS.textDim, fontWeight: "500" },

  deleteBtn: { padding: 4, marginLeft: SPACING.sm },

  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    opacity: 0.8,
  },
  emptyCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDim,
    marginTop: SPACING.md,
  },
  emptyCardSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
  },

  // Modal Styles
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },

  inputLabel: { ...TYPOGRAPHY.caption, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: SPACING.md,
  },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 15, color: COLORS.textDim, fontWeight: "500" },

  daysRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayBtnActive: { backgroundColor: COLORS.tasksBg, borderColor: COLORS.tasks },
  dayBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.textMuted },
  dayBtnTextActive: { color: COLORS.tasksText },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  timeInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 0,
    paddingVertical: 12,
  },
  timeSep: { fontSize: 28, fontWeight: "800", color: COLORS.textMuted },

  primaryBtn: {
    backgroundColor: COLORS.tasks,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: COLORS.bg },
});
