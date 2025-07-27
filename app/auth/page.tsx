"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { authUtils, getErrorMessage } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import toast from "react-hot-toast";

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const router = useRouter();

  // Don't redirect here - let AuthProvider handle it to prevent conflicts
  // useEffect(() => {
  //   if (!authLoading && user) {
  //     console.log('User already logged in, redirecting...');
  //     router.replace('/');
  //   }
  // }, [user, authLoading, router]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">טוען...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is logged in (prevent flash)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await authUtils.signIn(formData.email, formData.password);
        if (error) {
          toast.error(getErrorMessage(error));
        } else {
          toast.success('התחברת בהצלחה!');
          // AuthProvider will handle the redirect via onAuthStateChange
        }
      } else if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          toast.error('הסיסמאות אינן תואמות');
          return;
        }
        
        const { error } = await authUtils.signUp(
          formData.email, 
          formData.password, 
          formData.displayName
        );
        
        if (error) {
          toast.error(getErrorMessage(error));
        } else {
          toast.success('נרשמת בהצלחה! בדוק את האימייל לאימות');
          setMode('login');
        }
      } else if (mode === 'reset') {
        const { error } = await authUtils.resetPassword(formData.email);
        if (error) {
          toast.error(getErrorMessage(error));
        } else {
          toast.success('נשלח אימייל לאיפוס סיסמה');
          setMode('login');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('שגיאה לא צפויה');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === 'login' ? 'התחברות' : mode === 'signup' ? 'הרשמה' : 'איפוס סיסמה'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {mode === 'login' 
                ? 'ברוכים השבים לצ\'אט בוט עברי' 
                : mode === 'signup' 
                ? 'ברוכים הבאים לצ\'אט בוט עברי'
                : 'הכנס את כתובת האימייל לאיפוס סיסמה'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  שם לתצוגה
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="השם שלך"
                    className="pr-10"
                    dir="rtl"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                כתובת אימייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className="pr-10"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  סיסמה
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="הכנס סיסמה"
                    className="pr-10 pl-10"
                    required
                    minLength={6}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  אימות סיסמה
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="הכנס סיסמה שוב"
                    className="pr-10"
                    required
                    minLength={6}
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>
                    {mode === 'login' ? 'מתחבר...' : mode === 'signup' ? 'נרשם...' : 'שולח...'}
                  </span>
                </div>
              ) : (
                mode === 'login' ? 'התחבר' : mode === 'signup' ? 'הירשם' : 'שלח איפוס'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            {mode === 'login' && (
              <>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    שכחת סיסמה?
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    אין לך חשבון?{' '}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    הירשם כאן
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  יש לך כבר חשבון?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  התחבר כאן
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  חזור להתחברות
                </button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}