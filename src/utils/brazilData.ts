export interface State {
  id: string;
  name: string;
}

export const BRAZIL_STATES: State[] = [
  { id: 'AC', name: 'Acre (AC)' },
  { id: 'AL', name: 'Alagoas (AL)' },
  { id: 'AP', name: 'Amapá (AP)' },
  { id: 'AM', name: 'Amazonas (AM)' },
  { id: 'BA', name: 'Bahia (BA)' },
  { id: 'CE', name: 'Ceará (CE)' },
  { id: 'DF', name: 'Distrito Federal (DF)' },
  { id: 'ES', name: 'Espírito Santo (ES)' },
  { id: 'GO', name: 'Goiás (GO)' },
  { id: 'MA', name: 'Maranhão (MA)' },
  { id: 'MT', name: 'Mato Grosso (MT)' },
  { id: 'MS', name: 'Mato Grosso do Sul (MS)' },
  { id: 'MG', name: 'Minas Gerais (MG)' },
  { id: 'PA', name: 'Pará (PA)' },
  { id: 'PB', name: 'Paraíba (PB)' },
  { id: 'PR', name: 'Paraná (PR)' },
  { id: 'PE', name: 'Pernambuco (PE)' },
  { id: 'PI', name: 'Piauí (PI)' },
  { id: 'RJ', name: 'Rio de Janeiro (RJ)' },
  { id: 'RN', name: 'Rio Grande do Norte (RN)' },
  { id: 'RS', name: 'Rio Grande do Sul (RS)' },
  { id: 'RO', name: 'Rondônia (RO)' },
  { id: 'RR', name: 'Roraima (RR)' },
  { id: 'SC', name: 'Santa Catarina (SC)' },
  { id: 'SP', name: 'São Paulo (SP)' },
  { id: 'SE', name: 'Sergipe (SE)' },
  { id: 'TO', name: 'Tocantins (TO)' },
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
  ],
  SC: [
    'Araranguá', 'Balneário Camboriú', 'Blumenau', 'Brusque', 'Caçador', 'Chapecó', 
    'Criciúma', 'Florianópolis', 'Gaspar', 'Indaial', 'Itajaí', 'Itapema', 'Jaraguá do Sul', 
    'Joinville', 'Lages', 'Navegantes', 'Palhoça', 'Rio do Sul', 'São José', 'Tubarão'
  ],
  PR: [
    'Apucarana', 'Arapongas', 'Campo Mourão', 'Cascavel', 'Cianorte', 'Curitiba', 
    'Foz do Iguaçu', 'Guarapuava', 'Londrina', 'Maringá', 'Paranaguá', 'Pato Branco', 
    'Ponta Grossa', 'São José dos Pinhais', 'Toledo', 'Umuarama'
  ],
  SP: [
    'Americana', 'Araçatuba', 'Araraquara', 'Bauru', 'Campinas', 'Franca', 'Guarulhos', 
    'Indaiatuba', 'Itu', 'Jundiaí', 'Limeira', 'Marília', 'Mogi das Cruzes', 'Osasco', 
    'Piracicaba', 'Presidente Prudente', 'Ribeirão Preto', 'Santo André', 'Santos', 
    'São Bernardo do Campo', 'São José do Rio Preto', 'São José dos Campos', 'São Paulo', 
    'Sorocaba', 'Taubaté'
  ],
  RJ: [
    'Angra dos Reis', 'Barra Mansa', 'Cabo Frio', 'Campos dos Goytacazes', 'Duque de Caxias', 
    'Macana', 'Macaé', 'Niterói', 'Nova Friburgo', 'Nova Iguaçu', 'Petrópolis', 
    'Resende', 'Rio de Janeiro', 'São Gonçalo', 'Volta Redonda'
  ],
  MG: [
    'Barbacena', 'Belo Horizonte', 'Betim', 'Contagem', 'Divinópolis', 'Governador Valadares', 
    'Ipatinga', 'Juiz de Fora', 'Montes Claros', 'Muriahé', 'Poços de Caldas', 'Pouso Alegre', 
    'Sete Lagoas', 'Uberaba', 'Uberlândia', 'Varginha'
  ]
};

