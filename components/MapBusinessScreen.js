import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import * as Location from "expo-location";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import MapView from "react-native-maps";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { MapContext } from "../context/MapContext";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";


const screen = Dimensions.get("window");

const MapBusinessScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const debounceTimeout = useRef(null);

  //marker item click
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessImages, setBusinessImages] = useState([]);




  // Context
  const { initialLocation, setInitialLocation, address, setAddress } = useContext(MapContext);

  // State
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);
  const [centerLocation, setCenterLocation] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [userMarkers, setUserMarkers] = useState([]);
  const [markerPositions, setMarkerPositions] = useState({});
  const [searchText, setSearchText] = useState("");

  const filters = route?.params?.filters || {};
  const vehicleType = route.params?.vehicleType || null;
  const startDate = route.params?.startDate;
  const endDate = route.params?.endDate;
  const pickUpTime = route.params?.pickUpTime;
  const returnTime = route.params?.returnTime;
  const currentScreen = route.params?.screen;

  useEffect(() => {
    const fetchBusinessImages = async () => {
      if (!selectedBusiness?.id) return;

      try {
        const vehiclesRef = collection(db, "vehicles");
        const q = query(vehiclesRef, where("ownerId", "==", selectedBusiness.id));
        const snapshot = await getDocs(q);

        const images = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setBusinessImages(images);
      } catch (err) {
        console.error("Failed to fetch business images:", err);
        setBusinessImages([]);
      }
    };

    fetchBusinessImages();
  }, [selectedBusiness]);


  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      setCenterLocation({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      });
      return;
    }

    (async () => {
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

      setInitialLocation(region);
      setLocation(region);
      setCenterLocation({ latitude: region.latitude, longitude: region.longitude });
      fetchAddress(region.latitude, region.longitude);
    })();
  }, []);

  useEffect(() => {
    if (!searchText.trim()) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      handleManualSearch();
    }, 1000);
  }, [searchText]);

  useEffect(() => {
    const fetchUsersWithLocations = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersWithLocation = usersSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (user) =>
            user.businessCoordinates &&
            user.businessProfile &&
            user.businessAddress
        );
      setUserMarkers(usersWithLocation);
    };
    fetchUsersWithLocations();
  }, []);

  const updateMarkerPositions = async () => {
    if (!mapRef.current || !userMarkers.length) return;
    const newPositions = {};
    for (let user of userMarkers) {
      try {
        const screenPoint = await mapRef.current.pointForCoordinate({
          latitude: user.businessCoordinates.latitude,
          longitude: user.businessCoordinates.longitude,
        });
        newPositions[user.id] = screenPoint;
      } catch { }
    }
    setMarkerPositions(newPositions);
  };

  const fetchAddress = async (latitude, longitude) => {
    try {
      setLoadingAddress(true);
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const formatted = `${geo?.name || ""} ${geo?.street || ""}, ${geo?.city || ""
        }, ${geo?.region || ""}`;
      setAddress(formatted);
    } catch (err) {
      console.error("Failed to get address:", err);
      setAddress("Unable to retrieve address");
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleRegionChangeComplete = (region) => {
    const coords = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
    setCenterLocation(coords);
    setInitialLocation(region);
    fetchAddress(coords.latitude, coords.longitude);
    updateMarkerPositions();
  };

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
      setInitialLocation(region);
      fetchAddress(region.latitude, region.longitude);
    } catch (err) {
      console.error("Error getting current location", err);
    } finally {
      setLocating(false);
    }
  };

  const handleManualSearch = async () => {
    if (!searchText.trim()) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchText
        )}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "Availio/1.0 (kennethrex456@gmail.com)",
            "Accept-Language": "en",
          },
        }
      );

      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        const newRegion = {
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setLocation(newRegion);
        setCenterLocation({ latitude: lat, longitude: lon });
        setInitialLocation(newRegion);

        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }

        fetchAddress(lat, lon);
        updateMarkerPositions();
      } else {
        Alert.alert("Location not found", "Try a more specific query.");
      }
    } catch (error) {
      console.error("Nominatim search failed:", error);
      Alert.alert("Search error", "Something went wrong while searching.");
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

      <View style={[
        styles.currentLocationWrapper,
        { bottom: selectedBusiness ? 315 : 10 }
      ]}>
        <TouchableOpacity onPress={goToCurrentLocation} style={styles.currentLocationButton}>
          <Image
            source={require("../assets/gps-icon.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {location && (
        <>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={location}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            onMapReady={updateMarkerPositions}
            showsMyLocationButton={false}
          />

          {userMarkers.map((user) => {
            const pos = markerPositions[user.id];
            if (!pos) return null;
            return (
              <TouchableOpacity
                key={user.id}
                style={{
                  position: "absolute",
                  left: pos.x - 20,
                  top: pos.y - 50,
                  alignItems: "center",
                }}
                onPress={() => setSelectedBusiness(user)}
                activeOpacity={0.8}
              >
                <View style={styles.markerLabel}>
                  <Text style={styles.markerText} numberOfLines={1}>
                    {user.businessName}
                  </Text>
                </View>
                <View style={styles.markerImageWrapper}>
                  <Image
                    source={{ uri: user.businessProfile }}
                    style={styles.markerImage}
                  />
                </View>
              </TouchableOpacity>
            );
          })}

          {selectedBusiness && (
            <View style={styles.businessCard}>
              <TouchableOpacity onPress={() => setSelectedBusiness(null)} style={styles.closeButton}>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>×</Text>
              </TouchableOpacity>

              {/* Vehicle Images (horizontal list) */}
              {businessImages.length > 0 && (
                <View style={styles.imageListContainer}>
                  <FlatList
                    data={businessImages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: item.defaultImg }}
                        style={styles.vehicleImage}
                        resizeMode="cover"
                      />
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}

              {/* Circular Business Profile Image (Overlay) */}
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: selectedBusiness.businessProfile }}
                  style={styles.businessProfileImage}
                  resizeMode="cover"
                />
              </View>

              {/* Business Info */}
              <Text style={styles.businessName}>{selectedBusiness.businessName}</Text>
              <Text style={styles.businessAddress}>{selectedBusiness.businessAddress}</Text>
            </View>
          )}

        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageListContainer: {
    position: 'relative',
    height: 170,
    marginVertical: 10,
  },
  businessCard: {
    position: "absolute",
    bottom: 6,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingBottom: 15,
    paddingTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
    overflow: "hidden",
  },

  vehicleImage: {
    width: 340,
    height: 170,
    borderRadius: 8,
    margin: 5,
  },

  profileImageContainer: {
    position: "absolute",
    top: 160, // aligns just below the vehicle image
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 40,
    padding: 3,
    elevation: 4,
  },

  businessProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  businessName: {
    marginTop: 40,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  businessAddress: {
    marginTop: 10,
    fontSize: 10,
    textAlign: "center",
    left: 10,
    marginRight: 10,
  },

  closeButton: {
    position: "absolute",
    top: 8,
    right: 10,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    elevation: 3,
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

  searchContainer: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  searchBox: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    elevation: 3,
  },
  textInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
  },

  currentLocationWrapper: {
    position: "absolute",
    right: 10,
    zIndex: 10,
  },
  currentLocationButton: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  markerLabel: {
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
    elevation: 3,
  },
  markerText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#e32d2d",
    maxWidth: 120,
  },
  markerImageWrapper: {
    backgroundColor: "#e32d2d",
    padding: 2,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ccc",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default MapBusinessScreen;
