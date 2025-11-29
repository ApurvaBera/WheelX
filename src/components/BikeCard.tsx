import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export interface BikeItem {
  id: string;
  name: string;
  price: number;
  location: string;
  image: string; // remote url
}

export default function BikeCard({ item, onPress }: { item: BikeItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>${item.price.toLocaleString()}</Text>
        <Text style={styles.location}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12,
  },
  image: { width: '100%', height: 160 },
  body: { padding: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '600', color: '#e53935', marginBottom: 2 },
  location: { fontSize: 12, color: '#6B7280' },
});


