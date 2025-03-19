import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';

export default function ScheduleIndex() {
  const { divisions, loading, error } = useDivisions();

  if (loading) {
    return (
      <LoadingIndicator message='Loading Divisions...' />
    );
  }

  if (error) {
    return (
      <View>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {divisions.map((division) => (
          <Link
            key={division.id}
            href={{
              pathname: '/schedule/[division]',
              params: { division: division.id, divisionName: division.title }
            }}
            asChild
          >
            <TouchableOpacity>
              <View style={[styles.card, { borderColor: division.color, borderBottomWidth: 4 }]}>
                <Text style={[styles.title, { color: division.color, textDecorationColor: division.color }]}>{division.title}</Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    borderWidth: 1,
  },
  title: {
    ...typography.h4,
    textDecorationLine: 'underline',
  },

});