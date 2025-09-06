"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAccount } from '@/contexts/UserContext';
import { Users, MapPin } from 'lucide-react';

interface UsersListProps {
  users: UserAccount[];
}

export function UsersList({ users }: UsersListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Contas de Usuários</h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Users className="w-4 h-4 mr-1" />
          {users.length} usuários
        </Badge>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum usuário cadastrado ainda</p>
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{user.name}</h4>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>CPF: {user.cpf}</span>
                          <span>WhatsApp: {user.whatsapp}</span>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-500">
                        <p>Cadastrado em: {formatDate(user.createdAt)}</p>
                        <p>Último login: {formatDate(user.lastLogin)}</p>
                      </div>
                    </div>

                    {user.addresses.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="font-medium text-sm mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Endereços salvos ({user.addresses.length})
                        </h5>
                        <div className="space-y-2">
                          {user.addresses.map((address) => (
                            <div key={address.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                              <p className="font-medium">
                                {address.endereco}, {address.numero}
                                {address.complemento && ` - ${address.complemento}`}
                              </p>
                              <p className="text-gray-600">
                                {address.bairro}, {address.cidade} - {address.estado}
                              </p>
                              <p className="text-gray-500">CEP: {address.cep}</p>
                              {address.isDefault && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  Endereço padrão
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}