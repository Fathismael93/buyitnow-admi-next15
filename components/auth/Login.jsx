'use client';

import { React, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseCallbackUrl } from '@/helpers/helpers';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    router.prefetch('/admin');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callBackUrl = params.get('callbackUrl');

  const submitHandler = async (e) => {
    e.preventDefault();

    const data = await signIn('credentials', {
      email,
      password,
      callbackUrl: callBackUrl ? parseCallbackUrl(callBackUrl) : '/admin',
    });

    if (data?.error) {
      toast.error(data?.error);
    }

    if (data?.ok) {
      router.push('/admin');
    }
  };

  return (
    <div
      style={{ maxWidth: '480px' }}
      className="mt-10 mb-20 p-4 md:p-7 mx-auto rounded-sm bg-white shadow-lg"
    >
      <form onSubmit={submitHandler}>
        <h2 className="mb-5 text-2xl font-semibold">Login</h2>

        <div className="mb-4">
          <label className="block mb-1"> Email </label>
          <input
            className="appearance-none border border-gray-200 bg-gray-100 rounded-md py-2 px-3 hover:border-gray-400 focus:outline-hidden focus:border-gray-400 w-full"
            type="text"
            placeholder="Type your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1"> Password </label>
          <input
            className="appearance-none border border-gray-200 bg-gray-100 rounded-md py-2 px-3 hover:border-gray-400 focus:outline-hidden focus:border-gray-400 w-full"
            type="password"
            placeholder="Type your password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="my-2 px-4 py-2 text-center w-full inline-block text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
