import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { fetchPanditMyServices, addPanditService, MyService } from '@/services/pandit.service';
import { fetchServices } from '@/services/puja.service';
import { Puja } from '@/services/api';

export default function ServicesScreen() {
    const [services, setServices] = useState<MyService[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [allPujas, setAllPujas] = useState<Puja[]>([]);
    const [selectedPuja, setSelectedPuja] = useState<Puja | null>(null);
    const [customPrice, setCustomPrice] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [myServices, availablePujas] = await Promise.all([
                fetchPanditMyServices(),
                fetchServices()
            ]);
            setServices(myServices);
            setAllPujas(availablePujas as any);
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
            await addPanditService({
                puja_id: selectedPuja.id,
                custom_price: parseFloat(customPrice),
                duration_minutes: parseInt(duration)
            });
            Alert.alert('Success', 'Service added successfully');
            setShowAddModal(false);
            setSelectedPuja(null);
            setCustomPrice('');
            setDuration('');
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add service');
        }
    };

    const renderServiceItem = ({ item }: { item: MyService }) => (
        <View style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.puja_details?.name}</Text>
                <Text style={styles.servicePrice}>NPR {item.custom_price}</Text>
                <Text style={styles.serviceDuration}>{item.duration_minutes} mins</Text>
            </View>
            <TouchableOpacity
                style={styles.statusBadge}
                onPress={() => Alert.alert('Status', item.is_active ? 'Active' : 'Inactive')}
            >
                <Text style={[styles.statusText, { color: item.is_active ? '#10B981' : '#EF4444' }]}>
                    {item.is_active ? 'Active' : 'Inactive'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Services</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.addButtonText}>Add New</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={services}
                renderItem={renderServiceItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={loadData}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="sparkles-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No services added yet</Text>
                            <Text style={styles.emptySubtext}>Add services you can perform to start receiving bookings</Text>
                        </View>
                    ) : null
                }
            />

            {/* Add Service Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Service</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>Select Puja Type *</Text>
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
                                            setDuration((puja as any).base_duration_minutes?.toString() || '60');
                                        }}
                                    >
                                        <Text style={[
                                            styles.pujaOptionText,
                                            selectedPuja?.id === puja.id && styles.pujaOptionTextSelected
                                        ]}>{puja.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Custom Price (NPR) *</Text>
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
                                title="Save Service"
                                onPress={handleAddService}
                                style={styles.saveButton}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#FFF',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        gap: 16,
        flexGrow: 1,
    },
    serviceCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    servicePrice: {
        fontSize: 16,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    serviceDuration: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalForm: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    pujaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pujaOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    pujaOptionSelected: {
        backgroundColor: Colors.light.primary + '20',
        borderColor: Colors.light.primary,
    },
    pujaOptionText: {
        fontSize: 14,
        color: '#4B5563',
    },
    pujaOptionTextSelected: {
        color: Colors.light.primary,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#F9FAFB',
    },
    saveButton: {
        marginTop: 32,
        marginBottom: 40,
    },
});
