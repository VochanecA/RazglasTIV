'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2, Eye, EyeOff } from 'lucide-react'; // Import eye icons
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { useState } from 'react'; // Import useState

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Determine the current theme
  const currentTheme = localStorage.getItem('theme') || 'light';

  return (
    <div className={`min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />
          
          {/* Email Field */}
          <div>
            <Label htmlFor="email" className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={50}
                className={`appearance-none rounded-full block w-full px-3 py-2 border ${currentTheme === 'dark' ? 'border-gray-600 placeholder-gray-400 text-white bg-gray-700' : 'border-gray-300 placeholder-gray-500 text-gray-900 bg-white'} focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <Label htmlFor="password" className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </Label>
            <div className="mt-1 relative"> {/* Add relative positioning for the icon */}
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'} // Toggle input type based on state
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                maxLength={100}
                className={`appearance-none rounded-full block w-full px-3 py-2 border ${currentTheme === 'dark' ? 'border-gray-600 placeholder-gray-400 text-white bg-gray-700' : 'border-gray-300 placeholder-gray-500 text-gray-900 bg-white'} focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                placeholder="Enter your password"
              />
              {/* Eye Icon for toggling password visibility */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {state?.error && (
            <div className={`text-red-500 text-sm`}>{state.error}</div>
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className={`w-full flex justify-center items-center py-2 px-4 border border-gray-${currentTheme === 'dark' ? '600' : '300'} rounded-full shadow-sm text-sm font-medium ${pending ? 
                (currentTheme === 'dark' ? 'bg-orange400 cursor-notallowed' : 'bg-orange400 cursor-notallowed') :
                (currentTheme === 'dark' ? "bg-orange600 hover:bg-orange700" : "bg-orange600 hover:bg-orange700")} 
              focus:outline-none focus:ring2 focus:ring-offset2 focus:ring-orange500`}
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className='animate-spin mr2 h4 w4'/>
                  Loading...
                </>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Sign up"
              )}
            </Button>
          </div>
        </form>

        {/* Divider */}
        <br />
        <div className='mt6'>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${currentTheme === 'dark' ? 'bg-gray-800 text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                {mode === 'signin'
                  ? 'New to our platform?'
                  : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className={`w-full flex justify-center py-2 px-4 border border-gray-${currentTheme === 'dark' ? '600' : '300'} rounded-full shadow-sm text-sm font-medium ${currentTheme === 'dark' ? 'text-white bg-gray700 hover:bg-gray600' : 'text-gray700 bg-white hover:bg-gray50'} focus:outline-none focus:ring2 focus:ring-offset2 focus:ring-orange500`}
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
