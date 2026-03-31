import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Alert, Pressable, Switch
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import uuid from 'react-native-uuid';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import { getTasks, saveTasks } from '../utils/storage';
import { scheduleTaskNotification, cancelNotification } from '../utils/notifications';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };

function TaskCard({ task, onToggle, onDelete }) {
  const repeatLabel = task.repeats
    ? task.repeatDays.map(d => DAY_NAMES[d]).join(', ')
    : 'Una vez';

  return (
    <View style={[styles.taskCard, task.completed && styles.taskCardDone]}>
      <TouchableOpacity onPress={() => onToggle(task.id)} style={styles.taskCheckArea}>
        <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
        <View style={styles.taskMeta}>
          {task.hasTime && task.time && (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>🕐 {task.time}</Text>
            </View>
          )}
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>
              {task.repeats ? `🔄 ${repeatLabel}` : '📅 Una vez'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function AddTaskModal({ visible, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [repeats, setRepeats] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const [hasTime, setHasTime] = useState(false);
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');

  const reset = () => {
    setTitle(''); setRepeats(false); setRepeatDays([]);
    setHasTime(false); setHour('08'); setMinute('00');
  };

  const toggleDay = (day) => {
    setRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAdd = () => {
    if (!title.trim()) return Alert.alert('Escribe el nombre de la tarea');
    if (repeats && repeatDays.length === 0) return Alert.alert('Selecciona al menos un día');

    const timeStr = hasTime ? `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` : null;

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Nueva Tarea ✅</Text>

          <Text style={styles.inputLabel}>Nombre</Text>
          <TextInput
            style={styles.input} value={title} onChangeText={setTitle}
            placeholder="ej. Estudiar, Llamar a mamá..." placeholderTextColor={COLORS.textMuted}
          />

          {/* Repeat toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>¿Se repite?</Text>
            <Switch
              value={repeats} onValueChange={setRepeats}
              trackColor={{ false: COLORS.bgElevated, true: COLORS.tasks }}
              thumbColor={COLORS.white}
            />
          </View>

          {repeats && (
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={styles.inputLabel}>Días de repetición</Text>
              <View style={styles.daysRow}>
                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[styles.dayBtn, repeatDays.includes(day) && styles.dayBtnActive]}
                  >
                    <Text style={[styles.dayBtnText, repeatDays.includes(day) && styles.dayBtnTextActive]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Time toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>¿Tiene hora?</Text>
            <Switch
              value={hasTime} onValueChange={setHasTime}
              trackColor={{ false: COLORS.bgElevated, true: COLORS.tasks }}
              thumbColor={COLORS.white}
            />
          </View>

          {hasTime && (
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={styles.inputLabel}>Hora de notificación</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={hour} onChangeText={setHour}
                  keyboardType="number-pad" maxLength={2}
                  placeholder="08" placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.timeSep}>:</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={minute} onChangeText={setMinute}
                  keyboardType="number-pad" maxLength={2}
                  placeholder="00" placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.tasks }]} onPress={handleAdd}>
            <Text style={styles.primaryBtnText}>Agregar tarea</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'done'

  useFocusEffect(useCallback(() => {
    getTasks().then(setTasks);
  }, []));

  const persist = (newTasks) => { setTasks(newTasks); saveTasks(newTasks); };

  const addTask = async (taskData) => {
    const newTask = {
      id: uuid.v4(),
      ...taskData,
      completed: false,
      createdAt: Date.now(),
      notifIds: [],
    };
    const notifIds = await scheduleTaskNotification(newTask).catch(() => []);
    newTask.notifIds = notifIds;
    persist([...tasks, newTask]);
  };

  const toggleTask = (taskId) => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    persist(updated);
  };

  const deleteTask = (taskId) => {
    Alert.alert('Eliminar tarea', '¿Seguro?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const task = tasks.find(t => t.id === taskId);
        if (task?.notifIds) {
          for (const nid of task.notifIds) await cancelNotification(nid);
        }
        persist(tasks.filter(t => t.id !== taskId));
      }},
    ]);
  };

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const pending = tasks.filter(t => !t.completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>MÓDULO</Text>
          <Text style={styles.headerTitle}>Tareas ✅</Text>
          <Text style={styles.headerSub}>
            {pending > 0 ? `${pending} tarea${pending !== 1 ? 's' : ''} pendiente${pending !== 1 ? 's' : ''}` : 'Todo al día 🎉'}
          </Text>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {[['all', 'Todas'], ['pending', 'Pendientes'], ['done', 'Completadas']].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
            >
              <Text style={[styles.filterBtnText, filter === key && styles.filterBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{filtered.length} tarea{filtered.length !== 1 ? 's' : ''}</Text>
            <TouchableOpacity
              style={[styles.addCircle, { backgroundColor: COLORS.tasksBg, borderColor: COLORS.tasks }]}
              onPress={() => setShowAdd(true)}
            >
              <Text style={[styles.addCircleText, { color: COLORS.tasks }]}>+</Text>
            </TouchableOpacity>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardEmoji}>✅</Text>
              <Text style={styles.emptyCardText}>
                {filter === 'done' ? '¡Sin completadas aún!' : 'Sin tareas aquí'}
              </Text>
              <Text style={styles.emptyCardSub}>
                {filter === 'all' ? 'Toca + para agregar tu primera tarea' : ''}
              </Text>
            </View>
          ) : (
            filtered.map(task => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
            ))
          )}
        </View>
      </ScrollView>

      <AddTaskModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addTask} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },

  header: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
  headerLabel: { fontSize: 11, fontWeight: '700', color: COLORS.tasks, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 36, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  filterRow: { flexDirection: 'row', marginHorizontal: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm },
  filterBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  filterBtnActive: { backgroundColor: COLORS.tasksBg, borderColor: COLORS.tasks },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  filterBtnTextActive: { color: COLORS.tasks },

  section: { marginHorizontal: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  addCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  addCircleText: { fontSize: 20, lineHeight: 28 },

  taskCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  taskCardDone: { opacity: 0.5 },
  taskCheckArea: { marginRight: SPACING.sm, paddingTop: 2 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: COLORS.tasks, borderColor: COLORS.tasks },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },

  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  taskTitleDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },

  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaPill: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  metaPillText: { fontSize: 11, color: COLORS.textDim },

  deleteBtn: { padding: 4 },
  deleteBtnText: { color: COLORS.textMuted, fontSize: 14 },

  emptyCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.xl, alignItems: 'center',
  },
  emptyCardEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  emptyCardText: { fontSize: 15, fontWeight: '600', color: COLORS.textDim },
  emptyCardSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.lg, paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, color: COLORS.text, fontSize: 15, marginBottom: SPACING.md,
  },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  toggleLabel: { fontSize: 15, color: COLORS.text, fontWeight: '500' },

  daysRow: { flexDirection: 'row', gap: 8 },
  dayBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.border,
  },
  dayBtnActive: { backgroundColor: COLORS.tasksBg, borderColor: COLORS.tasks },
  dayBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  dayBtnTextActive: { color: COLORS.tasks },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, textAlign: 'center', marginBottom: 0 },
  timeSep: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },

  primaryBtn: { borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
