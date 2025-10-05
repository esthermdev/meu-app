import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Link } from "expo-router";
import { typography } from "@/constants/Typography";
import CustomText from "@/components/CustomText";

// Define menu items with their exact paths
const menuItems = [
  { title: "Tournament Info", route: "/(tabs)/home/info/tournament-info" as const },
  { title: "Rules", route: "/(tabs)/home/info/rules" as const },
  // { title: "In Case of Emergency", route: "/(tabs)/home/info/emergency" as const },
  { title: "Wainwright Facility", route: "/(tabs)/home/info/wainwright" as const },
  // { title: "Refund Policy", route: "/(tabs)/home/info/refund-policy" as const },
  { title: "Restaurants & Hotels", route: "/(tabs)/home/info/restaurants-hotels" as const },
  { title: "Vendors", route: "/(tabs)/home/info/vendors" as const },
  { title: "Report / Feedback", route: "/(tabs)/home/info/feedback" as const, subtitle: "Lost items, facility issues, report a bug, or miscellaneous..." },
  { title: "FAQ", route: "/(tabs)/home/info/faq" as const },
  { title: "Credits", route: "/(tabs)/home/info/credits" as const },
];

export default function InfoScreen() {
  return (
    <ScrollView style={styles.container}>
      {menuItems.map((item, index) => (
        <Link key={index} href={item.route} asChild>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.menuText}>{item.title}</CustomText>
              {item.subtitle && (
                <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.subtitleText}>{item.subtitle}</CustomText>
              )}
            </View>
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
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 23,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    ...typography.heading5
  },
  subtitleText: {
    ...typography.textXSmall,
    color: "#666",
    marginTop: 4,
  },
});