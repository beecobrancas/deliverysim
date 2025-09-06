"use client";

import React, { useState, useEffect } from 'react';
import { Star, MapPin, Instagram, Info, Wallet, Bike } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CartIcon } from '@/components/CartIcon';
import { UserIcon } from '@/components/UserIcon';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { estados, estados_input, cidadesPorEstado } from '@/data/locations';
import { InfoModal } from './InfoModal';

export function Header() {
  const { openCart } = useCart();
  const { settings } = useSettings();
  const [userLocation, setUserLocation] = useState({
    city: 'Selecione seu',
    state: 'local'
  });
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const setCookie = (name: string, value: string, days: number) => {
    if (typeof window === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  };

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return "";
    return document.cookie.split('; ').reduce((acc, cookie) => {
      const [key, val] = cookie.split('=');
      return key === name ? val : acc;
    }, "");
  };

  const escolherLocalizacao = async () => {
    const Swal = (await import('sweetalert2')).default;

    const fetchLocationSuggestion = async () => {
      try {
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const { city = "Local Desconhecido", region = "Local Desconhecido" } = await response.json();
        return { city, region };
      } catch (error) {
        console.error('Erro ao obter a sugestão de localização:', error);
        return { city: "Local Desconhecido", region: "Local Desconhecido" };
      }
    };

    const sugestao = await fetchLocationSuggestion();
    const estadoSugerido = sugestao.region;
    const cidadeSugerida = sugestao.city;
    const ufSugerido = estados[estadoSugerido as keyof typeof estados] || "";

    const { value: estadoEscolhido } = await Swal.fire({
      title: "Procure a loja mais próxima de você!",
      text: "Escolha seu estado:",
      input: "select",
      inputOptions: estados_input,
      inputPlaceholder: "Escolha seu estado",
      inputValue: ufSugerido,
      confirmButtonText: "Próximo",
      confirmButtonColor: "#f97316",
      allowOutsideClick: false,
      allowEscapeKey: false,
      inputValidator: (value) => value ? undefined : "Por favor, escolha seu estado."
    });

    if (!estadoEscolhido) return;
    setCookie("localEstado", estadoEscolhido, 365);

    const cidadesDisponiveis = cidadesPorEstado[estadoEscolhido] || [cidadeSugerida, "Outra cidade"];
    const indiceCidadeSugerida = cidadesDisponiveis.indexOf(cidadeSugerida);

    const { value: cidadeIndex } = await Swal.fire({
      title: "Estamos quase lá...",
      html: "Agora, <b style='font-size: 18px; color: #f97316;'>selecione sua cidade:</b>",
      input: "select",
      inputOptions: cidadesDisponiveis,
      inputValue: indiceCidadeSugerida !== -1 ? indiceCidadeSugerida : 0,
      confirmButtonText: "Procurar loja mais próxima!",
      confirmButtonColor: "#f97316",
      allowOutsideClick: false,
      allowEscapeKey: false,
      inputValidator: (value) => value !== undefined && value !== '' ? undefined : "Por favor, escolha sua cidade."
    });

    if (cidadeIndex === undefined) return;
    const cidadeEscolhida = cidadesDisponiveis[parseInt(cidadeIndex)];
    setCookie("localCidade", cidadeEscolhida, 365);

    await Swal.fire({
      title: "Procurando a loja mais próxima...",
      html: `Procurando a loja mais próxima de você em <b>${cidadeEscolhida}</b>...`,
      timer: 3000,
      timerProgressBar: true,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await Swal.fire({
      html: `A loja mais próxima fica a <b>${settings.distance}</b> de você! Seu pedido chegará entre 30 a 50 minutos.`,
      icon: "success",
      confirmButtonText: "Olhar cardápio de ofertas!",
      confirmButtonColor: "#f97316",
      allowOutsideClick: false,
    });

    const nomeCompletoEstado = estados_input[estadoEscolhido as keyof typeof estados_input] || estadoEscolhido;
    setUserLocation({ city: cidadeEscolhida, state: nomeCompletoEstado });
  };

  useEffect(() => {
    const cidadeSalva = getCookie("localCidade");
    const estadoSalvo = getCookie("localEstado");

    if (cidadeSalva && estadoSalvo) {
      const nomeCompletoEstado = estados_input[estadoSalvo as keyof typeof estados_input] || estadoSalvo;
      setUserLocation({ city: cidadeSalva, state: nomeCompletoEstado });
      return;
    }

    const timer = setTimeout(() => {
      escolherLocalizacao();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <header 
        className="relative pb-16"
        style={{ backgroundColor: settings.header_bg_color || '#f97316' }}
      >
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <UserIcon />
          <CartIcon onClick={openCart} />
        </div>

        <div 
          className="h-32 md:h-40 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1588315549153-dd24de41c707?q=80&w=2070&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="relative max-w-3xl mx-auto px-4 -mt-16 md:-mt-20">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
            <div className="relative h-12">
              <div className="absolute left-1/2 -translate-x-1/2 -top-14 md:-top-16 w-24 h-24 md:w-28 md:h-28 bg-white rounded-full p-1.5 shadow-md">
                {settings.logo && (
                  <img src={settings.logo} alt="Logo" className="w-full h-full rounded-full object-cover" />
                )}
              </div>
            </div>

            <div className="absolute top-4 left-4">
              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 font-medium">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                ABERTO
              </Badge>
            </div>

            <div className="text-center mt-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{settings.header_title}</h1>
              <p className="text-gray-500 mt-1">{settings.header_subtitle}</p>
              
              <div className="flex justify-center gap-3 mt-4">
                <a href={settings.social_link_1} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-orange-400 text-orange-500 hover:bg-orange-50 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <button onClick={() => setIsInfoModalOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-orange-400 text-orange-500 hover:bg-orange-50 transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>Pedido Mínimo {settings.min_order}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bike className="w-4 h-4" />
                  <span>{settings.delivery_info}</span>
                  <span className="text-green-600 font-medium ml-1">Grátis</span>
                </div>
                <div className="flex items-center gap-1.5" suppressHydrationWarning>
                  <MapPin className="w-4 h-4" />
                  <span>{userLocation.city} - {userLocation.state} • {settings.distance} de você</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                  <span className="font-bold">{settings.rating}</span>
                  <span>({settings.reviews_count} avaliações)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {settings.show_banner && (
        <div 
          className="py-3 text-center"
          style={{
            backgroundColor: settings.banner_bg_color || '#dc2626',
            color: settings.banner_text_color || '#ffffff'
          }}
        >
          <p className="font-bold tracking-wider">{settings.banner_text}</p>
        </div>
      )}

      <InfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        location={userLocation}
      />
    </>
  );
}