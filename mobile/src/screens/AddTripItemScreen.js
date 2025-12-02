import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import tripService from '../services/tripService';
import itemService from '../services/itemService';

export default function AddTripItemScreen({ route, navigation }) {
  const { tripId } = route.params;
  const [qrCodeId, setQrCodeId] = useState('');
  const [itemId, setItemId] = useState('');
  const [itemDetails, setItemDetails] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingItem, setFetchingItem] = useState(false);

  // Fetch item details when QR code or item ID changes
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!qrCodeId.trim() && !itemId.trim()) {
        setItemDetails(null);
        return;
      }

      try {
        setFetchingItem(true);
        let result;
        
        if (qrCodeId.trim()) {
          result = await itemService.getItemByQrCode(qrCodeId.trim());
        } else if (itemId.trim()) {
          result = await itemService.getItemById(itemId.trim());
        }

        if (result && result.success) {
          const itemData = result.data;
          
          // Check if item is already in this trip
          try {
            const tripItems = await tripService.getTripItems(tripId);
            const alreadyInTrip = tripItems.trip_items?.some(
              ti => ti.item_id === itemData.id
            );
            
            if (alreadyInTrip) {
              itemData.alreadyInTrip = true;
            }
          } catch (error) {
            console.error('Error checking if item in trip:', error);
          }
          
          setItemDetails(itemData);
          
          // Auto-populate item ID if we got it from QR code
          if (qrCodeId.trim() && itemData.id) {
            setItemId(itemData.id);
          }
        } else {
          setItemDetails(null);
          if (qrCodeId.trim()) {
            Alert.alert('Item Not Found', `No item found with QR code: ${qrCodeId}`);
          }
        }
      } catch (error) {
        console.error('Error fetching item details:', error);
        setItemDetails(null);
      } finally {
        setFetchingItem(false);
      }
    };

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(fetchItemDetails, 500);
    return () => clearTimeout(timeoutId);
  }, [qrCodeId, itemId, tripId]);

  const handleAddItem = async () => {
    if (!qrCodeId.trim() && !itemId.trim()) {
      Alert.alert('Error', 'Please enter either QR Code ID or Item ID');
      return;
    }

    if (!itemDetails) {
      Alert.alert('Error', 'Item not found. Please check the QR code or Item ID.');
      return;
    }

    try {
      setLoading(true);
      const itemData = {
        qr_code_id: qrCodeId.trim() || undefined,
        item_id: itemId.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await tripService.addItemToTrip(tripId, itemData);
      Alert.alert('Success', 'Item added to trip successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      // Handle specific error codes
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = error.response?.data?.error?.message;
      
      if (errorCode === 'ITEM_ALREADY_IN_TRIP') {
        const itemName = error.response?.data?.error?.item?.name || 'This item';
        Alert.alert(
          'Item Already Added',
          `${itemName} is already in this trip. You can view it in the trip items list.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (errorCode === 'ITEM_NOT_FOUND') {
        Alert.alert('Item Not Found', 'The item could not be found. Please check the QR code or Item ID.');
      } else {
        Alert.alert('Error', errorMessage || 'Failed to add item to trip');
      }
      
      console.error('Add item to trip error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    navigation.navigate('Scanner', {
      onScan: (scannedQR) => {
        setQrCodeId(scannedQR);
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.infoText}>
          Add an item to this trip by scanning its QR code or entering its ID
        </Text>

        <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
          <Text style={styles.scanButtonText}>📷 Scan QR Code</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.label}>QR Code ID</Text>
        <TextInput
          style={styles.input}
          value={qrCodeId}
          onChangeText={setQrCodeId}
          placeholder="Enter QR code (e.g., GEAR-001)"
          placeholderTextColor="#999"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Item ID (UUID)</Text>
        <TextInput
          style={[styles.input, itemDetails && styles.inputDisabled]}
          value={itemId}
          onChangeText={setItemId}
          placeholder="Enter item UUID"
          placeholderTextColor="#999"
          autoCapitalize="none"
          editable={!itemDetails}
        />

        {fetchingItem && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2e7d32" />
            <Text style={styles.loadingText}>Fetching item details...</Text>
          </View>
        )}

        {itemDetails && (
          <View style={[
            styles.itemPreview,
            itemDetails.alreadyInTrip && styles.itemPreviewWarning
          ]}>
            {itemDetails.alreadyInTrip && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  This item is already in this trip
                </Text>
              </View>
            )}
            <Text style={styles.previewTitle}>Item Details</Text>
            {itemDetails.images && itemDetails.images.length > 0 && (
              <Image
                source={{ uri: itemDetails.images[0].image_url }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{itemDetails.name}</Text>
              {itemDetails.description && (
                <Text style={styles.itemDescription}>{itemDetails.description}</Text>
              )}
              <View style={styles.itemMeta}>
                <Text style={styles.metaText}>QR: {itemDetails.qr_code_id}</Text>
                {itemDetails.categories && itemDetails.categories.length > 0 && (
                  <Text style={styles.metaText}>
                    📁 {itemDetails.categories.map(c => c.name).join(', ')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes about the item condition..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.addButton,
            (loading || itemDetails?.alreadyInTrip) && styles.disabledButton
          ]}
          onPress={handleAddItem}
          disabled={loading || itemDetails?.alreadyInTrip}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>
              {itemDetails?.alreadyInTrip ? 'Item Already in Trip' : 'Add Item to Trip'}
            </Text>
          )}
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
  form: {
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
  },
  addButton: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  itemPreview: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  itemPreviewWarning: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 10,
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemInfo: {
    gap: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  itemMeta: {
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
});
