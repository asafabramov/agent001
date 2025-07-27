"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Moon,
  Sun
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('התנתקת בהצלחה');
    } catch (error) {
      toast.error('שגיאה בהתנתקות');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-2 p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-8 w-8">
          <div className="bg-blue-500 text-white flex items-center justify-center h-full w-full rounded-full text-sm font-medium">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </Avatar>
        <span className="hidden md:inline-block text-sm">
          {user.user_metadata?.display_name || user.email?.split('@')[0] || 'משתמש'}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 top-full mt-2 z-20"
            >
              <Card className="p-2 shadow-lg border min-w-[200px]">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.user_metadata?.display_name || 'משתמש'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>

                <div className="py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-right"
                    onClick={() => {
                      setIsOpen(false);
                      // TODO: Open profile settings
                    }}
                  >
                    <User className="h-4 w-4" />
                    פרופיל
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-right"
                    onClick={() => {
                      toggleTheme();
                      setIsOpen(false);
                    }}
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    {theme === 'dark' ? 'מצב בהיר' : 'מצב כהה'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-right"
                    onClick={() => {
                      setIsOpen(false);
                      // TODO: Open settings
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    הגדרות
                  </Button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-right"
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    התנתק
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}