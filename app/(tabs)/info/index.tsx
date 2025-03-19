import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { typography } from "@/constants/Typography";

// Define menu items with their exact paths
const menuItems = [
  { title: "Tournament Info", route: "/(tabs)/info/tournament-info" as const },
  { title: "Rules & SOTG", route: "/(tabs)/info/rules" as const },
  { title: "In Case of Emergency", route: "/(tabs)/info/emergency" as const },
  { title: "Refund Policy", route: "/(tabs)/info/refund-policy" as const },
  { title: "Restaurants & Hotels", route: "/(tabs)/info/restaurants-hotels" as const },
  { title: "Vendors", route: "/(tabs)/info/vendors" as const },
  { title: "FAQ", route: "/(tabs)/info/faq" as const },
  { title: "Credits", route: "/(tabs)/info/credits" as const },
];

export default function InfoScreen() {
  return (
    <ScrollView style={styles.container}>
      {menuItems.map((item, index) => (
        <Link key={index} href={item.route} asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 25,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuText: {
    ...typography.h5
  },
});