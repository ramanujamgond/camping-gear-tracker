import { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import tripService from '../services/tripService';

export default function TripDetailScreen({ route, navigation }) {
  const { tripId } = route.params;
  const { isAdmin } = useContext(AuthContext);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrip = async () => {
    try {
      const data = await tripService.getTripById(tripId);
      setTrip(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load trip details');
      console.error('Load trip error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [tripId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTrip();
  };

  const handleCloseTrip = () => {
    Alert.alert(
      'Close Trip',
      'Are you sure you want to close this trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Trip',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripService.closeTrip(tripId);
              Alert.alert('Success', 'Trip closed successfully');
              loadTrip();
            } catch (error) {
              Alert.alert('Error', 'Failed to close trip');
              console.error('Close trip error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTrip = () => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? All trip data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripService.deleteTrip(tripId);
              Alert.alert('Success', 'Trip deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete trip');
              console.error('Delete trip error:', error);
            }
          },
        },
      ]
    );
  };

  const handleItemStatusChange = async (itemId, status, qrCodeId = null) => {
    try {
      await tripService.markItemReturned(tripId, itemId, '', status, qrCodeId);
      Alert.alert('Success', `Item marked as ${status}`);
      loadTrip();
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || `Failed to mark item as ${status}`;
      Alert.alert('Error', errorMessage);
      console.error('Update item status error:', error);
    }
  };

  const handleScanToReturn = (tripItem) => {
    // Navigate to scanner with callback to handle the scanned QR code
    navigation.navigate('Scanner', {
      onScan: (scannedQrCode) => {
        // Verify the scanned QR matches the item
        if (scannedQrCode === tripItem.item.qr_code_id) {
          handleItemStatusChange(tripItem.item_id, 'returned', scannedQrCode);
        } else {
          Alert.alert(
            'Wrong Item',
            `You scanned "${scannedQrCode}" but expected "${tripItem.item.qr_code_id}". Please scan the correct item.`
          );
        }
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken':
        return '#ff9800';
      case 'returned':
        return '#4caf50';
      case 'lost':
        return '#f44336';
      case 'not_found':
        return '#9e9e9e';
      default:
        return '#666';
    }
  };

  const renderTripItem = (tripItem) => (
    <View key={tripItem.id} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{tripItem.item?.name}</Text>
          <Text style={styles.itemQR}>QR: {tripItem.item?.qr_code_id}</Text>
        </View>
        <View style={[styles.itemStatusBadge, { backgroundColor: getStatusColor(tripItem.status) }]}>
          <Text style={styles.itemStatusText}>{tripItem.status.toUpperCase()}</Text>
        </View>
      </View>

      {tripItem.notes_when_added && (
        <Text style={styles.itemNotes}>📝 {tripItem.notes_when_added}</Text>
      )}

      {trip.status === 'open' && tripItem.status === 'taken' && (
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.returnedButton]}
            onPress={() => handleScanToReturn(tripItem)}
          >
            <Text style={styles.actionButtonText}>📷 Scan to Return</Text>
          </TouchableOpacity>
          {isAdmin() && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.lostButton]}
                onPress={() => handleItemStatusChange(tripItem.item_id, 'lost')}
              >
                <Text style={styles.actionButtonText}>Lost</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.notFoundButton]}
                onPress={() => handleItemStatusChange(tripItem.item_id, 'not_found')}
              >
                <Text style={styles.actionButtonText}>Not Found</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {trip.status === 'open' && tripItem.status === 'not_found' && isAdmin() && (
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.returnedButton]}
            onPress={() => handleScanToReturn(tripItem)}
          >
            <Text style={styles.actionButtonText}>📷 Scan if Found</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.tripName}>{trip.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: trip.status === 'open' ? '#4caf50' : '#9e9e9e' }]}>
          <Text style={styles.statusText}>{trip.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>📅 Dates</Text>
        <Text style={styles.infoValue}>
          {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
        </Text>

        {trip.location && (
          <>
            <Text style={[styles.infoLabel, styles.marginTop]}>📍 Location</Text>
            <Text style={styles.infoValue}>{trip.location}</Text>
          </>
        )}

        {trip.notes && (
          <>
            <Text style={[styles.infoLabel, styles.marginTop]}>📝 Notes</Text>
            <Text style={styles.infoValue}>{trip.notes}</Text>
          </>
        )}
      </View>

      {trip.statistics && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{trip.statistics.total_items}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#4caf50' }]}>{trip.statistics.returned_items}</Text>
              <Text style={styles.statLabel}>Returned</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#ff9800' }]}>{trip.statistics.pending_items}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#f44336' }]}>{trip.statistics.lost_items}</Text>
              <Text style={styles.statLabel}>Lost</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${trip.statistics.return_percentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{trip.statistics.return_percentage}% Returned</Text>
        </View>
      )}

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Items ({trip.trip_items?.length || 0})</Text>
        {trip.status === 'open' && (
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => navigation.navigate('AddTripItem', { tripId: trip.id })}
          >
            <Text style={styles.addItemButtonText}>➕ Add Item</Text>
          </TouchableOpacity>
        )}
      </View>

      {trip.trip_items && trip.trip_items.length > 0 ? (
        trip.trip_items.map(renderTripItem)
      ) : (
        <View style={styles.emptyItems}>
          <Text style={styles.emptyText}>No items added yet</Text>
        </View>
      )}

      {isAdmin() && (
        <View style={styles.adminActions}>
          {trip.status === 'open' && (
            <TouchableOpacity style={styles.closeTripButton} onPress={handleCloseTrip}>
              <Text style={styles.closeTripButtonText}>Close Trip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTrip}>
            <Text style={styles.deleteButtonText}>Delete Trip</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  marginTop: {
    marginTop: 15,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  itemsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  addItemButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQR: {
    fontSize: 12,
    color: '#666',
  },
  itemStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  itemStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  itemNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  returnedButton: {
    backgroundColor: '#4caf50',
  },
  lostButton: {
    backgroundColor: '#f44336',
  },
  notFoundButton: {
    backgroundColor: '#9e9e9e',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyItems: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  adminActions: {
    padding: 15,
    gap: 10,
  },
  closeTripButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeTripButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});
