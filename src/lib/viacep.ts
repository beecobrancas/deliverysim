export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export async function buscarCep(cep: string): Promise<{
  success: boolean;
  data?: ViaCepResponse;
  error?: string;
}> {
  try {
    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    // Valida se o CEP tem 8 dígitos
    if (cleanCep.length !== 8) {
      return {
        success: false,
        error: 'CEP deve ter 8 dígitos'
      };
    }
    
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      return {
        success: false,
        error: 'Erro ao consultar CEP'
      };
    }
    
    const data: ViaCepResponse = await response.json();
    
    if (data.erro) {
      return {
        success: false,
        error: 'CEP não encontrado'
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return {
      success: false,
      error: 'Erro ao consultar CEP'
    };
  }
}

export function formatarCep(cep: string): string {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
}