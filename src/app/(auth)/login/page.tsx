'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { withRequestRef } from '@/lib/api/errors';
import type { LoginFormData, LoginFormErrors } from '@/types';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login(formData.email, formData.password);
      // Redirect is handled by AuthContext
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'VALIDATION_ERROR' && error.details) {
          // Map field-level errors from backend
          setErrors({
            email: error.details.email,
            password: error.details.password,
          });
        } else {
          // General errors (invalid credentials, account locked, etc.)
          setErrors({ general: withRequestRef(error.message, error) });
        }
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[448px]">
          {/* Login Form Container */}
          <div className="p-6">
            {/* Greeting */}
            <div className="mb-8">
              <p className="font-inter text-[16px] text-[var(--brand)] mb-1">
                السَّلَامُ عَلَيْكُمْ
              </p>
              <h1 className="font-inter font-semibold text-[36px] text-[var(--grey-800)]">
                Welcome Back 👋
              </h1>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="mb-5 p-4 rounded-[12px] bg-red-50 border border-red-200">
                <p className="font-inter text-[14px] text-[var(--error)]">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email Field */}
              <Input
                label="Email"
                placeholder="admin@masjid-app.com"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                autoComplete="email"
              />

              {/* Password Field */}
              <Input
                label="Password"
                placeholder="*********"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={errors.password}
                showPasswordToggle
                autoComplete="current-password"
              />

              {/* Login Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isLoading}
                className="mt-4"
              >
                Log In
              </Button>

              {/* Forgot Password Link */}
              <button
                type="button"
                className="font-inter font-medium text-[16px] text-[var(--grey-800)] text-center hover:underline"
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                Forget Password?
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      {/* Footer */}
      <footer className="px-[136px] py-[42px] flex justify-between items-center">
        <span className="font-inter font-medium text-[12px] text-[var(--neutral-600)]">
          © 2025 ALL RIGHTS RESERVED
        </span>
        <span className="font-inter font-medium text-[12px] text-[var(--neutral-600)]">
          Terms Of Use. Privacy Policy
        </span>
      </footer>
    </div>
  );
}
