import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Rent() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={{ width: 28 }} />

        <Image
          source={require("../../assets/logo3.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={{ width: 28 }} />
      </View>

      <View style={styles.centerWrapper}>
        
        <TouchableOpacity
          style={styles.block}
          onPress={() => navigation.navigate("RentABike")}
        >
          <ImageBackground
            source={require("../../assets/rab.png")}
            style={styles.image}
            imageStyle={{ opacity: 0.7 }}
          >
            <Text style={styles.mainTitle}>Rent a Bike</Text>
            <Text style={styles.subTitle}>
              Find and rent motorcycles near you
            </Text>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.block}
          onPress={() => navigation.navigate("RentYourBike")}
        >
          <ImageBackground
            source={require("../../assets/ryb.png")}
            style={styles.image}
            imageStyle={{ opacity: 0.7 }}
          >
            <Text style={styles.mainTitle}>Rent Your Bike</Text>
            <Text style={styles.subTitle}>
              List your motorcycle for rental
            </Text>
          </ImageBackground>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  header: {
    backgroundColor: "#e53935",
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  logo: {
    width: 120,
    height: 50,
  },

  centerWrapper: { flex: 1 },

  block: {
    height: "50%",
    width: "100%",
    overflow: "hidden",
  },

  image: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  mainTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },

  subTitle: {
    color: "#eee",
    fontSize: 15,
    marginTop: 6,
    textAlign: "center",
  },
});
