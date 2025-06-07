import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';
import SignupForm from '../components/SignupForm';

const Signup = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async ({ email, password, name }) => {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Save user data to Firestore in the users collection
      await setDoc(doc(db, 'users', userId), {
        name,
        email,
      });

      // Navigate to dashboard after successful signup
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create an account. Please try again.');
    }
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Sign Up</h2>
        <SignupForm onSubmit={handleSignup} error={error} />
        <p className="text-gray-600 text-center mt-4">
          Already have an account? <a href="/Login" className="text-blue-500 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
