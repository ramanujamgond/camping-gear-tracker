import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import itemService from '../services/itemService';
import API_CONFIG from '../config/api';

import { AuthContext } from '../context/AuthContext';
import tripService from '../services/tripService';

export default function ItemDetailScreen({ route, navigation }) {
  const { isAdmin } = React.useContext(AuthContext);
  const [item, setItem] = React.useState(route.params.item);
  const [tripStatuses, setTripStatuses] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Refetch item to get all images and trip statuses
    const fetchItemData = async () => {
      try {
        setLoading(true);
        const result = await itemService.getItemByQrCode(item.qr_code_id);
        if (result.success) {
          setItem(result.data);
        }

        // Fetch all trips to find this item's status
        try {
          const tripsData = await tripService.getTrips({ limit: 100 });
          const itemTripStatuses = [];
          
          if (tripsData.trips) {
            for (const trip of tripsData.trips) {
              const tripDetail = await tripService.getTripById(trip.id);
              const tripItem = tripDetail.trip_items?.find(ti => ti.item_id === item.id);
              
              if (tripItem) {
                itemTripStatuses.push({
                  tripId: trip.id,
                  tripName: trip.name,
                  status: tripItem.status,
                  tripStatus: trip.status
                });
              }
            }
          }
          
          setTripStatuses(itemTripStatuses);
        } catch (error) {
          console.error('Failed to fetch trip statuses:', error);
        }
      } catch (error) {
        console.error('Failed to fetch item:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItemData();
  }, []);

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

  const hasLostStatus = tripStatuses.some(ts => ts.status === 'lost');
  const hasNotFoundStatus = tripStatuses.some(ts => ts.status === 'not_found');
  const canEdit = !hasLostStatus; // Can edit if not lost (not_found items can be edited)

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await itemService.deleteItem(item.id);
              Alert.alert('Success', 'Item deleted successfully');
              navigation.navigate('Home');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsFound = async () => {
    // Navigate to scanner to verify the item
    navigation.navigate('Scanner', {
      onScan: async (scannedQrCode) => {
        // Verify the scanned QR matches this item
        if (scannedQrCode !== item.qr_code_id) {
          Alert.alert(
            'Wrong Item',
            `You scanned "${scannedQrCode}" but expected "${item.qr_code_id}". Please scan the correct item.`
          );
          return;
        }

        // Confirm before updating
        Alert.alert(
          'Mark as Found',
          'This will mark the item as returned in all trips where it was not found. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Mark as Found',
              onPress: async () => {
                try {
                  // Update all trips where this item is marked as not_found
                  for (const tripStatus of tripStatuses) {
                    if (tripStatus.status === 'not_found') {
                      await tripService.markItemReturned(
                        tripStatus.tripId,
                        item.id,
                        'Item was found',
                        'returned',
                        scannedQrCode
                      );
                    }
                  }
                  Alert.alert('Success', 'Item marked as found in all trips');
                  // Refresh the screen
                  navigation.replace('ItemDetail', { item });
                } catch (error) {
                  const errorMessage = error.response?.data?.error?.message || 'Failed to update item status';
                  Alert.alert('Error', errorMessage);
                  console.error('Mark as found error:', error);
                }
              },
            },
          ]
        );
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.qrCode}>QR: {item.qr_code_id}</Text>
        <Text style={styles.title}>{item.name}</Text>
        
        {item.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}

        {item.categories && item.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesContainer}>
              {item.categories.map((category) => (
                <View key={category.id} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{category.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {item.images && item.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Images ({item.images.length})</Text>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
              {item.images.map((image) => {
                // Handle both Cloudinary URLs and legacy local URLs
                const imageUrl = image.image_url.startsWith('http') 
                  ? image.image_url 
                  : `${API_CONFIG.BASE_URL.replace('/api/v1', '')}${image.image_url}`;
                console.log('Loading image:', imageUrl);
                return (
                  <Image
                    key={image.id}
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                    onLoad={() => console.log('Image loaded successfully:', imageUrl)}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {tripStatuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Status</Text>
            {tripStatuses.map((tripStatus, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tripStatusCard}
                onPress={() => navigation.navigate('TripDetail', { tripId: tripStatus.tripId })}
              >
                <View style={styles.tripStatusHeader}>
                  <Text style={styles.tripStatusName}>{tripStatus.tripName}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(tripStatus.status) }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {tripStatus.status.toUpperCase().replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.tripStatusSubtext}>
                  Trip Status: {tripStatus.tripStatus}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.metadataText}>
            Updated: {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {hasLostStatus && (
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            This item is marked as LOST in one or more trips. Editing is disabled.
          </Text>
        </View>
      )}

      {hasNotFoundStatus && !hasLostStatus && (
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            This item is marked as NOT FOUND in one or more trips.
          </Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        {/* Edit Button - Only show if not lost */}
        {canEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddItem', { item, isEdit: true })}
          >
            <Text style={styles.actionButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
        )}

        {/* Mark as Found Button - Only for not_found items (admin) */}
        {hasNotFoundStatus && isAdmin() && (
          <TouchableOpacity
            style={[styles.actionButton, styles.foundButton]}
            onPress={handleMarkAsFound}
          >
            <Text style={styles.actionButtonText}>✓ Mark as Found</Text>
          </TouchableOpacity>
        )}

        {/* Delete Button - Always show */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.actionButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 15,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: '500',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: 10,
  },
  metadata: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#558b2f',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tripStatusCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  tripStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripStatusName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  tripStatusSubtext: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#d84315',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '500',
  },
  foundButton: {
    backgroundColor: '#4caf50',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    marginBottom: 10,
    backgroundColor: '#558b2f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
