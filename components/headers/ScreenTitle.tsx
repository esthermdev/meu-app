import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router, Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { typography } from "@/constants/Typography";

interface ScreenTitleProps {
  title: string;
  route?: Href<string | object>;
  showBackButton?: boolean;
}

export const ScreenTitle: React.FC<ScreenTitleProps> = ({ 
  title, 
  route,
  showBackButton = true 
}) => {
  return (
    <View style={styles.container}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => route ? router.push(route) : router.back()}
        >
          <Ionicons name="caret-back" size={24} color="#000" />
        </TouchableOpacity>
      )}
      <Text maxFontSizeMultiplier={1.1} style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    ...typography.h3,
    color: '#EA1D25'
  },
});

export default ScreenTitle;