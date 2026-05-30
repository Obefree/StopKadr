import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootStackParamList } from './src/navigation/types';
import ProjectListScreen from './src/screens/ProjectListScreen';
import EditorScreen from './src/screens/EditorScreen';
import PlaybackScreen from './src/screens/PlaybackScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0a0f',
    card: '#0a0a0f',
    primary: '#ffeb3b',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={theme}>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#0a0a0f' },
              headerTintColor: '#fff',
              contentStyle: { backgroundColor: '#0a0a0f' },
            }}
          >
            <Stack.Screen name="Projects" component={ProjectListScreen} options={{ title: 'StopKadr' }} />
            <Stack.Screen name="Editor" component={EditorScreen} options={{ title: 'Съёмка' }} />
            <Stack.Screen
              name="Playback"
              component={PlaybackScreen}
              options={{
                title: 'Предпросмотр',
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
