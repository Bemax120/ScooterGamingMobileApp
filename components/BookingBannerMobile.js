import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase/firebaseConfig';
import { getActiveBookingsForUser } from '../hooks/bookingService';

const BookingBannerMobile = ({ userId }) => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    let isMounted = true;
    const fetchActive = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const bookings = await getActiveBookingsForUser(userId);
        if (isMounted) {
          setActiveBookings(bookings || []);
        }
      } catch (err) {
        console.warn('BookingBannerMobile: error fetching bookings', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchActive();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading || !activeBookings.length) {
    return null;
  }

  return (
    <View style={styles.bannerContainer}>
      {activeBookings.map((booking) => {
        const start = booking.pickupDate?.toDate
          ? booking.pickupDate.toDate().toLocaleDateString()
          : '';
        const end = booking.returnDate?.toDate
          ? booking.returnDate.toDate().toLocaleDateString()
          : '';
        return (
          <TouchableOpacity
            key={booking.id}
            style={styles.singleBanner}
            onPress={() => navigation.navigate('Bookings')}
          >
            <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
            <Text style={styles.separator}> • </Text>
            <Text style={styles.dateRange}>
              {start} – {end}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#E0F7FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  singleBanner: {
    backgroundColor: '#B2EBF2',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00796B',
  },
  separator: {
    fontSize: 14,
    color: '#004D40',
  },
  dateRange: {
    fontSize: 13,
    color: '#004D40',
  },
});

export default BookingBannerMobile;
