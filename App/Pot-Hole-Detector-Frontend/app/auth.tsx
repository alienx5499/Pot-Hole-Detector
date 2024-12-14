import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
const { width, height } = Dimensions.get('window');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Animations
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [buttonScale] = useState(new Animated.Value(1));

  const colorAnim = useRef(new Animated.Value(0)).current;

  // Flip animation for the card
  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: isLogin ? 0 : 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }, [isLogin]);

  // Gentle looping gradient animation
  useEffect(() => {
    const loopAnimation = () => {
      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(loopAnimation);
    };
    loopAnimation();
  }, [colorAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const onPressIn = () => {
    Animated.timing(buttonScale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/signin' : '/signup';
      const body = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(`https://pot-hole-detector.onrender.com/api/v1/auth${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        try {
          // Instead of clearing everything, just remove specific keys
          const keysToRemove = [
            'userToken',
            'userName',
            'userEmail',
            'userPhone',
            'userProfilePicture',
            'isGuest'
          ];
          
          await AsyncStorage.multiRemove(keysToRemove);

          // Set new data
          const itemsToSet: [string, string][] = [
            ['userToken', data.token || ''],
            ['userName', data.user?.name || ''],
            ['userEmail', data.user?.email || ''],
            ['isGuest', 'false']
          ];

          await AsyncStorage.multiSet(itemsToSet);
          router.replace('/(tabs)');
        } catch (storageError) {
          // Even if storage fails, we can still proceed with navigation
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert(
          'Authentication Failed',
          data.message || 'Please check your credentials and try again'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to connect to server. Please check your internet connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://pot-hole-detector.onrender.com/api/v1/auth/guest-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success && data.token) {
        try {
          const keysToRemove = [
            'userToken',
            'userName',
            'userEmail',
            'userPhone',
            'userProfilePicture',
            'isGuest'
          ];
          
          await AsyncStorage.multiRemove(keysToRemove);

          await AsyncStorage.multiSet([
            ['userToken', data.token],
            ['userName', data.user?.name || ''],
            ['userEmail', data.user?.email || ''],
            ['isGuest', 'true'],
          ]);
          router.replace('/(tabs)');
        } catch (storageError) {
          console.error('Storage error:', storageError);
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to sign in as guest');
      }
    } catch (error) {
      console.error('Guest signin error:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const bgColor1 = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#232526', '#414345'],
  });
  const bgColor2 = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#303C42', '#1B2735'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#1f1c2c' }}>
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={[bgColor1.toString(), bgColor2.toString()]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header / Brand */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>PotHoleDetect</Text>
          <Text style={styles.brandSubtitle}>Ensure a safer ride</Text>
        </View>

        {/* Toggle Section */}
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleText, isLogin && styles.activeText]}>
            Log in
          </Text>
          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            activeOpacity={0.8}
            style={styles.toggleSwitch}
          >
            <View style={styles.sliderTrack}>
              <Animated.View
                style={[
                  styles.sliderThumb,
                  { transform: [{ translateX: isLogin ? 0 : 30 }] },
                ]}
              />
            </View>
          </TouchableOpacity>
          <Text style={[styles.toggleText, !isLogin && styles.activeText]}>
            Sign up
          </Text>
        </View>

        <View style={styles.cardContainer}>
          {/* Front View: Login */}
          <Animated.View
            pointerEvents={isLogin ? 'auto' : 'none'}
            style={[
              styles.card,
              { transform: [{ rotateY: frontInterpolate }] },
            ]}
          >
            <Text style={styles.title}>Welcome Back!</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#777"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#777"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Text style={styles.eyeIcon}>{passwordVisible ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password only on Login */}
            {isLogin && (
              <TouchableOpacity style={styles.forgotContainer}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleAuth}
                disabled={loading}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={handleGuestSignIn}
                disabled={loading}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue as Guest</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Back View: Sign Up */}
          <Animated.View
            pointerEvents={!isLogin ? 'auto' : 'none'}
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }] },
            ]}
          >
            <Text style={styles.title}>Create Account</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#777"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#777"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#777"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Text style={styles.eyeIcon}>{passwordVisible ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleAuth}
                disabled={loading}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={handleGuestSignIn}
                disabled={loading}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue as Guest</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const BORDER_COLOR = '#5A5A5A';
const BG_COLOR = '#fff';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  brandContainer: {
    marginTop: 60,
    alignItems: 'center',
    marginBottom: 30,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    zIndex: 10,
  },
  toggleText: {
    fontWeight: '600',
    color: '#ccc',
    fontSize: 16,
    marginHorizontal: 10,
  },
  activeText: {
    color: '#fff',
  },
  toggleSwitch: {
    width: 60,
    height: 25,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  sliderTrack: {
    flex: 1,
    justifyContent: 'center',
  },
  sliderThumb: {
    width: 24,
    height: 24,
    backgroundColor: '#1E90FF',
    borderRadius: 12,
  },
  cardContainer: {
    width: width * 0.85,
    height: height * 0.6,
    perspective: 1000,
    alignSelf: 'center',
    marginBottom: 30,
  },
  card: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 12,
    padding: 20,
    backfaceVisibility: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cardBack: {
    // Managed by interpolation
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  eyeIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  forgotText: {
    color: '#aaa',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  buttonPrimary: {
    backgroundColor: '#1E90FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
    buttonSecondary: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
