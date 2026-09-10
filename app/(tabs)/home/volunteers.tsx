import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import CustomText from '@/components/CustomText';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import { VolunteerRow } from '@/types/database';

const placeholderAvatar = require('../../../assets/icons/placeholder_user.png');

const UNASSIGNED_ROLE = 'Other';
const DEFAULT_DESCRIPTION = 'No description available yet.';
// The detail sheet never grows past this share of the screen; longer bios scroll inside it.
const MODAL_MAX_HEIGHT_RATIO = 0.7;

// Sort by role Z-A so volunteers with the same role sit together; ties break on name A-Z.
// Roles are trimmed so "Livestream " and "Livestream" sort as the same role.
const sortByRole = (volunteers: VolunteerRow[]): VolunteerRow[] =>
  [...volunteers].sort((a, b) => {
    const roleA = a.role?.trim() || UNASSIGNED_ROLE;
    const roleB = b.role?.trim() || UNASSIGNED_ROLE;
    return roleB.localeCompare(roleA) || (a.badge ?? '').localeCompare(b.badge ?? '');
  });

const Volunteers = () => {
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerRow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { height: windowHeight } = useWindowDimensions();

  const sortedVolunteers = useMemo(() => sortByRole(volunteers), [volunteers]);

  const fetchVolunteers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, badge, role, avatar_uri, description')
        .order('badge');

      if (error) {
        console.error('Error fetching volunteers:', error);
      } else {
        setVolunteers(data);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  }, []);

  useEffect(() => {
    fetchVolunteers().finally(() => setIsLoading(false));
  }, [fetchVolunteers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVolunteers().finally(() => setRefreshing(false));
  };

  const handleVolunteerPress = (volunteer: VolunteerRow) => {
    setSelectedVolunteer(volunteer);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedVolunteer(null), 300);
  };

  const renderVolunteer = ({ item: volunteer }: { item: VolunteerRow }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleVolunteerPress(volunteer)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${volunteer.badge ?? 'Volunteer'}, ${volunteer.role?.trim() || UNASSIGNED_ROLE}`}
      accessibilityHint="Opens a short description">
      <Image style={styles.avatar} source={volunteer.avatar_uri ? { uri: volunteer.avatar_uri } : placeholderAvatar} />
      <CustomText style={styles.badgeText} allowFontScaling maxFontSizeMultiplier={1.1}>
        {volunteer.badge}
      </CustomText>
      <CustomText style={styles.roleText} allowFontScaling maxFontSizeMultiplier={1.1}>
        {volunteer.role?.trim() || UNASSIGNED_ROLE}
      </CustomText>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.container}>
        {isLoading ? (
          <LoadingIndicator message="Loading volunteers..." />
        ) : (
          <FlatList
            data={sortedVolunteers}
            renderItem={renderVolunteer}
            keyExtractor={(volunteer) => volunteer.id.toString()}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4357AD']} tintColor="#4357AD" />
            }
            ListEmptyComponent={
              <CustomText variant="textMedium" style={styles.emptyText}>
                No volunteers to show yet.
              </CustomText>
            }
          />
        )}
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          {/* The backdrop sits behind the sheet rather than wrapping it, so it never steals
              touches from the description ScrollView. */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeModal}
            accessibilityRole="button"
            accessibilityLabel="Close volunteer details"
          />
          <View style={styles.modalWrapper}>
            {selectedVolunteer && (
              <View style={styles.modalAvatarContainer}>
                <Image
                  source={selectedVolunteer.avatar_uri ? { uri: selectedVolunteer.avatar_uri } : placeholderAvatar}
                  style={styles.modalAvatar}
                  resizeMode="cover"
                />
              </View>
            )}
            <View style={[styles.modalContent, { maxHeight: windowHeight * MODAL_MAX_HEIGHT_RATIO }]}>
              {selectedVolunteer && (
                <>
                  <View style={styles.modalHeader}>
                    <CustomText variant="textLargeBold" style={styles.modalName}>
                      {selectedVolunteer.badge}
                    </CustomText>
                    <CustomText variant="textMedium" style={styles.modalRole}>
                      {selectedVolunteer.role?.trim() || UNASSIGNED_ROLE}
                    </CustomText>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={styles.modalBodyContent}
                    showsVerticalScrollIndicator
                    bounces={false}>
                    <CustomText variant="textMedium" style={styles.modalDescription}>
                      {selectedVolunteer.description?.trim() || DEFAULT_DESCRIPTION}
                    </CustomText>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  avatar: {
    borderRadius: 30,
    height: 60,
    marginBottom: 5,
    width: 60,
  },
  badgeText: {
    marginBottom: 2,
    textAlign: 'center',
    ...typography.textSmallBold,
  },
  roleText: {
    ...typography.textSmall,
    color: '#666',
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  emptyText: {
    color: '#666',
    marginTop: 40,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  modalAvatarContainer: {
    backgroundColor: '#fff',
    borderColor: '#4357AD',
    borderRadius: 60,
    borderWidth: 2,
    height: 120,
    overflow: 'hidden',
    position: 'absolute',
    top: -60,
    width: 120,
    zIndex: 100,
  },
  modalAvatar: {
    height: 120,
    position: 'absolute',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
    paddingBottom: 40,
    paddingHorizontal: 25,
    paddingTop: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
    marginBottom: 20,
    paddingBottom: 20,
  },
  modalName: {
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalRole: {
    color: '#4357AD',
    textAlign: 'center',
  },
  modalBody: {
    flexShrink: 1,
  },
  modalBodyContent: {
    paddingBottom: 10,
  },
  modalDescription: {
    color: '#333',
    lineHeight: 24,
    textAlign: 'left',
  },
});

export default Volunteers;
