import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { Link } from "expo-router";
import { useRouter, Redirect } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";
import { useContext } from "react";
const index = () => {
  const { user, loading } = useContext(AuthContext);
  useEffect(() => {
    if (user) {
      console.log("User is logged in");
    } else {
      console.log("User is not logged in");
    }
  }, []);
  if (loading) {
    // Henüz Firebase’den cevap gelmedi
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  // loading bitti, user durumuna göre yönlendir
  if (user) return <Redirect href="/home" />;
  else return <Redirect href="/login" />;
};

export default index;

const styles = StyleSheet.create({});
