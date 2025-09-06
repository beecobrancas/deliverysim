"use client";

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminPanel } from './AdminPanel';

export function AdminIcon() {
  const { isAdmin } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const handleClick = () => {
    if (isAdmin) {
      setShowPanel(true);
    } else {
      setShowLogin(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleClick}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <AdminLogin 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => {
          setShowLogin(false);
          setShowPanel(true);
        }}
      />

      <AdminPanel 
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
      />
    </>
  );
}