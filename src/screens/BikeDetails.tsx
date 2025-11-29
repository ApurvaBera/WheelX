import { RouteProp, useRoute } from '@react-navigation/native';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

type DetailsRoute = RouteProp<{ BikeDetails: { bikeId?: string } }, 'BikeDetails'>;

export default function BikeDetails() {
  const route = useRoute<DetailsRoute>();
  const bike = getBikeDetails(route.params?.bikeId ?? '1');

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Image source={{ uri: bike.image }} style={{ width: '100%', height: 260 }} />
        <View style={{ padding: 16, gap: 12 }}>
          <View>
            <Text style={styles.title}>{bike.name}</Text>
            <Text style={styles.price}>${bike.price.toLocaleString()}</Text>
            <Text style={styles.location}>{bike.location}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}><Text style={styles.muted}>Year</Text><Text>{bike.year}</Text></View>
            <View style={styles.rowBetween}><Text style={styles.muted}>Mileage</Text><Text>{bike.mileage.toLocaleString()} km</Text></View>
          </View>

          <View>
            <Text style={styles.subtitle}>Specifications</Text>
            <View style={styles.card}>
              {Object.entries(bike.specifications).map(([k, v]) => (
                <View style={styles.rowBetween} key={k}>
                  <Text style={styles.muted}>{k}</Text>
                  <Text>{String(v)}</Text>
                </View>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.subtitle}>Description</Text>
            <Text style={styles.paragraph}>{bike.description}</Text>
          </View>

          <View>
            <Text style={styles.subtitle}>Seller</Text>
            <View style={styles.card}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>{bike.seller}</Text>
              <Text style={styles.muted}>{bike.phone}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getBikeDetails(id: string) {
  const bikes: Record<string, any> = {
    '1': {
      id: '1',
      name: 'Yamaha R15 V4',
      price: 15000,
      location: 'Mumbai, India',
      year: 2023,
      mileage: 5000,
      image: 'https://images.unsplash.com/photo-1542367597-8849eb87c595?q=80&w=1200&auto=format&fit=crop',
      description:
        'Well-maintained Yamaha R15 V4 in excellent condition. Single owner, all service records available.',
      seller: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      specifications: {
        engine: '155cc',
        power: '18.6 HP',
        transmission: '6-speed',
        fuel: 'Petrol',
      },
    },
  };
  return bikes[id] || bikes['1'];
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  price: { fontSize: 18, fontWeight: '700', color: '#e53935', marginTop: 4 },
  location: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  paragraph: { color: '#374151', lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  muted: { color: '#6B7280' },
});



