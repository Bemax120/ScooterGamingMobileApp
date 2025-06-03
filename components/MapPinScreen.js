import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import debounce from "lodash.debounce"; 
import { MapContext } from "../context/MapContext";

const screen = Dimensions.get("window");

const MapPinScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const { vehicleType, startDate, endDate, pickUpTime, returnTime } = route.params || {};

  const [centerLocation, setCenterLocation] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef(null);
  const initialLocationRef = useRef(null);

  const { initialLocation, setInitialLocation, address, setAddress } = useContext(MapContext);
  const [location, setLocation] = useState(initialLocation);

  useFocusEffect(
    useCallback(() => {
      const fetchAndCenterLocation = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission denied to access location");
            return;
          }

          const currentLocation = await Location.getCurrentPositionAsync({});
          const region = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          // Update all references and state
          setInitialLocation(region);
          initialLocationRef.current = region;
          setLocation(region);
          setCenterLocation({ latitude: region.latitude, longitude: region.longitude });

          // Center the map
          if (mapRef.current) {
            mapRef.current.animateToRegion(region, 1000);
          }

          fetchAddress(region.latitude, region.longitude);
        } catch (err) {
          console.error("Error fetching current location:", err);
        }
      };

      fetchAndCenterLocation();
    }, [])
  );

  const fetchAddress = useCallback(
    debounce(async (latitude, longitude) => {
      try {
        setLoadingAddress(true);
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const formatted = `${geo?.name || ""} ${geo?.street || ""}, ${geo?.city || ""}, ${geo?.region || ""}`;
        setAddress(formatted);
      } catch (err) {
        console.error("Failed to get address:", err);
        setAddress("Unable to retrieve address");
      } finally {
        setLoadingAddress(false);
      }
    }, 800),
    []
  );

  const goToCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied to access location");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }

      setCenterLocation({ latitude: region.latitude, longitude: region.longitude });
      fetchAddress(region.latitude, region.longitude);
    } catch (err) {
      console.error("Error getting current location", err);
    } finally {
      setLocating(false);
    }
  };




  const handleRegionChangeComplete = (region) => {
    const coords = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
    setCenterLocation(coords);
    fetchAddress(coords.latitude, coords.longitude);
  };

  const handleConfirmLocation = () => {
    if (centerLocation) {
      navigation.navigate("Filter", {
        locationFilter: centerLocation,
        locationAddress: address,
        vehicleType,
        startDate,
        endDate,
        pickUpTime,
        returnTime,
      });
    } else {
      Alert.alert("Location not selected");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Search for a location..."
          fetchDetails={true}
          onPress={(data, details = null) => {
            const newRegion = {
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setLocation(newRegion);
            setCenterLocation({
              latitude: newRegion.latitude,
              longitude: newRegion.longitude,
            });
            if (mapRef.current) {
              mapRef.current.animateToRegion(newRegion, 1000);
            }
            fetchAddress(newRegion.latitude, newRegion.longitude);
          }}
          query={{
            key: "AIzaSyDuMcil6MODKv7AVdkY2AXM4X-uWsyIZO0",
            language: "en",
            components: "country:ph",
          }}
          styles={{
            textInputContainer: {
              backgroundColor: "white",
              borderRadius: 8,
              width: "100%",
            },
            textInput: {
              height: 44,
              color: "#5d5d5d",
              fontSize: 16,
            },
            listView: {
              backgroundColor: "white",
              borderRadius: 8,
              marginTop: 8,
              elevation: 3,
            },
          }}
          debounce={300}
          enablePoweredByContainer={false}
        />
      </View>

      {location ? (
        <MapView
          ref={mapRef}
          style={{ flex: 1   }}
          initialRegion={location}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={() => setMapReady(true)}
          showsUserLocation
          showsMyLocationButton={false}
        />
      ) : (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#000" />
      )}


      <View style={styles.markerFixed}>
        <Image source={require("../assets/location.png")} style={{ width: 40, height: 40 }} />
      </View>

      <View style={styles.currentLocationWrapper}>
          <TouchableOpacity onPress={goToCurrentLocation} style={styles.currentLocationButton}>
            <Image
              source={require('../assets/gps-icon.png')} // use your own icon
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

      <View style={styles.addressContainer}>
        {loadingAddress ? (
          <ActivityIndicator color="#FCFBF4" size="small" />
        ) : (
          <Text style={styles.addressText}>
            {address || "Move the map to select a location"}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
        <Text style={styles.confirmButtonText}>Confirm Location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  currentLocationWrapper: {
    position: 'absolute',
    bottom: 140, // adjust as needed
    right: 20,
    zIndex: 10,
  },
  currentLocationButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  searchContainer: {
    position: 'absolute',
    width: '90%',
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    padding: 8,
    borderRadius: 8,
    top: 10,
    alignSelf: 'center',
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginTop: 5,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  
  textInput: {
    fontSize: 16,
  },
  
  searchContainer: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    zIndex: 999,
  },
  markerFixed: {
    position: "absolute",
    top: screen.height / 2 - 40,
    left: screen.width / 2 - 20,
    zIndex: 999,
  },
  addressContainer: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  addressText: {
    fontSize: 14,
    textAlign: "center",
  },
  confirmButton: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default MapPinScreen;
