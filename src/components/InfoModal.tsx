"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bike, Briefcase, CheckCircle, MapPin } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: {
    city: string;
    state: string;
  };
}

const InfoSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div>
    <h3 className="text-lg font-bold text-orange-500 mb-2">{title}</h3>
    <div className="space-y-2 text-gray-700">
      {children}
    </div>
  </div>
);

export function InfoModal({ isOpen, onClose, location }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Informações da Loja</DialogTitle>
          <DialogDescription>
            Detalhes sobre entrega, pagamento e localização.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <InfoSection title="Tipos de Entrega">
            <p className="flex items-center gap-3">
              <Bike className="w-5 h-5 text-gray-600" />
              <span>Entrega Motoboy</span>
            </p>
            <p className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-600" />
              <span>Retirada</span>
            </p>
          </InfoSection>

          <InfoSection title="Formas de Pagamento">
            <p className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Pix</span>
            </p>
          </InfoSection>

          <InfoSection title="Endereço">
            <p className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-600" />
              <span>{location.city} - {location.state}</span>
            </p>
          </InfoSection>

          <InfoSection title="Áreas de Entrega">
            <p>{location.city} - {location.state}</p>
            <p className="font-bold text-green-600">GRÁTIS (hoje)</p>
          </InfoSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}