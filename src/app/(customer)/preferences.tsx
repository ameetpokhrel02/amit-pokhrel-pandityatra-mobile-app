import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { fetchUserPreferences, updateUserPreference, createUserPreference } from '@/services/recommender.service';

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<any>({ 
    ai_recommendations_enabled: true, 
    preferred_tradition: 'ALL',
    budget_friendly: false 
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await fetchUserPreferences();
      // Assuming the first one is the main preference object for simplicity in this flow
      setPreferences(data[0] || { 
        ai_recommendations_enabled: true, 
        preferred_tradition: 'ALL',
        budget_friendly: false
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string) => {
    const newValue = !preferences[key];
    setPreferences({ ...preferences, [key]: newValue });
    
    try {
      setSaving(true);
      if (preferences.id) {
        await updateUserPreference(preferences.id, { [key]: newValue });
      } else {
        const newPref = await createUserPreference({ [key]: newValue });
        setPreferences(newPref);
      }
    } catch (error) {
      console.error('Update preference error:', error);
      Alert.alert("Error", "Failed to update preference");
      setPreferences({ ...preferences, [key]: !newValue }); // rollback
    } finally {
      setSaving(false);
    }
  };

  const renderPreferenceItem = (icon: any, title: string, subtitle: string, value: boolean, onToggle: () => void) => (
    <View style={[styles.item, { borderBottomColor: colors.border }]}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.text + '70' }]}>{subtitle}</Text>
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : '#f4f3f4'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>AI & Personalization</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderPreferenceItem(
              "sparkles-outline", 
              "AI Recommendations", 
              "Smart suggestions for Samagri and services based on your needs.",
              preferences.ai_recommendations_enabled,
              () => handleToggle('ai_recommendations_enabled')
            )}
            
            {renderPreferenceItem(
              "wallet-outline", 
              "Budget Friendly", 
              "Prioritize affordable Samagri options in recommendations.",
              preferences.budget_friendly,
              () => handleToggle('budget_friendly')
            )}

            {renderPreferenceItem(
              "notifications-outline", 
              "Smart Reminders", 
              "Get alerts for upcoming festivals and ritual requirements.",
              preferences.notifications_enabled !== false,
              () => {} // Mock for now
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 30 }]}>Spiritual Tradition</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.traditionItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Current Tradition</Text>
              <View style={styles.selectionRow}>
                <Text style={[styles.selectionText, { color: colors.primary }]}>Universal / All</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.text + '40'} />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={[styles.helperText, { color: colors.text + '50' }]}>
            These settings help our AI curate a better spiritual experience for you. All data is handled according to our Privacy Policy.
          </Text>
        </ScrollView>
      )}

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemSubtitle: { fontSize: 12 },
  traditionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  selectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectionText: { fontSize: 14, fontWeight: '500' },
  helperText: { fontSize: 12, textAlign: 'center', marginTop: 30, lineHeight: 18, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  savingOverlay: { position: 'absolute', top: 60, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
});
