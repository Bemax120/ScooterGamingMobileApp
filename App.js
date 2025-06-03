import React, { useCallback, useEffect, useState } from "react";
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
import { MapProvider } from "./context/MapContext";
LogBox.ignoreAllLogs();
import MessagesListScreen from "./components/MessagesListScreen";
LogBox.ignoreAllLogs(); // temporarily if needed

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
SplashScreen.preventAutoHideAsync();

function HomeTabs({ route }) {
  const filters = route?.params?.filters || null;
  const dashboardFilters = route?.params?.dashboardFilters || null;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Messages":
              iconName = "chatbubble";
              break;
            case "Favorite":
              iconName = "heart";
              break;
            case "Book":
              iconName = "book";
              break;
            case "Account":
              iconName = "person";
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "red",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        initialParams={{ filters, dashboardFilters }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesListScreen}
        options={{ title: "Messages" }}
      />
      <Tab.Screen
        name="Favorite"
        component={MotorcycleFavoritesScreen}
        initialParams={{ filters, dashboardFilters }}
      />
      <Tab.Screen
        name="Book"
        component={MotorcycleBookScreen}
        initialParams={{ filters, dashboardFilters }}
      />
      <Tab.Screen
        name="Account"
        component={ProfilePage}
        initialParams={{ filters, dashboardFilters }}
      />
    </Tab.Navigator>
  );
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) setIsLoggedIn(true);
    };
    checkLogin();
  }, []);

  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("./fonts/Inter-Regular.ttf"),
    "Inter-Semibold": require("./fonts/Inter-Semibold.ttf"),
    "Inter-Bold": require("./fonts/Inter-Bold.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <MapProvider>
      <NavigationContainer onReady={onLayoutRootView}>
        <Stack.Navigator initialRouteName="Filter">

          {/* ✅ Public Screens - Always Available */}
          <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
          <Stack.Screen name="MapPinScreen" component={MapPinScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MapBusinessScreen" component={MapBusinessScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DateTimePicker" component={DateTimePickerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Filter" component={EnhancedFilterScreen} options={{ headerShown: false }} />

          {/* 🔐 Auth Screens - Only when not logged in */}
          {!isLoggedIn && (
            <>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />
                )}
              </Stack.Screen>
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}

          {/* 🔒 Protected Screens - Only when logged in */}
          {isLoggedIn && (
            <>
              <Stack.Screen name="DashboardFilter" component={FilterScreen} options={{ headerShown: false }} />
              <Stack.Screen name="MotorcycleList" component={MotorcycleListScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} options={{ headerShown: false }} />
              <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Rating" component={RatingScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
              <Stack.Screen name="PaymentDetails" component={PaymentDetailsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Inquire" component={InquireScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </MapProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
