import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LoginScreen() {
  const router = useRouter();

  const handleOAuthLogin = (provider: string) => {
    // Navigate to tabs (no actual OAuth logic - UI only)
    console.log(`Login with ${provider}`);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.mainLogoRow}>
          <View style={styles.aiEltsContainer}>
            <View style={styles.logoTextRow}>
              <Text style={styles.aiText}>A</Text>
              <View style={styles.iContainer}>
                <IconSymbol name="graduationcap.fill" size={16} color="#fff" style={styles.capIcon} />
                <Text style={styles.iText}>i</Text>
              </View>
              <Text style={styles.eltsText}>elts</Text>
              <Text style={styles.tmText}>™</Text>
            </View>
          </View>
          <View style={styles.poweredContainer}>
            <Text style={styles.poweredText}>Powered</Text>
            <View style={styles.byAiRow}>
              <Text style={styles.byAiText}>by AI</Text>
              <IconSymbol name="cpu.fill" size={11} color="#fff" style={styles.cpuIcon} />
            </View>
          </View>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Welcome back! Ready to boost your IELTS with AI?
        </Text>

        <View style={styles.buttonsContainer}>
          {/* Google Login Button */}
          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleOAuthLogin('Google')}>
            <View style={styles.buttonContent}>
              <IconSymbol name="g.circle.fill" size={22} color="#EA4335" />
              <Text style={styles.buttonText}>Login with Google</Text>
            </View>
          </Pressable>

          {/* Facebook Login Button */}
          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleOAuthLogin('Facebook')}>
            <View style={styles.buttonContent}>
              <IconSymbol name="f.circle.fill" size={22} color="#1877F2" />
              <Text style={styles.buttonText}>Login with Facebook</Text>
            </View>
          </Pressable>

          {/* Apple Login Button */}
          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleOAuthLogin('Apple')}>
            <View style={styles.buttonContent}>
              <IconSymbol name="apple.logo" size={22} color="#000" />
              <Text style={styles.buttonText}>Login with apple id</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3BB9F0',
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 120,
  },
  mainLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiEltsContainer: {
    // Container for AIelts™
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -2,
  },
  iContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  capIcon: {
    position: 'absolute',
    top: -5,
    zIndex: 1,
  },
  iText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -2,
  },
  eltsText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -2,
  },
  tmText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 1,
    marginTop: 4,
  },
  poweredContainer: {
    alignItems: 'flex-start',
    marginLeft: 4,
  },
  poweredText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 15,
  },
  byAiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  byAiText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 15,
  },
  cpuIcon: {
    marginTop: -1,
  },
  content: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 15,
    color: '#000',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  buttonsContainer: {
    width: '100%',
    gap: 14,
    maxWidth: 280,
  },
  oauthButton: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
});
