// // useAuth.jsx
// import { createContext, useContext, useState, useEffect } from 'react';

// // Экспортируем контекст
// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   const login = (clientID, secretKey) => {
//     const userData = {
//       clientID,
//       secretKey,
//       isLoggedIn: true,
//       loginTime: new Date().toISOString()
//     };
    
//     setUser(userData);
//     localStorage.setItem('finhelper_user', JSON.stringify(userData));
//     return userData;
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('finhelper_user');
//   };

//   useEffect(() => {
//     const savedUser = localStorage.getItem('finhelper_user');
//     if (savedUser) {
//       setUser(JSON.parse(savedUser));
//     }
//   }, []);

//   const value = {
//     user,
//     login,
//     logout
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within AuthProvider');
//   }
//   return context;
// };