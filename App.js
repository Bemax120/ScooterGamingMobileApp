<<<<<<< Updated upstream
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import MotorcycleListScreen from './components/MotorcycleListScreen';
import MotorcycleFavoritesScreen from './components/MotorcycleFavoritesScreen';
import MotorcycleBookScreen from './components/MotorcycleBookScreen';
import ProfilePage from './components/ProfilePage';
import DashboardScreen from './components/DashboardScreen';
import MotorcycleDetailScreen from './components/MotorcycleDetailScreen';
import DateTimePickerScreen from './components/DateTimePickerScreen';
import PaymentScreen from './components/PaymentScreen';
import PaymentDetailsScreen from './components/PaymentDetailsScreen';
import PaymentSuccessScreen from './components/PaymentSuccessScreen';
import InquireScreen from './components/InquireScreen';
import BookingDetailScreen from './components/BookingDetailScreen';
import ChatScreen from './components/ChatScreen';
import EnhancedFilterScreen from './components/EnhancedFilterScreen';
=======
import React, { useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import MotorcycleListScreen from "./components/MotorcycleListScreen";
import MotorcycleFavoritesScreen from "./components/MotorcycleFavoritesScreen";
import MotorcycleBookScreen from "./components/MotorcycleBookScreen";
import ProfilePage from "./components/ProfilePage";
import DashboardScreen from "./components/DashboardScreen";
import ConfirmBookingScreen from "./components/ConfirmBookingScreen";
import DateTimePickerScreen from "./components/DateTimePickerScreen";
import PaymentScreen from "./components/PaymentScreen";
import PaymentDetailsScreen from "./components/PaymentDetailsScreen";
import PaymentSuccessScreen from "./components/PaymentSuccessScreen";
import InquireScreen from "./components/InquireScreen";
import ChatScreen from "./components/ChatScreen";
import EnhancedFilterScreen from "./components/EnhancedFilterScreen";
import RatingScreen from "./components/RatingScreen";
import MapPinScreen from "./components/MapPinScreen";
import MapBusinessScreen from "./components/MapBusinessScreen";
import VehicleDetailScreen from "./components/VehicleDetailScreen";
import LandingScreen from "./components/LandingScreen";
import { useFonts } from "expo-font";
import "react-native-get-random-values";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";
import { LogBox } from "react-native";
import FilterScreen from "./components/FilterScreen";
import MessagesListScreen from "./components/MessagesListScreen";
LogBox.ignoreAllLogs(); // temporarily if needed
>>>>>>> Stashed changes

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
<<<<<<< Updated upstream
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Favorite') {
            iconName = 'heart';
          } else if (route.name === 'Book') {
            iconName = 'book';
          } else if (route.name === 'Account') {
            iconName = 'person';
=======
          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Messages") {
            iconName = "chatbubble";
          } else if (route.name === "Favorite") {
            iconName = "heart";
          } else if (route.name === "Book") {
            iconName = "book";
          } else if (route.name === "Account") {
            iconName = "person";
>>>>>>> Stashed changes
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'red',
        tabBarInactiveTintColor: 'gray',
      })}
    >
<<<<<<< Updated upstream
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Favorite" component={MotorcycleFavoritesScreen} />
      <Tab.Screen name="Book" component={MotorcycleBookScreen} />
      <Tab.Screen name="Account" component={ProfilePage} />
=======
      <Tab.Screen
        name="Home"
        options={{ headerShown: false }}
        initialParams={{ filters, dashboardFilters }}
        component={DashboardScreen}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesListScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen
        options={{ headerShown: false }}
        initialParams={{ filters, dashboardFilters }}
        name="Favorite"
        component={MotorcycleFavoritesScreen}
      />
      <Tab.Screen
        options={{ headerShown: false }}
        initialParams={{ filters, dashboardFilters }}
        name="Book"
        component={MotorcycleBookScreen}
      />
      <Tab.Screen
        options={{ headerShown: false }}
        initialParams={{ filters, dashboardFilters }}
        name="Account"
        component={ProfilePage}
      />
>>>>>>> Stashed changes
    </Tab.Navigator>
  );
}

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Filter" component={EnhancedFilterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
        <Stack.Screen name="MotorcycleList" component={MotorcycleListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MotorcycleDetail" component={MotorcycleDetailScreen} />
        <Stack.Screen name="DateTimePicker" component={DateTimePickerScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="PaymentDetails" component={PaymentDetailsScreen} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <Stack.Screen name="Inquire" component={InquireScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
