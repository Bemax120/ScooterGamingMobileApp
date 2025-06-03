import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
const { width } = Dimensions.get("window");

const VehicleDetailScreen = ({ route, navigation }) => {
  const filters = route?.params?.filters || {};
  const { motorcycle, startDate, endDate, pickUpTime, returnTime } =
    route.params;
  const auth = getAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageCarousel}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {motorcycle.images &&
            motorcycle.images.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
        </ScrollView>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{motorcycle.name}</Text>
        <Text style={styles.location}>
          <Ionicons name="location-sharp" size={14} color="gray" />{" "}
          {motorcycle.businessAddress}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>₱{motorcycle.pricePerDay} Per Day</Text>
        </View>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            auth.currentUser
              ? navigation.navigate("ConfirmBooking", {
                  filters,
                  motorcycle,
                  startDate,
                  endDate,
                  pickUpTime,
                  returnTime,
                })
              : navigation.navigate("Login", { filters });
          }}
        >
          <Text style={styles.dateButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: "#FCFBF4",
  },
  imageCarousel: {
    backgroundColor: "#eee",
  },
  image: {
    width: width,
    height: 265,
  },
  detailsContainer: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    color: "gray",
    marginBottom: 20,
  },
  addOns: {
    marginBottom: 20,
  },
  addOnsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addOnItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  addOnImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  addOnText: {
    fontSize: 16,
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "red",
  },
  dateButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    borderRadius: 100,
  },
  dateButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default VehicleDetailScreen;
