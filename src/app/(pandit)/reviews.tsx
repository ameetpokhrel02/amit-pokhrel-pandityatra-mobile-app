import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: '1', userName: 'Ameet Pokhrel', rating: 5, comment: 'Excellent puja performance. Explained everything very well.', date: '2026-03-12' },
  { id: '2', userName: 'Sunita Thapa', rating: 4, comment: 'Very punctual and professional.', date: '2026-03-08' },
];

export default function PanditReviewsScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userRow}>
          <View style={styles.avatarPlaceholder}><Text style={styles.initials}>{item.userName.charAt(0)}</Text></View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#f97316" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>4.8</Text>
          <Text style={styles.statLbl}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>124</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>98%</Text>
          <Text style={styles.statLbl}>Positive</Text>
        </View>
      </View>

      <FlatList
        data={MOCK_REVIEWS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No reviews received yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
  statsBar: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    margin: 15, 
    borderRadius: 15, 
    padding: 15,
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#f97316' },
  statLbl: { fontSize: 12, color: '#999', marginTop: 2 },
  statDivider: { width: 1, height: '60%', backgroundColor: '#eee', alignSelf: 'center' },
  listContent: { padding: 15, paddingTop: 0 },
  reviewCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee'
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#3E2723', justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  initials: { color: '#fff', fontWeight: 'bold' },
  userInfo: { },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
  date: { fontSize: 12, color: '#999' },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff7ed', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  ratingText: { marginLeft: 4, fontSize: 12, fontWeight: 'bold', color: '#f97316' },
  comment: { fontSize: 14, color: '#666', lineHeight: 22, fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },
});
