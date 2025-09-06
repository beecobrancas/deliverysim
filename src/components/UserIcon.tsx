"use client";

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserLogin } from './UserLogin';
import { AdminPanel } from './AdminPanel';

export function UserIcon() {
  const { currentUser } = useUser();
  const { isAdmin } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleClick = () => {
    if (isAdmin) {
      setShowAdminPanel(true);
    } else {
      setShowLogin(true);
    }
  };

  return (
    <>
      <Button
        variant="default"
        size="icon"
        onClick={handleClick}
        className="bg-white text-gray-800 hover:bg-gray-200 shadow-md"
      >
        <User className="h-4 w-4" />
      </Button>

      <UserLogin 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />

      {isAdmin && (
        <AdminPanel 
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </>
  );
}