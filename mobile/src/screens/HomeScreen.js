import { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { downloadAsync, documentDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';

export default function HomeScreen({ navigation }) {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const [exporting, setExporting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      
      // Download PDF from backend
      const fileUri = documentDirectory + `camping-gear-${Date.now()}.pdf`;
      
      const downloadResult = await downloadAsync(
        `${authService.getApiUrl()}/export/pdf`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${await authService.getToken()}`,
          },
        }
      );

      if (downloadResult.status === 200) {
        // Share PDF
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Success', 'PDF saved to device');
        }
      } else {
        throw new Error('Failed to download PDF');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.userBadge}>
        <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>
        {isAdmin() && <Text style={styles.roleText}>🔑 Administrator</Text>}
      </View>

      <Text style={styles.title}>Camping Gear Tracker</Text>
      <Text style={styles.subtitle}>Manage your camping equipment</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={styles.buttonText}>📷 Scan QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('ItemList')}
      >
        <Text style={styles.buttonText}>📋 View All Items</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.tripButton]}
        onPress={() => navigation.navigate('TripList')}
      >
        <Text style={styles.buttonText}>🏕️ Manage Trips</Text>
      </TouchableOpacity>

      {isAdmin() && (
        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Text style={styles.buttonText}>👥 Manage Users</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, styles.exportButton]}
        onPress={handleExportPDF}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>📄 Export to PDF</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Scan a QR code to view item details or register new equipment
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#558b2f',
  },
  tripButton: {
    backgroundColor: '#1976d2',
  },
  adminButton: {
    backgroundColor: '#f57c00',
  },
  exportButton: {
    backgroundColor: '#1976d2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userBadge: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  roleText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  logoutButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    width: '80%',
  },
  infoText: {
    color: '#2e7d32',
    textAlign: 'center',
    fontSize: 14,
  },
});
