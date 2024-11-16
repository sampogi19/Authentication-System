import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Image, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState, useEffect } from 'react';
import { initDatabase, registerUser, loginUser, updateUserProfile } from './utils/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profilePicture, setProfilePicture] = useState(''); 
  const [profilePictureUrl, setProfilePictureUrl] = useState(''); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    initDatabase();
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const status = await AsyncStorage.getItem('isLoggedIn');
    if (status === 'true') {
      const savedUsername = await AsyncStorage.getItem('username');
      const savedPassword = await AsyncStorage.getItem('password');
      setUsername(savedUsername);
      const userDetails = await loginUser(savedUsername, savedPassword); 
      if (userDetails) {
        setUserData(userDetails);
        setIsLoggedIn(true);
      }
    }
  };

  const handleSubmit = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    try {
      if (isLogin) {
     
        const userDetails = await loginUser(username, password);
        if (userDetails) {
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await AsyncStorage.setItem('username', username);
          await AsyncStorage.setItem('password', password); 
          setUserData(userDetails);
          setIsLoggedIn(true);
          Alert.alert('Success', 'Logged in successfully');
        } else {
          Alert.alert('Error', 'Invalid credentials');
        }
      } else {
       
        if (!firstName || !lastName || !email || !contactNumber || !address || (!profilePicture && !profilePictureUrl)) {
          Alert.alert('Error', 'Please fill in all registration fields');
          return;
        }
  
       
        await registerUser({
          username,
          password,
          firstName,
          lastName,
          email,
          contactNumber,
          address,
          profilePicture: profilePicture || profilePictureUrl, 
        });
  

        setFirstName('');
        setLastName('');
        setEmail('');
        setContactNumber('');
        setAddress('');
        setProfilePicture('');
        setProfilePictureUrl('');
        setUsername('');
        setPassword('');
        
      ;
        
        Alert.alert('Success', 'Registration successful');
        setIsLogin(true);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  

  const handleLogout = async () => {
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('password'); 
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setUserData({});
  };

 
  const pickImage = async () => {
   
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    

  
   
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    
    if (pickerResult.canceled) {
      return;
    }
  
 
    const selectedImageUri = pickerResult.assets[0].uri;
    setProfilePicture(selectedImageUri); 
  
   
    if (userData.id) {
      try {
        await updateUserProfile({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          contactNumber: userData.contactNumber,
          address: userData.address,
          profilePicture: selectedImageUri, 
        });
        Alert.alert('Success', 'Profile picture updated');
      } catch (error) {
        console.error('Error updating profile picture:', error);
        Alert.alert('Error', 'Failed to update profile picture');
      }
    }
  };
  const ProfilePage = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loggedInContainer}>
          <Image
            source={userData?.profilePicture ? { uri: userData.profilePicture } : require('./assets/avatar.png')}
            style={styles.avatar}
          />
          <Text style={styles.welcomeTitle}>Welcome, {userData?.firstName} {userData?.lastName}!</Text>
          <Text style={styles.subtitle}>Email: {userData?.email}</Text>
          <Text style={styles.subtitle}>Contact: {userData?.contactNumber}</Text>
          <Text style={styles.subtitle}>Address: {userData?.address}</Text>
  
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.buttonText}>Change Profile Picture</Text>
          </TouchableOpacity>
  
          {/* Edit Button Below the Change Profile Picture */}
          <TouchableOpacity style={styles.editButton} onPress={() => { /* Implement Edit Profile Logic Here */ }}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
  
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  if (isLoggedIn) {
    return <ProfilePage />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.formContainer}>
              <Image source={require('./assets/icon.png')} style={styles.logo} />
              <Text style={styles.title}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>
              <Text style={styles.subtitle}>{isLogin ? 'Please sign in to continue' : 'Please fill in the form to continue'}</Text>

              <View style={styles.inputContainer}>
                {!isLogin && (
                  <>
                    <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
                    <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
                    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
                    <TextInput style={styles.input} placeholder="Contact Number"  value={contactNumber}onChangeText={(text) => { if (/^\d{0,11}$/.test(text)) {setContactNumber(text);  } }} keyboardType="number-pad"  maxLength={11} />
                    <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />

                    {profilePicture && (
  <Text style={styles.uploadIndicator}>Profile picture uploaded!</Text>
)}
<View style={styles.profilePictureContainer}>
  <TextInput
    style={styles.urlInput} 
    placeholder="Profile Picture URL (Optional)"
    value={profilePictureUrl}
    onChangeText={setProfilePictureUrl}
  />
  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
    <Text style={styles.buttonText}>Upload Image</Text>
  </TouchableOpacity>

</View>

                  </>
                  
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                
              </View>
           
              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.switchButtonText}>
                  {isLogin ? 'Don’t have an account? Register' : 'Already have an account? Login'}
                </Text>
              </TouchableOpacity>
              
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fafafa',
      paddingTop: 30,
    },
    keyboardView: {
      flex: 1,
      width: '100%',
    },
    formContainer: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 20,
      resizeMode: 'contain',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      color: '#555',
      marginBottom: 30,
      textAlign: 'center',
    },
    inputContainer: {
      width: '100%',
    },
    input: {
      width: '100%',
      height: 50,
      backgroundColor: '#fff',
      marginBottom: 15,
      paddingHorizontal: 15,
      borderRadius: 10,
      borderColor: '#ddd',
      borderWidth: 1,
      fontSize: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    button: {
      width: '100%',
      height: 50,
      backgroundColor: '#3498db',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      marginBottom: 20,
      shadowColor: '#2980b9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    editButton: {
      backgroundColor: '#3498db',  // Blue color
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      height: 55,
      marginTop: 15, // Space between buttons
      shadowColor: '#2980b9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    switchButton: {
      marginTop: 10,
    },
    switchButtonText: {
      fontSize: 14,
      color: '#3498db',
      textAlign: 'center',
    },
    uploadButton: {
      backgroundColor: '#2ecc71',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      height: 55,
      shadowColor: '#27ae60',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },

    profilePictureContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    loggedInContainer: {
      padding: 30,
      alignItems: 'center',
      width: '90%', 
      backgroundColor: '#F5F5DC',
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 5,
      marginHorizontal: '5%',
      marginTop: 120, 
    },
    avatar: {
      width: 130,
      height: 130,
      borderRadius: 65,
      marginBottom: 15,
      resizeMode: 'cover',
      borderWidth: 4,
      borderColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    welcomeTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10,
      textAlign: 'center',
    },
    logoutButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      backgroundColor: '#e74c3c',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: '#c0392b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      marginTop: 30, 

    },
    logoutButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    urlInput: {
      flex: 1,
      height: 50,
      backgroundColor: '#fff',
      marginRight: 15,
      paddingHorizontal: 15,
      borderRadius: 10,
      borderColor: '#ddd',
      borderWidth: 1,
      fontSize: 16,
    },
    uploadIndicator: {
      color: '#2ecc71',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 5,
    },
  });
  

