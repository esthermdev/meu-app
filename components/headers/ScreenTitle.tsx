import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router, Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    backgroundColor: '#fff'
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 26,
    fontFamily: 'OutfitBold',
    color: '#EA1D25'
  },
});

export default ScreenTitle;