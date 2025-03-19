import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { fonts, typography } from '@/constants/Typography';

const CreditsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Credits</Text>
        <Text style={styles.content}>
          This app was developed by{' '}
          <Link href="https://www.linkedin.com/in/esther-devadas-6ab90a20b/" style={styles.linkStyle}>
            Esther Devadas
          </Link>.
        </Text>
        <Text style={styles.content}>Design credits go to Deborah Devadas.</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technology Stack</Text>
          <Text style={styles.content}>
            • React Native & Expo{'\n'}
            • TypeScript{'\n'}
            • Supabase{'\n'}
            • Expo Router
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Thanks</Text>
          <Text style={styles.content}>
            To all the volunteers, staff, and participants who make Maine Ultimate
            events possible.
          </Text>
        </View>
        
        <Text style={styles.version}>Version 1.0.0</Text>
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
    ...typography.h3,
    color: '#333',
    marginBottom: 16,
  },
  content: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    color: '#333',
    marginBottom: 8,
  },
  linkStyle: {
    textDecorationLine: 'underline',
    color: '#2871FF',
    fontFamily: fonts.medium,
  },
  version: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default CreditsScreen;