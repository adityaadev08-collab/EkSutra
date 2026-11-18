'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase'; // Ensure this points to your Supabase client file

export default function MockDigiLockerLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMockLogin = async () => {
    setLoading(true);
    
    // 1. Simulate the DigiLocker redirect delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. We use Supabase's Anonymous/Test sign-in or a mock email 
    // to instantly generate a secure auth.uid() for your RLS policies
    const { data, error } = await supabase.auth.signUp({
      email: `citizen_${Math.floor(Math.random() * 1000)}@mock-digilocker.gov.in`,
      password: 'secure-mock-password-123',
    });

    if (error) {
      console.error('Mock Login Failed:', error.message);
      setLoading(false);
      return;
    }

    // 3. Automatically create their demographic profile in the table we just secured
    if (data.user) {
      await supabase.from('profiles').insert([
        {
          id: data.user.id, // This matches the auth.uid() requirement!
          full_name: 'Aditya Gupta (Verified)',
          age: 20,
          category: 'General',
          annual_income: 250000,
        }
      ]);
      
      // 4. Redirect to the main dashboard
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="p-8 bg-white rounded-xl shadow-lg max-w-md w-full text-center border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">EkSutra Portal</h1>
        <p className="text-slate-500 mb-8 text-sm">Secure Civic Scheme Verification</p>
        
        <button 
          onClick={handleMockLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#005587] hover:bg-[#003f66] text-white py-3 px-4 rounded-lg font-semibold transition-all"
        >
          {loading ? 'Authenticating with Government Servers...' : 'Sign in with DigiLocker'}
        </button>

        <p className="mt-6 text-xs text-slate-400">
          * Note for Reviewers: This presentation uses a mock OAuth wrapper to simulate DigiLocker token exchange for demonstration purposes.
        </p>
      </div>
    </div>
  );
}