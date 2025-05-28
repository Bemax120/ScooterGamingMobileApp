import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { auth, db } from '../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';

export default function MessagesListScreen({ navigation }) {
  const [threads, setThreads]     = useState([]);
  const [profiles, setProfiles]   = useState({});
  const [loading, setLoading]     = useState(true);
  const uid = auth.currentUser?.uid;

  // 1) Subscribe to your conversations
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageTime', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setThreads(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  // 2) Fetch missing user profiles
  useEffect(() => {
    const otherIds = Array.from(
      new Set(
        threads
          .flatMap(t => t.participants)
          .filter(id => id !== uid)
      )
    );
    otherIds.forEach(async otherId => {
      if (!profiles[otherId]) {
        const docSnap = await getDoc(doc(db, 'users', otherId));
        if (docSnap.exists()) {
          setProfiles(p => ({ ...p, [otherId]: docSnap.data() }));
        } else {
          setProfiles(p => ({ ...p, [otherId]: { firstName: 'Unknown', lastName: '' } }));
        }
      }
    });
  }, [threads, profiles, uid]);

  // 3) Render each thread as a card
  const renderItem = ({ item }) => {
    const otherId = item.participants.find(i => i !== uid);
    const user   = profiles[otherId] || {};
    const fullName = user.firstName
      ? `${user.firstName} ${user.lastName}`
      : otherId;
    const initial = fullName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.threadCard}
        onPress={() =>
          navigation.navigate('Chat', {
            otherUserId:  otherId,
            businessName: fullName,
          })
        }
      >
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.threadTitle}>{fullName}</Text>
          <Text style={styles.threadLastMessage} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#4b6584" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Messages</Text>
      <FlatList
        data={threads}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={threads.length ? null : styles.empty}
        ListEmptyComponent={
          <Text style={styles.emptyText}>You have no conversations.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F5' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    fontSize: 24,
    fontWeight: '700',
    margin: 16,
    color: '#333',
  },
  threadCard: {
    flexDirection: 'row',
    alignItems:    'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical:   8,
    padding:         12,
    borderRadius:    8,
    // Android shadow
    elevation: 2,
    // iOS shadow
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 1 },
    shadowOpacity:  0.1,
    shadowRadius:   2,
  },
  avatar: {
    width:  48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width:  48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E3B5B',
    justifyContent:   'center',
    alignItems:       'center',
  },
  initial: {
    fontSize: 20,
    color:    '#fff',
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  threadTitle: {
    fontSize:     16,
    fontWeight:   '600',
    color:        '#222',
  },
  threadLastMessage: {
    fontSize:    14,
    color:       '#666',
    marginTop:   4,
  },
  empty: {
    flex:          1,
    justifyContent:'center',
    alignItems:    'center',
  },
  emptyText: {
    fontSize: 16,
    color:    '#666',
  },
});
