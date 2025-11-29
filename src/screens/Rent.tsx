import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BikeCard, { BikeItem } from '../components/BikeCard';

const rentBikes: BikeItem[] = [
  {
    id: 'r1',
    name: 'Scooter Rental',
    price: 50,
    location: 'Mumbai, India',
    image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'r2',
    name: 'City Bike Rental',
    price: 75,
    location: 'Pune, India',
    image: 'https://images.unsplash.com/photo-1558980664-1dbaf72c24c5?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'r3',
    name: 'Premium Bike Rental',
    price: 150,
    location: 'Bengaluru, India',
    image: 'https://images.unsplash.com/photo-1613364429202-8185c64cbea8?q=80&w=1200&auto=format&fit=crop',
  },
];

export default function Rent() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rent Bikes</Text>
        <Text style={styles.subtitle}>Find bikes available for rent</Text>
      </View>
      <FlatList
        data={rentBikes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BikeCard
            item={item}
            onPress={() => navigation.navigate('BikeDetails', { bikeId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  list: {
    padding: 16,
  },
});

