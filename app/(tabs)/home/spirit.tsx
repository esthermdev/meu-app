import { View, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native'
import CustomText from '@/components/CustomText'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function SpiritPage() {
  const openSpiritScoreForm = () => {
    Linking.openURL('https://forms.gle/heqcEkMLGPUeYT7L7')
  }

  const openPDF = () => {
    Linking.openURL('https://opleqymigooimduhlvym.supabase.co/storage/v1/object/public/documents/SpiritPoints_Game.pdf')
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Main message card */}
        <View style={styles.card}>
          <CustomText variant="text" style={styles.message}>
            This year, we have{' '}
            <CustomText variant="textBold" style={styles.name}>
              Lucas Brown
            </CustomText>
            {' '}as our Spirit Coordinator! He'll be showing teams fun sideline and timeout games, running some Spirit points, and answering any questions teams have about Spirit of the Game!
          </CustomText>
        </View>

        {/* Spirit Score Form Button */}
        <TouchableOpacity style={styles.formButton} onPress={openSpiritScoreForm}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#fff" />
          <View style={styles.buttonTextContainer}>
            <CustomText variant="textMedium" style={styles.buttonText}>
              Submit Spirit Scores
            </CustomText>
            <CustomText variant="textXSmall" style={styles.buttonSubtext}>
              Share your team's spirit scores
            </CustomText>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={20} color="#fff" />
        </TouchableOpacity>

        {/* PDF Document Button */}
        <TouchableOpacity style={styles.pdfButton} onPress={openPDF}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#E0AE43" />
          <View style={styles.buttonTextContainer}>
            <CustomText variant="textMedium" style={styles.pdfButtonText}>
              Spirit Points & Games
            </CustomText>
            <CustomText variant="textXSmall" style={styles.pdfButtonSubtext}>
              View the full document
            </CustomText>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E0AE43',
  },
  message: {
    lineHeight: 24,
    color: '#333',
  },
  name: {
    color: '#E0AE43',
  },
  formButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0AE43',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    gap: 12,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    marginBottom: 2,
  },
  buttonSubtext: {
    color: '#fff',
    opacity: 0.9,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E0AE43',
    gap: 12,
  },
  pdfButtonText: {
    color: '#333',
    marginBottom: 2,
  },
  pdfButtonSubtext: {
    color: '#666',
  },
})
