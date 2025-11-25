import AppNavigator from './src/navigation/AppNavigator';
import { LogBox } from 'react-native';

// Ignore expected API 404 errors for new items
LogBox.ignoreLogs([
  'API Error: {"message":"Item not found, ready to create"',
]);

// Filter console errors to hide expected 404s
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';
  if (message.includes('Item not found, ready to create')) {
    return; // Suppress this expected error
  }
  originalConsoleError(...args);
};

export default function App() {
  return <AppNavigator />;
}
