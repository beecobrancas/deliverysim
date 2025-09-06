// Tipagem para a função fbq
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

/**
 * Dispara um evento de PageView.
 * Essencial para o funcionamento básico do Pixel.
 */
export const pageview = () => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

/**
 * Dispara um evento customizado do Pixel.
 * @param name - Nome do evento (ex: 'AddToCart').
 * @param options - Dados adicionais sobre o evento.
 */
export const event = (name: string, options: object = {}) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', name, options);
  }
};