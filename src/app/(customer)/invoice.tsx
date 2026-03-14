import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function InvoiceViewerScreen() {
  const router = useRouter();
  const { orderId, bookingId } = useLocalSearchParams();

  const handleDownload = async () => {
    // Mock download/share
    try {
      await Share.share({
        message: `Invoice for ${orderId || bookingId} from PanditYatra.`,
        title: 'Download Invoice'
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.title}>Invoice {orderId || bookingId}</Text>
        <TouchableOpacity onPress={handleDownload}>
          <Ionicons name="share-outline" size={24} color="#f97316" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.invoiceWrapper}>
        <View style={styles.invoiceCard}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>PanditYatra</Text>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoTitle}>Bill To:</Text>
              <Text style={styles.infoVal}>Ameet Pokhrel</Text>
              <Text style={styles.infoVal}>Kathmandu, Nepal</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoTitle}>Date:</Text>
              <Text style={styles.infoVal}>March 14, 2026</Text>
              <Text style={styles.infoTitle}>Status:</Text>
              <Text style={[styles.infoVal, { color: '#10B981', fontWeight: 'bold' }]}>PAID</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHead, { flex: 2 }]}>Description</Text>
              <Text style={styles.tableHead}>Qty</Text>
              <Text style={styles.tableHead}>Price</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Ganesh Puja Ritual</Text>
              <Text style={styles.tableCell}>1</Text>
              <Text style={styles.tableCell}>2500</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Puja Samagri Kit</Text>
              <Text style={styles.tableCell}>1</Text>
              <Text style={styles.tableCell}>750</Text>
            </View>
          </View>

          <View style={styles.calculation}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcVal}>NPR 3250</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Tax (0%)</Text>
              <Text style={styles.calcVal}>0</Text>
            </View>
            <View style={[styles.calcRow, styles.finalTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>NPR 3250</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for choosing PanditYatra for your spiritual needs.</Text>
            <Text style={styles.footerSub}>This is a computer-generated invoice.</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.downloadFab} onPress={handleDownload}>
        <Ionicons name="download" size={24} color="#fff" />
        <Text style={styles.fabText}>Save PDF</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#3E2723' },
  backButton: { padding: 5 },
  invoiceWrapper: { padding: 15, paddingBottom: 100 },
  invoiceCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#f97316', paddingBottom: 10 },
  brandName: { fontSize: 24, fontWeight: 'bold', color: '#f97316' },
  invoiceLabel: { fontSize: 16, fontWeight: 'bold', color: '#666', letterSpacing: 2 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  infoCol: { flex: 1 },
  infoTitle: { fontSize: 12, fontWeight: 'bold', color: '#999', marginBottom: 5, textTransform: 'uppercase' },
  infoVal: { fontSize: 14, color: '#3E2723', marginBottom: 3 },
  table: { marginBottom: 30 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9f9f9', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableHead: { flex: 1, fontWeight: 'bold', color: '#666', textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableCell: { flex: 1, color: '#3E2723', textAlign: 'center', fontSize: 13 },
  calculation: { paddingLeft: '40%' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calcLabel: { color: '#666' },
  calcVal: { fontWeight: 'bold', color: '#3E2723' },
  finalTotal: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#f97316' },
  totalVal: { fontSize: 18, fontWeight: 'bold', color: '#f97316' },
  footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
  footerText: { textAlign: 'center', fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 5 },
  footerSub: { fontSize: 10, color: '#999' },
  downloadFab: { 
    position: 'absolute', 
    bottom: 30, 
    left: 20, 
    right: 20, 
    backgroundColor: '#f97316', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  fabText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});
