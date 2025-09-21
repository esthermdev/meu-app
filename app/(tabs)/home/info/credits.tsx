import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

const CreditsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.title}>Credits</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.content}>
          This app was developed by{' '}
          <Link href="https://www.linkedin.com/in/esther-devadas-6ab90a20b/" style={styles.linkStyle}>
            Esther Devadas
          </Link>.
        </CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.content}>Design credits go to her sister, Deborah Devadas.</CustomText>
        
        <View style={styles.section}>
          <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.sectionTitle}>Technology Stack</CustomText>
          <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.content}>
            • React Native & Expo{'\n'}
            • TypeScript{'\n'}
            • Supabase{'\n'}
            • Expo Router
          </CustomText>
        </View>
        
        <View style={styles.section}>
          <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.sectionTitle}>Special Thanks</CustomText>
          <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.content}>
            To all the volunteers, staff, and participants who make Maine Ultimate
            events possible.
          </CustomText>
        </View>
        
        <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.version}>Version 2.0.5</CustomText>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    ...typography.heading3,
    color: '#333',
    marginBottom: 16,
  },
  content: {
    ...typography.text,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.textBold,
    color: '#333',
    marginBottom: 8,
  },
  linkStyle: {
    textDecorationLine: 'underline',
    color: '#2871FF',
    ...typography.textMedium
  },
  version: {
    ...typography.text,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default CreditsScreen;