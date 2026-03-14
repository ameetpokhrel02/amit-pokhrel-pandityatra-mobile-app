import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SavedKundali {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  location: string;
}

const MOCK_KUNDALIS: SavedKundali[] = [
  { id: '1', name: 'Ameet Pokhrel', birthDate: '1995-10-12', birthTime: '08:30 AM', location: 'Kathmandu' },
  { id: '2', name: 'Rita Devi', birthDate: '1988-05-24', birthTime: '02:15 PM', location: 'Pokhara' },
];

export default function KundaliHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState(MOCK_KUNDALIS);

  const handleShare = async (item: SavedKundali) => {
    try {
      await Share.share({
        message: `Check out the Kundali for ${item.name} (Born on ${item.birthDate} at ${item.location}) shared via PanditYatra.`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: SavedKundali }) => (
    <View style={styles.kundaliCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-text" size={20} color="#f97316" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.subtext}>{item.birthDate} • {item.birthTime}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => router.push(`/(customer)/kundali?id=${item.id}`)}
        >
          <Ionicons name="eye-outline" size={18} color="#f97316" />
          <Text style={styles.actionText}>View PDF</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
          <Ionicons name="share-social-outline" size={18} color="#f97316" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>Kundali History</Text>
        <TouchableOpacity onPress={() => router.push('/(customer)/kundali')}>
          <Ionicons name="add-circle" size={28} color="#f97316" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No saved kundalis found</Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => router.push('/(customer)/kundali')}
            >
              <Text style={styles.createBtnText}>Generate Your First Kundali</Text>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: { padding: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#3E2723' },
  listContent: { padding: 15 },
  kundaliCard: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  headerText: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#3E2723' },
  subtext: { fontSize: 13, color: '#666', marginTop: 2 },
  deleteBtn: { padding: 5 },
  detailsRow: { marginBottom: 15, paddingLeft: 52 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#666', marginLeft: 6 },
  actions: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#eee', 
    paddingTop: 12,
    marginTop: 5
  },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  actionText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#f97316' },
  divider: { width: 1, backgroundColor: '#eee', height: '100%' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16, marginBottom: 20 },
  createBtn: { 
    backgroundColor: '#f97316', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  createBtnText: { color: '#fff', fontWeight: 'bold' },
});
