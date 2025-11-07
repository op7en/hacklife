// import React, { useState } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import { useNavigate } from 'react-router-dom';
// import './Login.css';

// const Login = () => {
//   const [clientID, setClientID] = useState('');
//   const [secretKey, setSecretKey] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
  
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     try {
//       if (!clientID || !secretKey) {
//         throw new Error('Заполните все поля');
//       }

//       // Выполняем вход
//       const userData = login(clientID, secretKey);
//       console.log('✅ Успешный вход:', userData);
      
//       // Перенаправляем на главную
//       navigate('/');
      
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="login">
//       <div className="login-form">
//         <h1>Вход в FinHelper</h1>
        
//         {error && (
//           <div className="error-message">
//             ⚠️ {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="client">ID клиента</label>
//             <input 
//               id="client" 
//               value={clientID} 
//               onChange={(e) => setClientID(e.target.value)} 
//               type="text" 
//               placeholder="team003-1" 
//               disabled={isLoading}
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="secretKey">Secret Key</label>
//             <input 
//               id="secretKey" 
//               value={secretKey} 
//               onChange={(e) => setSecretKey(e.target.value)} 
//               type="password" 
//               placeholder="WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF" 
//               disabled={isLoading}
//             />
//           </div>

//           <button type="submit" disabled={isLoading}>
//             {isLoading ? 'Вход...' : 'Войти'}
//           </button>
//         </form>

//         <div className="login-info">
//           <h3>Демо данные:</h3>
//           <p><strong>Client ID:</strong> team003-1</p>
//           <p><strong>Secret Key:</strong> WzuKQTQrmefPsCLAB8OtkP5gXjO38iBF</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;