import { Ionicons } from "@expo/vector-icons"; // Importamos los iconos
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { requestPermissions } from "../utils/notifications";
import { COLORS, RADIUS } from "../utils/theme";

function TabIcon({ iconName, label, focused, color }) {
  return (
    <View
      style={[
        styles.tabItem,
        focused && { backgroundColor: color + "15" }, // Un fondo muy sutil del color del icono
      ]}
    >
      <Ionicons
        name={focused ? iconName : `${iconName}-outline`}
        size={22}
        color={color}
      />
      <Text
        style={[styles.tabLabel, { color: focused ? color : COLORS.textMuted }]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    requestPermissions();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
          tabBarActiveTintColor: COLORS.text,
          tabBarInactiveTintColor: COLORS.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconName="fitness"
                label="Gym"
                focused={focused}
                color={focused ? COLORS.gym : COLORS.textMuted}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="plants"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconName="leaf"
                label="Plantas"
                focused={focused}
                color={focused ? COLORS.plants : COLORS.textMuted}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconName="checkbox"
                label="Tareas"
                focused={focused}
                color={focused ? COLORS.tasks : COLORS.textMuted}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bgCard,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 88 : 70, // Ajuste para el notch de iPhone
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingTop: 12,
    position: "absolute", // Hace que se vea más moderno sobre el contenido
    elevation: 0,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    minWidth: 80,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
