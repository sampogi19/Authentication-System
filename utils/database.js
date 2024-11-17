import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabase('auth.db');


export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      AsyncStorage.getItem('dbInitialized').then((isInitialized) => {
        if (isInitialized) {
          console.log('Database already initialized');
          resolve();
        } else {
          db.transaction(tx => {
            tx.executeSql(
              'DROP TABLE IF EXISTS users;', [], 
              () => {
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
                  () => {
                    console.log('Database and table reset successfully');
                    AsyncStorage.setItem('dbInitialized', 'true');
                    resolve();
                  },
                  (_, error) => {
                    console.error('Error creating table:', error);
                    reject(error);
                  }
                );
              },
              (_, error) => {
                console.error('Error dropping table:', error);
                reject(error);
              }
            );
          });
        }
      }).catch((error) => {
        console.error('Error checking database initialization:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};
export const resetDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
       
        tx.executeSql('DROP TABLE IF EXISTS users;', [], () => {
    
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
            () => {
              console.log('Database and table reset successfully');
              AsyncStorage.setItem('dbInitialized', 'false'); 
              resolve();
            },
            (_, error) => {
              console.error('Error creating table:', error);
              reject(error);
            }
          );
        });
      });
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};


export const registerUser = async (userData) => {
  const { username, password, firstName, lastName, email, contactNumber, address, profilePicture } = userData;

  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO users (username, password, firstName, lastName, email, contactNumber, address, profilePicture) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
          [username, password, firstName, lastName, email, contactNumber, address, profilePicture],
          (_, result) => {
            console.log('User registered successfully');
            resolve(result);
          },
          (_, error) => {
            console.error('Error registering user:', error);
            reject(new Error('Username or Email already exists'));
          }
        );
      });
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};


export const loginUser = (username, password) => {
  return new Promise((resolve, reject) => {
    try {
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
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Error logging in:', error);
            reject(new Error('Invalid username or password'));
          }
        );
      });
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};


export const getLoggedInUser = async () => {
  const user = await AsyncStorage.getItem('loggedInUser');
  return user ? JSON.parse(user) : null;
};


export const getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE username = ?',
          [username],
          (_, { rows: { _array } }) => {
            resolve(_array[0] || null);
          },
          (_, error) => {
            console.error('Error fetching user data:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};


export const updateUserProfile = (userData) => {
  const { id, firstName, lastName, email, contactNumber, address, profilePicture } = userData;

  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE users SET firstName = ?, lastName = ?, email = ?, contactNumber = ?, address = ?, profilePicture = ? WHERE id = ?;',
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
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};


export const deleteUserAccount = (id) => {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM users WHERE id = ?;',
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
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
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


export const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users;',
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
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};
