import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { createProduct } from '@/services/vendor.service';

export default function NewProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const inputStyle = [styles.inputWrap, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#E5E7EB' }];
  const textStyle = [styles.input, { color: colors.text }];
  const phColor = colors.text + '50';

  const handleCreate = async () => {
    if (!name.trim() || !price) {
      Alert.alert('Required', 'Product name and price are required.');
      return;
    }
    try {
      setLoading(true);
      await createProduct({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock_quantity: parseInt(stock || '0', 10),
      });
      Alert.alert('✅ Product Added', 'Your product is awaiting admin approval.', [
        { text: 'Back to Products', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join('\n') : (data?.detail || 'Failed to add product.');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add New Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
          <MaterialCommunityIcons name="package-variant-plus" size={40} color={colors.primary} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Details</Text>

        <View style={inputStyle}>
          <Ionicons name="pricetag-outline" size={18} color={colors.primary} style={styles.icon} />
          <TextInput style={textStyle} placeholder="Product Name *" placeholderTextColor={phColor} value={name} onChangeText={setName} />
        </View>

        <View style={[inputStyle, { alignItems: 'flex-start', minHeight: 90 }]}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} style={[styles.icon, { marginTop: 2 }]} />
          <TextInput
            style={[textStyle, { flex: 1 }]}
            placeholder="Description (optional)"
            placeholderTextColor={phColor}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>Pricing & Stock</Text>

        <View style={inputStyle}>
          <Ionicons name="cash-outline" size={18} color={colors.primary} style={styles.icon} />
          <TextInput style={textStyle} placeholder="Price (NPR) *" placeholderTextColor={phColor} keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
        </View>

        <View style={inputStyle}>
          <MaterialCommunityIcons name="package-variant-closed" size={18} color={colors.primary} style={styles.icon} />
          <TextInput style={textStyle} placeholder="Stock Quantity" placeholderTextColor={phColor} keyboardType="number-pad" value={stock} onChangeText={setStock} />
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            New products require admin approval before they appear in the shop.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="plus-circle" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 20, gap: 14 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, marginTop: 4 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
