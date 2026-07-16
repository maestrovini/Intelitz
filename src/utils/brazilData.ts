export interface State {
  id: string;
  name: string;
}

export const BRAZIL_STATES: State[] = [
  { id: 'RS', name: 'Rio Grande do Sul (RS)' }
];

export const BRAZIL_CITIES: Record<string, string[]> = {
  RS: [
    'Aceguá', 'Alegrete', 'Alvorada', 'Bagé', 'Bento Gonçalves', 'Cachoeira do Sul', 
    'Cachoeirinha', 'Camaquã', 'Campo Bom', 'Canela', 'Canguçu', 'Canoas', 
    'Carazinho', 'Caxias do Sul', 'Cruz Alta', 'Dom Pedrito', 'Erechim', 'Espumoso', 
    'Estância Velha', 'Esteio', 'Farroupilha', 'Flores da Cunha', 'Frederico Westphalen', 
    'Garibaldi', 'Getúlio Vargas', 'Giruá', 'Gramado', 'Gravataí', 'Guaíba', 
    'Horizontina', 'Igrejinha', 'Ijuí', 'Imbé', 'Itaqui', 'Lajeado', 'Marau', 
    'Montenegro', 'Nova Petrópolis', 'Nova Prata', 'Nova Santa Rita', 'Novo Hamburgo', 
    'Osório', 'Palmeira das Missões', 'Panambi', 'Passo Fundo', 'Pelotas', 'Portão', 
    'Porto Alegre', 'Rio Grande', 'Rio Pardo', 'Santa Cruz do Sul', 'Santa Maria', 
    'Santa Rosa', 'Santana do Livramento', 'Santiago', 'Santo Ângelo', 'Santo Antônio da Patrulha', 
    'São Borja', 'São Gabriel', 'São Jerônimo', 'São Leopoldo', 'São Lourenço do Sul', 
    'São Luiz Gonzaga', 'Sapiranga', 'Sapucaia do Sul', 'Sarandi', 'Soledade', 
    'Taquara', 'Taquari', 'Torres', 'Tramandaí', 'Três Coroas', 'Três de Maio', 
    'Três Passos', 'Uruguaiana', 'Vacaria', 'Venâncio Aires', 'Veranópolis', 'Viamão', 
    'Xangri-lá'
  ]
};

