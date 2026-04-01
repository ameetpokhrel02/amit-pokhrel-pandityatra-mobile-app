import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !price) {
      Alert.alert('Required', 'Product name and price are required.');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('stock_quantity', stock || '0');

      if (image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: image,
          name: `product_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      await createProduct(formData);
      
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

  const inputStyle = [styles.inputWrap, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#E5E7EB' }];
  const textStyle = [styles.input, { color: colors.text }];
  const phColor = colors.text + '50';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add New Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        {/* Image Picker */}
        <TouchableOpacity 
            style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]} 
            onPress={pickImage}
        >
          {image ? (
            <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <View style={[styles.editIconBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="camera" size={16} color="#FFF" />
                </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '10' }]}>
                <MaterialCommunityIcons name="image-plus" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.pickText, { color: colors.text }]}>Add Product Image</Text>
              <Text style={[styles.pickSubtext, { color: colors.text + '50' }]}>Click to browse gallery</Text>
            </View>
          )}
        </TouchableOpacity>

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
  imagePicker: {
    height: 180, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2,
    overflow: 'hidden', marginBottom: 10,
  },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  pickText: { fontSize: 16, fontWeight: '700' },
  pickSubtext: { fontSize: 12, fontWeight: '500' },
  imageContainer: { flex: 1, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  editIconBadge: { position: 'absolute', right: 12, bottom: 12, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, marginTop: 4 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
