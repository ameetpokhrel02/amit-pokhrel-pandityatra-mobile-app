import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getSavedKundalis } from '@/services/kundali.service';
import { useTheme } from '@/store/ThemeContext';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SavedKundali {
  id: string | number;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
}

export default function KundaliHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [history, setHistory] = useState<SavedKundali[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getSavedKundalis();
      setHistory(data);
    } catch (error) {
      console.error('Error loading kundalis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (item: SavedKundali) => {
    try {
      await Share.share({
        message: `Check out the Kundali for ${item.name} (Born on ${item.birth_date} at ${item.birth_place}) shared via PanditYatra.`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: SavedKundali }) => (
    <View style={[styles.kundaliCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="document-text" size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.subtext, { color: colors.text + '80' }]}>
            {dayjs(item.birth_date).format('MMM D, YYYY')} • {item.birth_time}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color={colors.text + '60'} />
          <Text style={[styles.detailText, { color: colors.text + '60' }]}>{item.birth_place}</Text>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => router.push(`/(customer)/kundali?id=${item.id}`)}
        >
          <Ionicons name="eye-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>View Detail</Text>
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
          <Ionicons name="share-social-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Kundali History</Text>
        <TouchableOpacity onPress={() => router.push('/(customer)/kundali')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color={colors.text + '20'} />
            <Text style={[styles.emptyText, { color: colors.text + '40' }]}>No saved kundalis found</Text>
            <TouchableOpacity 
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
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
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
