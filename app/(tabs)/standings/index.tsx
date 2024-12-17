import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import { FontAwesome6 } from '@expo/vector-icons';

export default function StandingsIndex() {
  const { divisions, loading, error } = useDivisions();

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
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
              pathname: '/standings/[division]',
              params: { division: division.id, divisionName: division.title }
            }}
            asChild
          >
            <TouchableOpacity>
              <View style={[styles.card, { borderLeftColor: division.color, borderLeftWidth: 4 }]}>
                <FontAwesome6
                  name={division.icon as any}
                  size={24}
                  color={division.color}
                  style={styles.icon}
                />
                <Text style={styles.title}>{division.title}</Text>
                <FontAwesome6
                  name="chevron-right"
                  size={24}
                  color="#A0A0A0"
                />
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
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
});