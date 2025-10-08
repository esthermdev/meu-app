import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import CustomText from "@/components/CustomText";
import CustomHeader from "@/components/headers/CustomHeader";
import { typography } from "@/constants/Typography";

interface Coach {
  name: string;
  organization: string;
  avatar?: string;
}

const coaches: Coach[] = [
  {
    name: "Pat Kelsey",
    organization: "Peak Performance Training",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Pat%20Kelsy%20Coaches%20Corner.JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL1BhdCBLZWxzeSBDb2FjaGVzIENvcm5lci5KUEciLCJpYXQiOjE3NTk2NDg0NjgsImV4cCI6MTc5MTE4NDQ2OH0.wtijmYFwUW7laP5xRqMaq65-AGeJ6tM7rJ1qPnDAXww',
  },
  {
    name: "Rowan McDonnell",
    organization: "Excel Ultimate",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Rowan%20McDonnell-livestream.JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL1Jvd2FuIE1jRG9ubmVsbC1saXZlc3RyZWFtLkpQRyIsImlhdCI6MTc1OTY0ODQ5NiwiZXhwIjoxNzkxMTg0NDk2fQ.aQjZXIrvJ3Yhaz_BUNeiwOBiXwf_UmmCEMCI_McmcNk',
  },
  {
    name: "Jared Jandreau",
    organization: "Beyond Strength",
    avatar: undefined,
  },
  {
    name: "Tobe Decrain",
    organization: "tobefit",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/tobe%20decraene%20Coaches%20Corner.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL3RvYmUgZGVjcmFlbmUgQ29hY2hlcyBDb3JuZXIucG5nIiwiaWF0IjoxNzU5NjQ4NTA2LCJleHAiOjE3OTExODQ1MDZ9.FjQ8tUO4mjV-usSJIi2BHNNE2O87ECepavD2wr7Udy8',
  },
  {
    name: "Chuck Cleary",
    organization: "CF Films",
    avatar: undefined,
  },
  {
    name: "Bill Bourret",
    organization: "Observer",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Bill%20Bourret_Head%20Observer.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL0JpbGwgQm91cnJldF9IZWFkIE9ic2VydmVyLmpwZyIsImlhdCI6MTc1OTY0ODQ3OSwiZXhwIjoxNzkxMTg0NDc5fQ.P6EnkdZaDtNDJGKZzcWttOizSS3Nyoz_bPsOgjkRokc',
  },
  {
    name: "Keith Raynor",
    organization: "Ultiworld",
    avatar: 'https://opleqymigooimduhlvym.supabase.co/storage/v1/object/sign/avatars/Keith%20Raynor%20-%20Ultiworld_Wesleyan.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTA0YTUxZi1iNGYwLTRlYWYtOWI0YS05ZDZjNDZkYzFhN2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL0tlaXRoIFJheW5vciAtIFVsdGl3b3JsZF9XZXNsZXlhbi5qcGciLCJpYXQiOjE3NTk2NDg0NDQsImV4cCI6MTc5MTE4NDQ0NH0.z407F150L589bCcjg9lGEKtQAZyo0s3zcnb8F9l-M-M',
  },
];

const CoachesCorner = () => {
  const renderCoachCard = (coach: Coach, index: number) => (
    <View key={index} style={styles.coachCard}>
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
    </View>
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
    width: "30%",
    alignItems: "center",
    marginBottom: 10,
		backgroundColor: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 30.48%, rgba(224, 174, 67, 0.59) 93.16%)',
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
    width: 100,
    height: 150,
    position: "absolute",
    top: -0,
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
});
