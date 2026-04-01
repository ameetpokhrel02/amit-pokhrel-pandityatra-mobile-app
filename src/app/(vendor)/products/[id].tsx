import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/store/ThemeContext';
import { getVendorProduct, updateProduct, deleteProduct, VendorProduct } from '@/services/vendor.service';
import { getImageUrl } from '@/utils/image';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function EditProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getVendorProduct(Number(id));
        const p = res.data;
        setProduct(p);
        setName(p.name || '');
        setDescription(p.description || '');
        setPrice(String(p.price || ''));
        setStock(String(p.stock_quantity ?? ''));
      } catch {
        Alert.alert('Error', 'Could not load product.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

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

  const handleSave = async () => {
    if (!name.trim() || !price) {
      Alert.alert('Required', 'Name and price are required.');
      return;
    }
    try {
      setSaving(true);
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
          name: `product_edit_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      await updateProduct(Number(id), formData);
      Alert.alert('✅ Updated', 'Product updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Error', 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteProduct(Number(id));
      setShowDeleteModal(false);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = [styles.inputWrap, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#E5E7EB' }];
  const textStyle = [styles.input, { color: colors.text }];
  const phColor = colors.text + '50';

  if (loading) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Product</Text>
        <TouchableOpacity onPress={() => setShowDeleteModal(true)} style={[styles.deleteBtn, { backgroundColor: '#FF5252' + '15' }]}>
          <Ionicons name="trash-outline" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        {/* Image Update Section */}
        <TouchableOpacity 
            style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}
            onPress={pickImage}
        >
          {image || product?.image ? (
            <View style={styles.imageContainer}>
                <Image source={{ uri: image || getImageUrl(product?.image!) || '' }} style={styles.previewImage} />
                <View style={[styles.editIconBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="camera" size={16} color="#FFF" />
                </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '10' }]}>
                <MaterialCommunityIcons name="image-plus" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.pickText, { color: colors.text }]}>Change Image</Text>
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
          <TextInput style={[textStyle, { flex: 1 }]} placeholder="Description" placeholderTextColor={phColor} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
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

        {!product?.is_approved && (
          <View style={[styles.infoBox, { backgroundColor: '#FF9800' + '15', borderColor: '#FF9800' + '40' }]}>
            <Ionicons name="time-outline" size={16} color="#FF9800" />
            <Text style={[styles.infoText, { color: '#FF9800' }]}>This product is pending admin approval.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
          onPress={handleSave} disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product?"
        message={`Are you sure you want to delete "${product?.name}"? All details and images will be permanently removed.`}
        confirmText="Delete"
        type="danger"
        icon="trash"
        isLoading={deleting}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  deleteBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 20, gap: 14 },
  imagePicker: {
    height: 200, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2,
    overflow: 'hidden', marginBottom: 10,
  },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  pickText: { fontSize: 16, fontWeight: '700' },
  imageContainer: { flex: 1, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  editIconBadge: { position: 'absolute', right: 12, bottom: 12, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, marginTop: 4 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
