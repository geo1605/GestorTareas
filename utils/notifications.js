import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions() {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return true;
}

// Schedule a repeating notification for a plant
export async function schedulePlantNotification(plant) {
  await cancelNotification(plant.notifId);

  const trigger = {
    seconds: plant.frequencyDays * 24 * 60 * 60,
    repeats: true,
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌱 Hora de regar",
      body: `Tu planta "${plant.name}" necesita agua`,
      data: { type: "plant", id: plant.id },
    },
    trigger,
  });

  return id;
}

// Schedule task notifications
export async function scheduleTaskNotification(task) {
  // Cancel previous notifications for this task
  if (task.notifIds && task.notifIds.length > 0) {
    for (const nid of task.notifIds) {
      await cancelNotification(nid);
    }
  }

  if (!task.hasTime || !task.time) return [];

  const [hour, minute] = task.time.split(":").map(Number);
  const ids = [];

  if (!task.repeats) {
    // One-time notification today or next occurrence
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "✅ Tarea pendiente",
        body: task.title,
        data: { type: "task", id: task.id },
      },
      trigger: { hour, minute, repeats: false },
    });
    ids.push(id);
  } else {
    // Repeating on specific days
    const dayMap = {
      L: 2,
      M: 3,
      X: 4,
      J: 5,
      V: 6,
      S: 7,
      D: 1,
    };

    for (const day of task.repeatDays) {
      const weekday = dayMap[day];
      if (!weekday) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Tarea pendiente",
          body: task.title,
          data: { type: "task", id: task.id },
        },
        trigger: { weekday, hour, minute, repeats: true },
      });
      ids.push(id);
    }
  }

  return ids;
}

export async function cancelNotification(id) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (_) {}
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
