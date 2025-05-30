import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { Timestamp, addDoc, doc, setDoc, collection } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import axios from "axios";
import { Linking } from "react-native";

const { width } = Dimensions.get("window");

export default function ConfirmBooking({ route, navigation }) {
  const { motorcycle, startDate, endDate, pickUpTime, returnTime, methodType } =
    route.params;
  const auth = getAuth();

  const filters = route?.params?.filters || {};

  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const parseAMPMToDate = (dateStr, timeStr) => {
    const [hoursMinutes, meridian] = timeStr.split(" ");
    let [hours, minutes] = hoursMinutes.split(":").map(Number);

    if (meridian === "PM" && hours !== 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;

    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const price = diffDays * Number(motorcycle.pricePerDay);
      setTotalPrice(price);
    }
  }, [startDate, endDate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
    });
  };

  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);

  const handleConfirmBooking = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to book.");
      return;
    }

    const userId = auth.currentUser.uid;

    try {
      const parsedPickup = parseAMPMToDate(startDate, pickUpTime);
      const parsedReturn = parseAMPMToDate(endDate, returnTime);

      const bookingData = {
        createdAt: Timestamp.now(),
        pickupDate: Timestamp.fromDate(parsedPickup),
        returnDate: Timestamp.fromDate(parsedReturn),
        renterId: userId,
        totalPrice,
        vehicleId: motorcycle.id,
        bookingStatus: "Pending",
        rated: false,
        mop: "On-Hand",
      };

      setLoading(true);

      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);
      const bookingId = bookingRef.id;

      const userBookingRef = doc(db, "users", userId, "myBooking", bookingId);
      await setDoc(userBookingRef, { bookingId });

      setLoading(false);
      Alert.alert("Success", "Booking confirmed!");
      console.log("Confirm:", filters);
      navigation.navigate("Inquire", {
        filters,
        bookingId,
        totalPrice,
        motorcycle,
      });
    } catch (error) {
      console.error("ConfirmBooking Error:", error);
      setLoading(false);
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  const handleOnlinePay = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to proceed.");
      return;
    }

    setLoading(true);

    const user = auth.currentUser;

    const parsedPickup = parseAMPMToDate(startDate, pickUpTime);
    const parsedReturn = parseAMPMToDate(endDate, returnTime);

    const bookingData = {
      createdAt: Timestamp.now(),
      pickupDate: Timestamp.fromDate(parsedPickup),
      returnDate: Timestamp.fromDate(parsedReturn),
      renterId: user.uid,
      totalPrice,
      vehicleId: motorcycle.id,
      bookingStatus: "Pending",
      rated: false,
      mop: "Online",
    };

    const bookingRef = await addDoc(collection(db, "bookings"), bookingData);
    const bookingId = bookingRef.id;

    const userBookingRef = doc(db, "users", user.uid, "myBooking", bookingId);
    await setDoc(userBookingRef, { bookingId });

    const bookingDetails = {
      motorcycleName: motorcycle.name,
      motorcycleId: motorcycle.id,
      startDate,
      endDate,
      bookingId: bookingId,
    };

    try {
      setLoading(true);
      const response = await axios.post(
        "https://scootergaming.vercel.app/api/checkout",
        {
          totalPrice,
          user: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            phoneNumber: user.phoneNumber,
          },
          bookingDetails,
        }
      );

      const checkoutUrl = response.data?.data?.attributes?.checkout_url;

      if (checkoutUrl) {
        Linking.openURL(checkoutUrl);
      } else {
        Alert.alert(
          "Error",
          "Unable to start online payment. Please try again."
        );
      }

      setLoading(false);
      Alert.alert("Success", "Booking confirmed!");
      navigation.navigate("Inquire", {
        filters,
        bookingId,
        totalPrice,
        motorcycle,
      });
    } catch (error) {
      console.error("OnlinePay Error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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

      <View style={{ padding: 20 }}>
        <Text style={styles.title}>Confirm Booking</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            <Text style={styles.label}>Motorcycle: </Text>
            {motorcycle.name} - {motorcycle.brand}
          </Text>
          <Text style={styles.summaryText}>
            <Text style={styles.label}>From: </Text>
            {formattedStart} at {pickUpTime}
          </Text>
          <Text style={styles.summaryText}>
            <Text style={styles.label}>To: </Text>
            {formattedEnd} at {returnTime}
          </Text>

          <Text style={styles.totalPriceText}>Total: ₱{totalPrice}</Text>
        </View>

        <TouchableOpacity style={styles.onlineButton} onPress={handleOnlinePay}>
          <Text style={styles.onlinebtnText}>Pay Online</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleConfirmBooking}>
          <Text style={styles.buttonText}>Pay On Hand</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modal}>
          <ActivityIndicator size="large" color="#D70040" />
          <Text style={{ color: "white", marginTop: 10 }}>
            Saving your booking...
          </Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#FCFBF4",
  },

  imageCarousel: {
    backgroundColor: "#f2f2f2",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    elevation: 4,
  },

  image: {
    width: width,
    height: 260,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1c1c1e",
    marginBottom: 10,
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },

  summaryText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },

  label: {
    fontWeight: "bold",
    color: "#1c1c1e",
  },

  totalPriceText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#D70040",
  },

  onlineButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    borderRadius: 5,
  },

  button: {
    backgroundColor: "#EF0000",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },

  onlinebtnText: {
    color: "#EF0000",
    fontWeight: "600",
    fontSize: 16,
  },

  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
