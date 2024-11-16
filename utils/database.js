import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabase('auth.db');

// Initialize the database (recreate the tables)
export const initDatabase = async () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        firstName TEXT,
        lastName TEXT,
        email TEXT UNIQUE,
        contactNumber TEXT,
        address TEXT,
        profilePicture TEXT
      );`,
      [],
      async () => {
        console.log('Database initialized successfully');
        await AsyncStorage.setItem('dbInitialized', 'true');
      },
      (_, error) => {
        console.error('Error creating table:', error);
      }
    );
  });
};

// Check if the database is initialized
export const isDatabaseInitialized = async () => {
  const status = await AsyncStorage.getItem('dbInitialized');
  return status === 'true';
};

// Register user
export const registerUser = async (user) => {
  const dbInitialized = await isDatabaseInitialized();
  if (!dbInitialized) {
    await initDatabase();  // Ensure the database is initialized first
  }

  try {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO users (username, password, firstName, lastName, email, contactNumber, address, profilePicture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          user.username,
          user.password,
          user.firstName,
          user.lastName,
          user.email,
          user.contactNumber,
          user.address,
          user.profilePicture,
        ],
        (_, result) => {
          console.log('User registered successfully');
        },
        (_, error) => {
          console.error('Error registering user:', error);
          throw new Error('Registration failed');
        }
      );
    });
  } catch (error) {
    console.error('Error registering user:', error);
    throw new Error('Registration failed');
  }
};

// Login user
export const loginUser = async (username, password) => {
  const dbInitialized = await isDatabaseInitialized();
  if (!dbInitialized) {
    await initDatabase();  // Ensure the database is initialized first
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        async (_, { rows: { _array } }) => {
          if (_array.length > 0) {
            const user = _array[0];
            console.log('User logged in:', user.username);
            await AsyncStorage.setItem('loggedInUser', JSON.stringify(user));
            resolve(user);
          } else {
            console.log('Invalid username or password');
            resolve(null);
          }
        },
        (_, error) => {
          console.error('Error logging in:', error);
          reject(new Error('Invalid username or password'));
        }
      );
    });
  });
};

// Get the currently logged-in user
export const getLoggedInUser = async () => {
  try {
    const user = await AsyncStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error fetching logged-in user:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  const { id, firstName, lastName, email, contactNumber, address, profilePicture } = userData;

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE users SET firstName = ?, lastName = ?, email = ?, contactNumber = ?, address = ?, profilePicture = ? WHERE id = ?`,
        [firstName, lastName, email, contactNumber, address, profilePicture, id],
        (_, result) => {
          console.log('User profile updated successfully');
          resolve(result);
        },
        (_, error) => {
          console.error('Error updating user profile:', error);
          reject(error);
        }
      );
    });
  });
};

// Delete user account
export const deleteUserAccount = async (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM users WHERE id = ?`,
        [id],
        (_, result) => {
          console.log('User account deleted successfully');
          resolve(result);
        },
        (_, error) => {
          console.error('Error deleting user:', error);
          reject(error);
        }
      );
    });
  });
};


export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('loggedInUser');
    console.log('User logged out');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};


export const getAllUsers = async () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users',
        [],
        (_, { rows: { _array } }) => {
          resolve(_array);
        },
        (_, error) => {
          console.error('Error fetching users:', error);
          reject(error);
        }
      );
    });
  });
};
