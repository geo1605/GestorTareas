import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Alert, Pressable
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import uuid from 'react-native-uuid';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import { getPlants, savePlants } from '../utils/storage';
import { schedulePlantNotification, cancelNotification } from '../utils/notifications';

const PLANT_EMOJIS = ['🌱', '🌿', '🪴', '🌵', '🌺', '🌸', '🌻', '🪷', '🌴', '🍀'];

function PlantCard({ plant, onWater, onDelete }) {
  const daysSince = Math.floor((Date.now() - plant.lastWatered) / (1000 * 60 * 60 * 24));
  const needsWater = daysSince >= plant.frequencyDays;
  const daysLeft = plant.frequencyDays - daysSince;

  return (
    <View style={[styles.plantCard, needsWater && styles.plantCardNeedsWater]}>
      <View style={styles.plantCardTop}>
        <Text style={styles.plantEmoji}>{plant.emoji}</Text>
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{plant.name}</Text>
          <Text style={styles.plantFreq}>Cada {plant.frequencyDays} día{plant.frequencyDays !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(plant.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.plantCardBottom}>
        {needsWater ? (
          <View style={styles.waterAlert}>
            <Text style={styles.waterAlertText}>💧 ¡Necesita agua!</Text>
          </View>
        ) : (
          <View style={styles.waterStatus}>
            <Text style={styles.waterStatusText}>
              💧 En {daysLeft} día{daysLeft !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => onWater(plant.id)}
          style={[styles.waterBtn, needsWater && styles.waterBtnActive]}
        >
          <Text style={styles.waterBtnText}>Regar 💦</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[
          styles.progressFill,
          { width: `${Math.min(100, (daysSince / plant.frequencyDays) * 100)}%` },
          needsWater && styles.progressFillDanger,
        ]} />
      </View>
    </View>
  );
}

function AddPlantModal({ visible, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('3');
  const [selectedEmoji, setSelectedEmoji] = useState('🌱');

  const reset = () => { setName(''); setFrequency('3'); setSelectedEmoji('🌱'); };

  const handleAdd = () => {
    if (!name.trim()) return Alert.alert('Escribe el nombre de la planta');
    const freq = parseInt(frequency);
    if (isNaN(freq) || freq < 1) return Alert.alert('Frecuencia inválida');
    onAdd({ name: name.trim(), frequencyDays: freq, emoji: selectedEmoji });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Nueva Planta 🌱</Text>

          <Text style={styles.inputLabel}>Nombre</Text>
          <TextInput
            style={styles.input} value={name} onChangeText={setName}
            placeholder="ej. Pothos, Suculenta..." placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.inputLabel}>Ícono</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            {PLANT_EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                onPress={() => setSelectedEmoji(emoji)}
                style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnActive]}
              >
                <Text style={styles.emojiBtnText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Frecuencia de riego (días)</Text>
          <TextInput
            style={styles.input} value={frequency} onChangeText={setFrequency}
            keyboardType="number-pad" placeholder="3"
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.plants }]} onPress={handleAdd}>
            <Text style={[styles.primaryBtnText, { color: '#000' }]}>Agregar planta</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function PlantsScreen() {
  const [plants, setPlants] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  useFocusEffect(useCallback(() => {
    getPlants().then(setPlants);
  }, []));

  const persist = (newPlants) => { setPlants(newPlants); savePlants(newPlants); };

  const addPlant = async ({ name, frequencyDays, emoji }) => {
    const newPlant = {
      id: uuid.v4(),
      name, frequencyDays, emoji,
      lastWatered: Date.now(),
      notifId: null,
    };
    const notifId = await schedulePlantNotification(newPlant).catch(() => null);
    newPlant.notifId = notifId;
    persist([...plants, newPlant]);
  };

  const waterPlant = async (plantId) => {
    const updated = plants.map(p => {
      if (p.id !== plantId) return p;
      return { ...p, lastWatered: Date.now() };
    });
    // Reschedule notification
    const plant = updated.find(p => p.id === plantId);
    const notifId = await schedulePlantNotification(plant).catch(() => null);
    const final = updated.map(p => p.id === plantId ? { ...p, notifId } : p);
    persist(final);
  };

  const deletePlant = (plantId) => {
    Alert.alert('Eliminar planta', '¿Seguro?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const plant = plants.find(p => p.id === plantId);
        if (plant?.notifId) await cancelNotification(plant.notifId);
        persist(plants.filter(p => p.id !== plantId));
      }},
    ]);
  };

  const plantsNeedingWater = plants.filter(p =>
    Math.floor((Date.now() - p.lastWatered) / (1000 * 60 * 60 * 24)) >= p.frequencyDays
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>MÓDULO</Text>
          <Text style={styles.headerTitle}>Plantas 🌿</Text>
          <Text style={styles.headerSub}>Registro y recordatorios de riego</Text>
        </View>

        {plantsNeedingWater.length > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerText}>
              💧 {plantsNeedingWater.length} planta{plantsNeedingWater.length !== 1 ? 's necesitan' : ' necesita'} agua
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{plants.length} planta{plants.length !== 1 ? 's' : ''}</Text>
            <TouchableOpacity style={[styles.addCircle, { backgroundColor: COLORS.plantsBg, borderColor: COLORS.plants }]} onPress={() => setShowAdd(true)}>
              <Text style={[styles.addCircleText, { color: COLORS.plants }]}>+</Text>
            </TouchableOpacity>
          </View>

          {plants.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardEmoji}>🪴</Text>
              <Text style={styles.emptyCardText}>Sin plantas registradas</Text>
              <Text style={styles.emptyCardSub}>Toca + para agregar tu primera planta</Text>
            </View>
          ) : (
            plants.map(plant => (
              <PlantCard key={plant.id} plant={plant} onWater={waterPlant} onDelete={deletePlant} />
            ))
          )}
        </View>
      </ScrollView>

      <AddPlantModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addPlant} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },

  header: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
  headerLabel: { fontSize: 11, fontWeight: '700', color: COLORS.plants, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 36, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  alertBanner: {
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.plantsBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.plants,
    padding: SPACING.md,
  },
  alertBannerText: { color: COLORS.plants, fontWeight: '600', fontSize: 14 },

  section: { marginHorizontal: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  addCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  addCircleText: { fontSize: 20, lineHeight: 28 },

  plantCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.md, overflow: 'hidden',
  },
  plantCardNeedsWater: { borderColor: COLORS.plants },

  plantCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  plantEmoji: { fontSize: 36, marginRight: SPACING.sm },
  plantInfo: { flex: 1 },
  plantName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  plantFreq: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: COLORS.textMuted, fontSize: 14 },

  plantCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  waterAlert: {
    backgroundColor: COLORS.plantsBg, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.plants,
  },
  waterAlertText: { color: COLORS.plants, fontWeight: '600', fontSize: 12 },
  waterStatus: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  waterStatusText: { color: COLORS.textDim, fontSize: 12 },

  waterBtn: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  waterBtnActive: { backgroundColor: COLORS.plantsBg, borderColor: COLORS.plants },
  waterBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },

  progressBg: { height: 3, backgroundColor: COLORS.bgElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.plants, borderRadius: 2 },
  progressFillDanger: { backgroundColor: COLORS.plants },

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
  emojiBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginRight: 8, backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.border,
  },
  emojiBtnActive: { borderColor: COLORS.plants, backgroundColor: COLORS.plantsBg },
  emojiBtnText: { fontSize: 22 },
  primaryBtn: { borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
});
