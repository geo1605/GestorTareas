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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import {
  cancelNotification,
  schedulePlantNotification,
} from "../utils/notifications";
import { getPlants, savePlants } from "../utils/storage";
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from "../utils/theme";

const PLANT_EMOJIS = [
  "🌱",
  "🌿",
  "🪴",
  "🌵",
  "🌺",
  "🌸",
  "🌻",
  "🪷",
  "🌴",
  "🍀",
];

// ─── Plant Card Component ──────────────────────────────────────
function PlantCard({ plant, onWater, onDelete }) {
  const daysSince = Math.floor(
    (Date.now() - plant.lastWatered) / (1000 * 60 * 60 * 24),
  );
  const needsWater = daysSince >= plant.frequencyDays;
  const daysLeft = plant.frequencyDays - daysSince;

  // Calculamos el progreso (máximo 100%)
  const progress = Math.min(
    100,
    Math.max(0, (daysSince / plant.frequencyDays) * 100),
  );

  return (
    <View
      style={[
        styles.plantCard,
        needsWater ? styles.plantCardNeedsWater : SHADOWS.soft,
      ]}
    >
      <View style={styles.plantCardTop}>
        <View style={styles.emojiContainer}>
          <Text style={styles.plantEmoji}>{plant.emoji}</Text>
        </View>
        <View style={styles.plantInfo}>
          <Text style={TYPOGRAPHY.h2}>{plant.name}</Text>
          <Text style={styles.plantFreq}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={COLORS.textMuted}
            />{" "}
            Riego cada {plant.frequencyDays} día
            {plant.frequencyDays !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(plant.id)}
          style={styles.deleteBtn}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.plantCardBottom}>
        <View style={styles.statusContainer}>
          {needsWater ? (
            <View style={styles.waterAlert}>
              <Ionicons name="water" size={14} color={COLORS.plants} />
              <Text style={styles.waterAlertText}>¡Sedienta!</Text>
            </View>
          ) : (
            <View style={styles.waterStatus}>
              <Ionicons name="water-outline" size={14} color={COLORS.textDim} />
              <Text style={styles.waterStatusText}>
                En {daysLeft} día{daysLeft !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onWater(plant.id)}
          style={[styles.waterBtn, needsWater && styles.waterBtnActive]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={needsWater ? "water" : "water-outline"}
            size={16}
            color={needsWater ? COLORS.bg : COLORS.text}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.waterBtnText, needsWater && { color: COLORS.bg }]}
          >
            Regar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar visualmente mejorada */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%` },
            needsWater && styles.progressFillDanger,
            needsWater && SHADOWS.plants,
          ]}
        />
      </View>
    </View>
  );
}

// ─── Add Plant Modal ───────────────────────────────────────────
function AddPlantModal({ visible, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("3");
  const [selectedEmoji, setSelectedEmoji] = useState("🌱");

  const reset = () => {
    setName("");
    setFrequency("3");
    setSelectedEmoji("🌱");
  };

  const handleAdd = () => {
    if (!name.trim())
      return Alert.alert("Error", "Escribe el nombre de la planta");
    const freq = parseInt(frequency);
    if (isNaN(freq) || freq < 1)
      return Alert.alert("Error", "Frecuencia inválida");

    onAdd({ name: name.trim(), frequencyDays: freq, emoji: selectedEmoji });
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
            <Text style={TYPOGRAPHY.h2}>Nueva Planta</Text>
            <Ionicons name="leaf" size={24} color={COLORS.plants} />
          </View>

          <Text style={styles.inputLabel}>¿Cómo se llama tu planta?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Monstera, Pothos, Suculenta..."
            placeholderTextColor={COLORS.textMuted}
            autoFocus
          />

          <Text style={styles.inputLabel}>Elige un avatar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.emojiScroll}
            contentContainerStyle={{ gap: 10 }}
          >
            {PLANT_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => setSelectedEmoji(emoji)}
                style={[
                  styles.emojiBtn,
                  selectedEmoji === emoji && styles.emojiBtnActive,
                  selectedEmoji === emoji && SHADOWS.plants,
                ]}
              >
                <Text style={styles.emojiBtnText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>¿Cada cuántos días se riega?</Text>
          <View style={styles.frequencyInputContainer}>
            <TextInput
              style={[styles.input, styles.freqInput]}
              value={frequency}
              onChangeText={setFrequency}
              keyboardType="number-pad"
              placeholder="3"
              placeholderTextColor={COLORS.textMuted}
              selectTextOnFocus
            />
            <Text style={styles.freqLabel}>días</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, SHADOWS.plants]}
            onPress={handleAdd}
          >
            <Text style={styles.primaryBtnText}>Guardar Planta</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function PlantsScreen() {
  const [plants, setPlants] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getPlants().then(setPlants);
    }, []),
  );

  const persist = (newPlants) => {
    setPlants(newPlants);
    savePlants(newPlants);
  };

  const addPlant = async ({ name, frequencyDays, emoji }) => {
    const newPlant = {
      id: uuid.v4(),
      name,
      frequencyDays,
      emoji,
      lastWatered: Date.now(),
      notifId: null,
    };
    const notifId = await schedulePlantNotification(newPlant).catch(() => null);
    newPlant.notifId = notifId;
    persist([...plants, newPlant]);
  };

  const waterPlant = async (plantId) => {
    const updated = plants.map((p) => {
      if (p.id !== plantId) return p;
      return { ...p, lastWatered: Date.now() };
    });

    // Reprogramar notificación
    const plant = updated.find((p) => p.id === plantId);
    if (plant.notifId) await cancelNotification(plant.notifId); // Cancelar anterior
    const notifId = await schedulePlantNotification(plant).catch(() => null);

    const final = updated.map((p) =>
      p.id === plantId ? { ...p, notifId } : p,
    );
    persist(final);
  };

  // VERSIÓN CORREGIDA Y SEGURA DE DELETE
  const deletePlant = (plantId) => {
    Alert.alert(
      "Eliminar planta",
      "¿Seguro que deseas quitar esta planta de tu jardín?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const plant = plants.find((p) => p.id === plantId);
              // Cancelamos la notificación asegurando que si falla no detenga el código
              if (plant?.notifId) {
                await cancelNotification(plant.notifId).catch(() => {});
              }

              // Actualizamos el estado con la versión más reciente y guardamos
              setPlants((prevPlants) => {
                const actualizadas = prevPlants.filter((p) => p.id !== plantId);
                savePlants(actualizadas);
                return actualizadas;
              });
            } catch (error) {
              console.error("Error al eliminar planta:", error);
            }
          },
        },
      ],
    );
  };

  const plantsNeedingWater = plants.filter(
    (p) =>
      Math.floor((Date.now() - p.lastWatered) / (1000 * 60 * 60 * 24)) >=
      p.frequencyDays,
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Consistente */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>JARDÍN VIRTUAL</Text>
            <Text style={TYPOGRAPHY.h1}>
              Mis Plantas <Text style={{ color: COLORS.plants }}>🌿</Text>
            </Text>
            <Text style={styles.headerSub}>
              Tienes {plants.length} planta{plants.length !== 1 ? "s" : ""} en
              tu cuidado
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.mainAddBtn, SHADOWS.plants]}
            onPress={() => setShowAdd(true)}
          >
            <Ionicons name="add" size={24} color={COLORS.bg} />
          </TouchableOpacity>
        </View>

        {/* Alert Banner Dinámico */}
        {plantsNeedingWater.length > 0 && (
          <View style={[styles.alertBanner, SHADOWS.plants]}>
            <Ionicons
              name="warning"
              size={20}
              color={COLORS.bg}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.alertBannerText}>
              {plantsNeedingWater.length} planta
              {plantsNeedingWater.length !== 1
                ? "s necesitan"
                : " necesita"}{" "}
              riego urgente
            </Text>
          </View>
        )}

        {/* Content Section */}
        <View style={styles.content}>
          {plants.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardEmoji}>🪴</Text>
              <Text style={styles.emptyCardText}>Tu jardín está vacío</Text>
              <Text style={styles.emptyCardSub}>
                Toca el botón + para agregar tu primera planta
              </Text>
            </View>
          ) : (
            plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onWater={waterPlant}
                onDelete={deletePlant}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddPlantModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addPlant}
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
  kicker: { ...TYPOGRAPHY.caption, color: COLORS.plants, marginBottom: -4 },
  headerSub: { ...TYPOGRAPHY.body, marginTop: 4 },

  mainAddBtn: {
    backgroundColor: COLORS.plants,
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.plants,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  alertBannerText: { color: COLORS.bg, fontWeight: "700", fontSize: 14 },

  content: { padding: SPACING.lg, paddingTop: SPACING.sm },

  plantCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    overflow: "hidden",
  },
  plantCardNeedsWater: {
    borderColor: COLORS.plants,
    backgroundColor: COLORS.plantsBg,
  },

  plantCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  plantEmoji: { fontSize: 28 },
  plantInfo: { flex: 1 },
  plantFreq: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  deleteBtn: { padding: 6, opacity: 0.7 },

  plantCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  statusContainer: { flexDirection: "row", alignItems: "center" },

  waterAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.plants + "20",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.plants + "50",
  },
  waterAlertText: { color: COLORS.plants, fontWeight: "700", fontSize: 12 },

  waterStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  waterStatusText: { color: COLORS.textDim, fontSize: 12, fontWeight: "500" },

  waterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  waterBtnActive: {
    backgroundColor: COLORS.plants,
    borderColor: COLORS.plants,
  },
  waterBtnText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },

  progressBg: {
    height: 6,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.textMuted,
    borderRadius: 3,
  },
  progressFillDanger: { backgroundColor: COLORS.plants },

  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    opacity: 0.8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  emptyCardEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyCardText: { fontSize: 16, fontWeight: "600", color: COLORS.textDim },
  emptyCardSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
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
    marginBottom: SPACING.lg,
  },

  emojiScroll: { marginBottom: SPACING.lg, paddingBottom: 4 },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiBtnActive: {
    borderColor: COLORS.plants,
    backgroundColor: COLORS.plants + "15",
  },
  emojiBtnText: { fontSize: 26 },

  frequencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: SPACING.sm,
  },
  freqInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 0,
  },
  freqLabel: {
    fontSize: 16,
    color: COLORS.textDim,
    fontWeight: "600",
    width: 50,
  },

  primaryBtn: {
    backgroundColor: COLORS.plants,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: COLORS.bg },
});
