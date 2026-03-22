import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { fetchPanditMyServices, addPanditService, updateService, deleteService, MyService } from '@/services/pandit.service';
import { fetchServices } from '@/services/puja.service';
import { getImageUrl } from '@/utils/image';

export default function ServicesScreen() {
    const [services, setServices] = useState<MyService[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [allPujas, setAllPujas] = useState<any[]>([]);
    const [selectedPuja, setSelectedPuja] = useState<any | null>(null);
    const [customPrice, setCustomPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [myServicesRes, availablePujasRes] = await Promise.all([
                fetchPanditMyServices(),
                fetchServices()
            ]);
            setServices(myServicesRes.data || []);
            setAllPujas(availablePujasRes || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async () => {
        if (!selectedPuja || !customPrice || !duration) {
            Alert.alert('Required', 'Please fill in all fields');
            return;
        }

        try {
            setSubmitting(true);
            if (editingServiceId) {
                await updateService(editingServiceId, {
                    custom_price: parseFloat(customPrice),
                    duration_minutes: parseInt(duration)
                });
                Alert.alert('Success', 'Service updated successfully');
            } else {
                await addPanditService({
                    puja_id: selectedPuja.id,
                    custom_price: parseFloat(customPrice),
                    duration_minutes: parseInt(duration)
                });
                Alert.alert('Success', 'Service added successfully');
            }
            setShowAddModal(false);
            resetForm();
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save service');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteService = (id: number) => {
        Alert.alert(
            'Delete Service',
            'Are you sure you want to delete this service?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteService(id);
                            loadData();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setSelectedPuja(null);
        setCustomPrice('');
        setDuration('');
        setEditingServiceId(null);
    };

    const renderServiceItem = ({ item }: { item: MyService }) => {
        return (
            <View style={styles.serviceCard}>
                <View style={styles.serviceImageContainer}>
                    <Image
                        source={{ uri: getImageUrl(item.puja_details?.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=300' }}
                        style={styles.serviceImage}
                        contentFit="cover"
                    />
                </View>
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={1}>{item.puja_details?.name}</Text>
                    <View style={styles.serviceMeta}>
                        <Text style={styles.servicePrice}>₹{item.custom_price}</Text>
                        <View style={styles.metaDivider} />
                        <View style={styles.durationBadge}>
                            <Ionicons name="time-outline" size={12} color="#6B7280" />
                            <Text style={styles.serviceDuration}>{item.duration_minutes}m</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#F0F7FF' }]}
                        onPress={() => {
                            setEditingServiceId(item.id);
                            setSelectedPuja({ id: item.puja, name: item.puja_details?.name } as any);
                            setCustomPrice(item.custom_price.toString());
                            setDuration(item.duration_minutes.toString());
                            setShowAddModal(true);
                        }}
                    >
                        <Ionicons name="create" size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
                        onPress={() => handleDeleteService(item.id)}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity onPress={() => Alert.alert("Navigate Back")}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.title}>My Services</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setShowAddModal(true); }}>
                    <Ionicons name="add" size={20} color="#FFF" />
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            ) : (
                <FlatList
                    data={services}
                    renderItem={renderServiceItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    onRefresh={loadData}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="sparkles-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No services added yet</Text>
                            <Text style={styles.emptySubtext}>Add services you can perform to start receiving bookings</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingServiceId ? 'Edit Service' : 'Add Service'}</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Select Puja *</Text>
                            <View style={styles.pujaGrid}>
                                {allPujas.map((puja) => (
                                    <TouchableOpacity
                                        key={puja.id}
                                        style={[
                                            styles.pujaOption,
                                            selectedPuja?.id === puja.id && styles.pujaOptionSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedPuja(puja);
                                            setCustomPrice(puja.base_price.toString());
                                            setDuration(puja.base_duration_minutes?.toString() || '60');
                                        }}
                                    >
                                        <Text style={[
                                            styles.pujaOptionText,
                                            selectedPuja?.id === puja.id && styles.pujaOptionTextSelected
                                        ]}>{puja.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Custom Price (₹) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 5000"
                                keyboardType="numeric"
                                value={customPrice}
                                onChangeText={setCustomPrice}
                            />

                            <Text style={styles.inputLabel}>Duration (Minutes) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 120"
                                keyboardType="numeric"
                                value={duration}
                                onChangeText={setDuration}
                            />

                            <Button
                                title={submitting ? "Processing..." : (editingServiceId ? "Update Service" : "Save Service")}
                                onPress={handleAddService}
                                style={styles.saveButton}
                                disabled={submitting}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6F00',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
    },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    listContent: { padding: 20, gap: 16, flexGrow: 1 },
    serviceCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    serviceImageContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
    },
    serviceImage: { width: '100%', height: '100%' },
    serviceInfo: { flex: 1, marginLeft: 16 },
    serviceName: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    serviceMeta: { flexDirection: 'row', alignItems: 'center' },
    servicePrice: { fontSize: 15, color: '#FF6F00', fontWeight: '900' },
    metaDivider: { width: 1, height: 12, backgroundColor: '#E2E8F0', marginHorizontal: 10 },
    durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    serviceDuration: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    cardActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8, borderRadius: 10 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '85%',
        padding: 24,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    modalForm: { marginBottom: 24 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
    pujaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pujaOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    pujaOptionSelected: { backgroundColor: '#FF6F0015', borderColor: '#FF6F00' },
    pujaOptionText: { fontSize: 14, color: '#4B5563' },
    pujaOptionTextSelected: { color: '#FF6F00', fontWeight: 'bold' },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        backgroundColor: '#F9FAFB',
        marginTop: 4,
    },
    saveButton: { marginTop: 32, marginBottom: 40, height: 56, borderRadius: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
