import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useState } from "react";
import CustomText from "@/components/CustomText";
import CustomHeader from "@/components/headers/CustomHeader";
import { typography } from "@/constants/Typography";

interface Coach {
  name: string;
  organization: string;
  avatar?: string;
  description: string;
}

const coaches: Coach[] = [
  {
    name: "Pat Kelsey",
    organization: "Peak Performance Training",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Pat%20Kelsy%20Coaches%20Corner.JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL1BhdCBLZWxzeSBDb2FjaGVzIENvcm5lci5KUEciLCJpYXQiOjE3NjA3NTAwMTUsImV4cCI6MTc5MjI4NjAxNX0.h6Zcs3DCjaMcJ7Vz5nTY9o4uwqcMzUVsHmXVGTlC6cs',
    description: "Pat 'PK' Kelsey is a strength and conditioning coach specializing in training ultimate players for 15 years. His clients include elite club and professional players, college teams, and youth athletes. He focuses on speed and agility, weightroom and field workout programming, and ACL injury reduction. Contact: pk@pkperformancetraining.com or @pkperform on Instagram.",
  },
  {
    name: "Rowan McDonnell",
    organization: "Excel Ultimate",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Rowan%20McDonnell-livestream.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL1Jvd2FuIE1jRG9ubmVsbC1saXZlc3RyZWFtLnBuZyIsImlhdCI6MTc2MDc1MDAyNiwiZXhwIjoxNzkyMjg2MDI2fQ.mhk_SPjvUENb2OghXX3GC2IINeTYMYRGvG6dvmOsAJc',
    description: "Rowan McDonnell plays for USA's National Team and has dedicated himself to expanding ultimate's reach through coaching youth programs, leading international clinics across Europe, Asia, Africa, and the Americas, and creating accessible training systems through Excel Ultimate. A global ambassador for the sport, he bridges cultures and continents through the game. His commitment to teaching, innovation, and community building has made him one of the hardest working figures advancing ultimate today. He's thrilled to move to Portland, Maine in September for his first Lobster Pot.",
  },
  {
    name: "Jared Jandreau",
    organization: "Beyond Strength",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Jared.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL0phcmVkLnBuZyIsImlhdCI6MTc2MDc1MDA1OSwiZXhwIjoxNzkyMjg2MDU5fQ.Ep3SLUktBwIpuSkiIEvz9hsCIadNctHrWLmkYea66hE',
    description: "Jared Jandreau is a Massage Therapist, Strength Coach, and Ultimate player based in southern Maine. Discovering ultimate in college over 20 years ago, he's competed at the club level ever since, currently playing with his eighth team, The Buoy Association. As founder of Maine Movement, he specializes in training and recovery for ultimate athletes at every level—helping players recover quickly during the season and build strength and resilience in the off-season, keeping them performing at their best on and off the field.",
  },
  {
    name: "Tobe Decrane",
    organization: "tobefit",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/tobe%20decraene%20Coaches%20Corner.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL3RvYmUgZGVjcmFlbmUgQ29hY2hlcyBDb3JuZXIucG5nIiwiaWF0IjoxNzYwNzUwMDQ3LCJleHAiOjE3OTIyODYwNDd9.n2n7YgSXtD_z6MuxxKWuQYbUF8-azCUkjOs0tF3Cw1s',
    description: "Tobe Decrane was named UFA Rookie of the Year and earned Championship Weekend MVP during a championship run. Understanding that training smart matters as much as training hard, he founded TobeFit to share what he's learned. He focuses on strength and conditioning in the gym paired with field-specific training that translates directly to ultimate—building explosiveness, endurance, and confidence in high-pressure moments to help athletes become more prepared and ready to perform at their best.",
  },
  {
    name: "Chuck Cleary",
    organization: "CF Films",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Chuck.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL0NodWNrLmpwZyIsImlhdCI6MTc2MDc1MDA2NywiZXhwIjoxNzkyMjg2MDY3fQ.3trxg0NBF2vzvAS1aoxcNdEYa4eT44elFkPOTsKQI-w',
    description: "Chuck Cleary is a videographer and content creator at CF Films, specializing in capturing ultimate frisbee gameplay and creating compelling sports content. His work helps teams analyze their performance and share their stories with the community.",
  },
  {
    name: "Bill Bourret",
    organization: "Observer",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Bill%20Bourret_Head%20Observer.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL0JpbGwgQm91cnJldF9IZWFkIE9ic2VydmVyLmpwZyIsImlhdCI6MTc2MDc1MDA4MywiZXhwIjoxNzkyMjg2MDgzfQ.IF4bDrCHT00UUfg3eezFhPnIwXQJn4g4v2BVwW_0RX4',
    description: "Bill is an observer from Chapel Hill, North Carolina with ten years of experience. Lobster Pot will be his 20th tournament of 2025, and he's thrilled to attend such an extraordinary event. In his free time, he enjoys biking, scootering, watching hockey (Go Canes), and playfully challenging fellow observers with obscure rules questions (what happens if a disc hits a bird?!). See you in October!",
  },
  {
    name: "Keith Raynor",
    organization: "Ultiworld",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Keith%20Raynor%20-%20Ultiworld_Wesleyan.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL0tlaXRoIFJheW5vciAtIFVsdGl3b3JsZF9XZXNsZXlhbi5qcGciLCJpYXQiOjE3NjA3NTAwOTAsImV4cCI6MTc5MjI4NjA5MH0.fpTvXtaS2EvH-fJAEgPJ3_yBIl2WTHrF-xrG0wfQ3CI',
    description: "Keith Raynor has coached ultimate for 20 years, currently leading Wesleyan Vicious Circles in D-III women's division. As senior editor at Ultiworld for a decade, he's advanced how we discuss and understand the game. After learning at Paideia High School, he's remained heavily involved in ultimate, focusing on the people who make the sport what it is. He lives in New Haven, CT.",
  },
  {
    name: "Nathan Wicks",
    organization: "Ultiworld",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/NathanWicks.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL05hdGhhbldpY2tzLmpwZyIsImlhdCI6MTc2MDc1MDMzMCwiZXhwIjoxNzkyMjg2MzMwfQ.e7L6HP4jfbb6bmk9dVKnjprgUrieSfrCmFGPNfwJiTg',
    description: "Nathan Wicks played for Yale Superfly (college), Snapple, and Death-or-Glory (club national champion in 1999, world champion in 1999 and 2000). He coached Brown University to college national championships in 2000 and 2005, and has coached Death-or-Glory, Ironside, DiG, and Scoop in open division. Coached Glory (2023-2025) and also coached YCCs from 2019-2023.",
  },
];

