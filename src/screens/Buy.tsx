import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BikeCard, { BikeItem } from '../components/BikeCard';

const availableBikes: BikeItem[] = [
  {
    id: '1',
    name: 'Yamaha R15 V4',
    price: 15000,
    location: 'Mumbai, India',
    image: 'https://images.unsplash.com/photo-1542367597-8849eb87c595?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Royal Enfield Classic',
    price: 18000,
    location: 'Pune, India',
    image: 'https://images.unsplash.com/photo-1620095383895-5ec2882b180b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'KTM Duke 390',
    price: 22000,
    location: 'Bengaluru, India',
    image: 'https://images.unsplash.com/photo-1613364429202-8185c64cbea8?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '4',
    name: 'Honda CBR 250R',
    price: 12000,
    location: 'Delhi, India',
    image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '5',
    name: 'Bajaj Pulsar NS200',
    price: 10000,
    location: 'Chennai, India',
    image: 'https://images.unsplash.com/photo-1558980664-1dbaf72c24c5?q=80&w=1200&auto=format&fit=crop',
  },
];

export default function Buy() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buy Bikes</Text>
        <Text style={styles.subtitle}>Browse available bikes for purchase</Text>
      </View>
      <FlatList
        data={availableBikes}
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

