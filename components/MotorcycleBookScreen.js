import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MotorcycleBookScreen = ({ route }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");

  const filters = route?.params?.filters || {};

  const navigation = useNavigation();
  const auth = getAuth();
  const insets = useSafeAreaInsets();

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Login",
            params: {
              filters,
            },
          },
        ],
      });
    }
  }, [auth.currentUser]);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const myBookingRef = collection(db, "users", userId, "myBooking");

    const unsubscribe = onSnapshot(myBookingRef, async (snapshot) => {
      const bookingPromises = snapshot.docs.map(async (docSnap) => {
        const bookingId = docSnap.id;
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) return null;

        const bookingData = bookingSnap.data();

        const vehicleRef = doc(db, "vehicles", bookingData.vehicleId);
        const vehicleSnap = await getDoc(vehicleRef);

        if (!vehicleSnap.exists()) return null;

        const ownerData = vehicleSnap.data();

        const ownerRef = doc(db, "users", ownerData.ownerId);
        const ownerSnap = await getDoc(ownerRef);

        return {
          id: bookingId,
          bike: vehicleSnap.exists()
            ? vehicleSnap.data().name
            : "Unknown Vehicle",
          image: vehicleSnap.exists() ? vehicleSnap.data().defaultImg : null,
          date: formatDateTime(bookingData.createdAt),
          status: bookingData.bookingStatus,
          total: bookingData.totalPrice,
          rated: bookingData.rated,
          businessName: ownerSnap.exists()
            ? ownerSnap.data().businessName
            : null,
          businessProfile: ownerSnap.exists()
            ? ownerSnap.data().businessProfile
            : null,
          businessEmail: ownerSnap.exists()
            ? ownerSnap.data().businessEmail
            : null,
          businessAddress: ownerSnap.exists()
            ? ownerSnap.data().businessAddress
            : null,
          emailVerified: ownerSnap.exists()
            ? ownerSnap.data().businessVerified
            : null,
          contactNumber: ownerSnap.exists()
            ? ownerSnap.data().contactNumber
            : null,
        };
      });

      const resolvedBookings = (await Promise.all(bookingPromises)).filter(
        Boolean
      );
      setBookings(resolvedBookings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, filter]);

  const formatDateTime = (value) => {
    if (!value) return "Invalid date";

    if (value.toDate) {
      value = value.toDate();
    } else {
      value = new Date(value);
    }

    if (isNaN(value)) return "Invalid date";

    return value.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    switch (filter) {
      case "Pending":
        return booking.status === "Confirmed" || booking.status === "Pending";
      case "Complete":
        return booking.status === "Complete";
      case "On-Going":
        return booking.status === "On-Going";
      case "Cancelled":
        return booking.status === "Cancelled";
      default:
        return true;
    }
  });

  const StatusBadge = ({ status }) => {
    let backgroundColor;

    if (status === "Complete") {
      backgroundColor = "#4CD964";
    } else if (status === "Cancelled") {
      backgroundColor = "#FF3B30";
    } else if (status === "On-Going") {
      backgroundColor = "#FFA500";
    } else {
      backgroundColor = "#FFCC00";
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: "#FCFBF4", zIndex: 999 }}>
        <Text style={styles.screenTitle}>My Bookings</Text>
        <View style={styles.segmentScroll}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.segmentContainer}
          >
            {["Pending", "On-Going", "Complete", "Cancelled"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.segmentButton,
                  filter === item && styles.activeSegment,
                ]}
                onPress={() => {
                  setLoading(true);
                  setFilter(item);
                }}
              >
                <Text
                  style={
                    filter === item
                      ? styles.activeSegmentText
                      : styles.segmentText
                  }
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="red" />
        </View>
      ) : !filteredBookings || filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nothing Here Yet</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: 100 },
          ]} // 👈 make sure to keep this
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bikeInfo}>
                  <Ionicons name="calendar" size={20} color="#4b6584" />
                  <Text style={styles.bookingDate}>{item.date}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.bookingContent}>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.bookingImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.bookingDetails}>
                  <Text style={styles.bikeName}>{item.bike}</Text>
                  <Text style={styles.totalText}>Total: ₱ {item.total}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    navigation.navigate("Inquire", {
                      filters,
                      bookingId: item.id,
                      totalPrice: item.total,
                      motorcycle: item,
                    });
                  }}
                >
                  <Text style={styles.secondaryButtonText}>View Details</Text>
                </TouchableOpacity>

                {item.status === "Complete" && !item.rated ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      navigation.navigate("Rating", {
                        filters,
                        bookingId: item.id,
                      });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Rate</Text>
                  </TouchableOpacity>
                ) : item.status === "On-Going" ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      navigation.navigate("Inquire", {
                        filters,

                        bookingId: item.id,
                        totalPrice: item.total,
                        motorcycle: item,
                      });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Extend</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    flexDirection: "column",
    backgroundColor: "#FCFBF4",
    position: "relative",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },

  emptyText: {
    fontSize: 16,
    color: "#aaa",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  segmentScroll: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 999,
    height: 40,
  },

  segmentContainer: {
    paddingHorizontal: 10,
  },

  segmentButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#eee",
    borderRadius: 20,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  activeSegment: {
    backgroundColor: "#EF0000",
  },
  segmentText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  activeSegmentText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    marginTop: 50,
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  bikeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingDate: {
    marginLeft: 8,
    color: "black",
    fontWeight: "600",
  },
  bookingContent: {
    flexDirection: "row",
    marginBottom: 15,
  },
  bookingImage: {
    width: 100,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  imagePlaceholder: {
    width: 100,
    height: 80,
    backgroundColor: "#999",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  placeholderText: {
    color: "white",
    fontSize: 12,
  },
  bookingDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  bikeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  totalText: {
    fontSize: 16,
    color: "#4CD964",
    fontWeight: "600",
  },
  statusText: { color: "white", fontWeight: "600", fontSize: 12 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 15 },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "black",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: "#4b6584",
    fontWeight: "600",
  },
});

export default MotorcycleBookScreen;