const CoachesCorner = () => {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCoachPress = (coach: Coach) => {
    setSelectedCoach(coach);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedCoach(null), 300);
  };

  const renderCoachCard = (coach: Coach, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.coachCard}
      onPress={() => handleCoachPress(coach)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {coach.avatar ? (
          <Image
            source={{ uri: coach.avatar }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <CustomText style={styles.avatarInitial}>
              {coach.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </CustomText>
          </View>
        )}
      </View>
      <CustomText variant="textMedium" style={styles.coachName}>
        {coach.name}
      </CustomText>
      <CustomText variant="textSmall" style={styles.organization}>
        {coach.organization}
      </CustomText>
    </TouchableOpacity>
  );

  return (
    <>
      <CustomHeader title="Coaches Corner" />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.coachesGrid}>
            {coaches.map((coach, index) => renderCoachCard(coach, index))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={styles.modalWrapper}>
            {selectedCoach && (
              <View style={styles.modalAvatarContainer}>
                {selectedCoach.avatar ? (
                  <Image
                    source={{ uri: selectedCoach.avatar }}
                    style={styles.modalAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <CustomText style={styles.modalAvatarInitial}>
                      {selectedCoach.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </CustomText>
                  </View>
                )}
              </View>
            )}
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              {selectedCoach && (
                <>
                  <View style={styles.modalHeader}>
                    <CustomText variant="textLargeBold" style={styles.modalName}>
                      {selectedCoach.name}
                    </CustomText>
                    <CustomText variant="textMedium" style={styles.modalOrganization}>
                      {selectedCoach.organization}
                    </CustomText>
                  </View>

                  <View style={styles.modalBody}>
                    <CustomText variant="textMedium" style={styles.modalDescription}>
                      {selectedCoach.description}
                    </CustomText>
                  </View>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default CoachesCorner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    color: "#000",
    marginBottom: 30,
  },
  coachesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
		justifyContent: 'center'
  },
  coachCard: {
    alignItems: "center",
    marginBottom: 10,
  },
  avatarContainer: {
    marginBottom: 5,
    width: 100,
    height: 100,
    overflow: "hidden",
    borderRadius: 25,
    borderWidth: 4,
    borderColor: "#D4A520",
  },
  avatar: {
    width: '100%',
    height: 100,
    position: "absolute",
  },
  avatarPlaceholder: {
    marginBottom: 12,
		height: '100%',
		width: '100%',
		justifyContent: 'center',
		alignItems: "center",
		backgroundColor: "#EEE",
  },
  avatarInitial: {
    ...typography.textLargeBold,
    color: "#666",
  },
  coachName: {
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
		...typography.textSmallBold,
  },
  organization: {
    color: "#000",
    textAlign: "center",
		...typography.textXSmall,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalWrapper: {
    alignItems: "center",
    position: "relative",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 70,
    paddingHorizontal: 25,
    paddingBottom: 25,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 20,
  },
  modalAvatarContainer: {
    position: "absolute",
    top: -60,
    zIndex: 100,
    width: 120,
    height: 120,
    overflow: "hidden",
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#D4A520",
    backgroundColor: "#fff",
  },
  modalAvatar: {
    width: '100%',
    height: 120,
    position: "absolute",
  },
  modalAvatarPlaceholder: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: "center",
    backgroundColor: "#EEE",
  },
  modalAvatarInitial: {
    ...typography.textLargeBold,
    fontSize: 36,
    color: "#666",
  },
  modalName: {
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  modalOrganization: {
    color: "#D4A520",
    textAlign: "center",
    ...typography.textMedium,
  },
  modalBody: {
    marginBottom: 25,
  },
  modalDescription: {
    color: "#333",
    lineHeight: 24,
    textAlign: "left",
  },
  closeButton: {
    backgroundColor: "#D4A520",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    ...typography.textMedium,
    fontWeight: "600",
  },
});
