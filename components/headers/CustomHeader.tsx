// components/CustomHeader.js
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import CustomText from '../CustomText';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fonts } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';

interface CustomHeaderProps {
  title: string | string[];
  refreshInfo?: boolean;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({ title, refreshInfo }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={23} color="#EA1D25" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <CustomText style={styles.header} maxFontSizeMultiplier={1}>
            {title}
          </CustomText>
        </View>
        {refreshInfo && (
          <TouchableOpacity style={styles.infoButton} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="info-outline" size={20} color="#ea1d25" />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <CustomText style={styles.modalTitle}>Refresh Feature</CustomText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="refresh" size={24} color="#EA1D25" style={styles.infoIcon} />
                  <CustomText style={styles.infoText}>
                    Pull down on the screen to refresh and get the latest scores
                  </CustomText>
                </View>

                <View style={styles.infoItem}>
                  <MaterialIcons
                    name="info-outline"
                    size={24}
                    color="#EA1D25"
                    style={styles.infoIcon}
                  />
                  <CustomText style={styles.infoText}>
                    Scores are updated in real-time during tournaments
                  </CustomText>
                </View>

                <View style={styles.infoItem}>
                  <MaterialIcons name="sync" size={24} color="#EA1D25" style={styles.infoIcon} />
                  <CustomText style={styles.infoText}>
                    The app will automatically check for updates periodically
                  </CustomText>
                </View>
              </View>

              <TouchableOpacity style={styles.gotItButton} onPress={() => setModalVisible(false)}>
                <CustomText style={styles.gotItButtonText}>Got it</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    color: '#000',
    fontFamily: fonts.semiBold,
    fontSize: 18,
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'relative',
  },
  backButton: {
    left: 20,
    position: 'absolute',
    zIndex: 10,
  },
  infoButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '85%',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalTitle: {
    color: '#000',
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  modalBody: {
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    color: '#333',
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  gotItButton: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 8,
    paddingVertical: 12,
  },
  gotItButtonText: {
    color: 'white',
    fontFamily: fonts.medium,
    fontSize: 16,
  },
});

export default CustomHeader;
