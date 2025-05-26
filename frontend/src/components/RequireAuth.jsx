// src/components/RequireAuth.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function RequireAuth({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/login');
    });

    return () => unsubscribe();
  }, [navigate]);

  return children;
}

export default RequireAuth;
