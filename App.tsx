import React from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Provider } from 'react-redux';
import { store } from './src/store/index';

const App: React.FC = () => {
  return (
    <Provider store={store}>
    <AuthProvider>
      <StatusBar barStyle="light-content" />
      <AppNavigator />
    </AuthProvider>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;