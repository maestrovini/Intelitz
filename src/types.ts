export type AuctionCategory = 'real_estate' | 'vehicle';

export interface AuctionItem {
  id: string;
  title: string;
  category: AuctionCategory;
  typeText: string; // e.g. "Apartamento", "Casa", "Chácara", "Hatch", "Sedan", "SUV", "Moto"
  location: string; // e.g. "Porto Alegre, RS - Moinhos de Vento"
  state: string; // e.g. "RS"
  marketValue: number; // Valor de mercado ou Tabela FIPE
  fipeValue?: number; // Valor oficial da Tabela FIPE para veículos
  bidValue1: number; // Lance de 1º Leilão
  bidValue2?: number; // Lance de 2º Leilão (com desconto)
  currentBid: number; // Lance atual ou mínimo exigido
  auctionDate1: string;
  auctionDate2?: string;
  portalName: string; // e.g. "Caixa", "Sodré Santoro", "Zukerman", "Milan Leilões"
  status: 'aberto' | 'em_andamento' | 'finalizado';
  occupancyStatus?: 'ocupado' | 'desocupado'; // Exclusivo de Imóveis
  vehicleCondition?: 'recuperado' | 'sinistro' | 'frota'; // Exclusivo de Veículos
  debtsPaidByBuyer: boolean; // Se as dívidas de IPTU/IPVA ficam para o arrematante
  discountPercent: number; // Desconto em relação ao valor de mercado
  description: string;
  image: string;
  details: {
    area?: string; // e.g. "72m²"
    bedrooms?: number;
    bathrooms?: number;
    year?: string; // e.g. "2021/2022"
    mileage?: string; // e.g. "45.000 km"
    fuel?: string; // e.g. "Flex"
    transmission?: string; // e.g. "Automático"
    chassisState?: string; // e.g. "Regular"
    documentIssues?: string; // e.g. "IPVA e multas por conta do arrematante"
    judicialProcess?: string; // e.g. "Processo nº 1002345-88.2023.8.26.0100"
  };
  arrematado?: 'Sim' | 'Não';
}

export interface FeasibilityCalculation {
  id: string;
  title: string;
  category: AuctionCategory;
  date: string;
  // Entradas
  marketValue: number;
  bidValue: number;
  auctioneerFee: number; // % do leiloeiro, geralmente 5%
  itbiOrTransferPct: number; // % Imposto (ITBI p/ imóvel ou taxa de transferência veículo)
  registryOrRegistrationFix: number; // Custos cartório/licenciamento fixos
  repairCosts: number; // Custos de reforma ou mecânica/funilaria
  outstandingDebts: number; // Dívidas a regularizar (condomínio, IPTU, IPVA, multas)
  judicialOrLegalCosts: number; // Custos de advogado ou assessoria
  holdingExpenses: number; // Custos de carregar o bem (mensalidade, condomínio temporário)
  expectedResaleDiscount: number; // % de desconto p/ vender rápido ou comissão de corretor/loja
  // Saídas calculadas
  totalInvestment: number;
  expectedResaleValue: number;
  netProfit: number;
  roiPercent: number;
  verdict: 'excelente' | 'bom' | 'regular' | 'risco_alto' | 'inviavel';
  aiRecommendation?: string;
}

export interface EditalAnalysis {
  id: string;
  auctionItemId?: string;
  inputText: string;
  analyzedAt: string;
  category: AuctionCategory;
  score: number; // 0 - 100 (Nota de segurança da arrematação)
  legalRisks: {
    title: string;
    description: string;
    severity: 'baixo' | 'medio' | 'alto';
  }[];
  financialCalculations: {
    additionalCostsEstimated: number;
    customTaxDetails: string;
    maxViableBid: number; // Lance limite sugerido
  };
  recommendedActions: string[];
  executiveSummary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LotAlert {
  id: string; // Unique configuration ID
  auctionId: string; // References AuctionItem id
  title: string;
  category: AuctionCategory;
  targetDiscount: number;
  currentDiscount: number;
  isActive: boolean;
  notified: boolean;
  dateCreated: string;
}

export interface AuctionPortal {
  id: string;
  name: string;
  url: string;
  state: string; // e.g. "RS"
  status: 'active' | 'inactive';
  scrapingFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  categoryFocus: 'all' | 'real_estate' | 'vehicle';
  notes?: string;
  lastScrapedAt?: string;
  createdBy?: string;
  filterAssetType?: string; // e.g., "all" or sub-types like "Apartamento", "Carro", etc.
  filterCity?: string; // e.g., "all" or specific cities like "Porto Alegre", "Caxias do Sul", etc.
}

export interface VehicleLot {
  id: string;
  model: string;
  year: string;
  km: string;
  fipe: number;
  marketValue?: number;
  suggestedBid: number;
  liquidity: string;
  category: 'Prioritário' | 'Não Indicado';
  riskAnalysis?: string;
  executiveSummary?: string;
  isCustom?: boolean;
}

export interface ImovelLot {
  id: string;
  typeText: string;
  location: string;
  area: string;
  totalArea?: string;
  privateArea?: string;
  condoName?: string;
  link?: string;
  marketValue: number;
  suggestedBid: number;
  saleValue?: number;
  liquidity?: string;
  portalName?: string;
  auctionDate?: string;
  bedrooms?: number;
  garage?: 'Não possui' | 'Box' | 'Rotativo' | string;
  category: 'Prioritário' | 'Não Indicado';
  occupancyStatus: 'Ocupado' | 'Desocupado';
  riskAnalysis?: string;
  executiveSummary?: string;
  isCustom?: boolean;
  commission?: number;
  iptu?: number;
  condominium?: number;
  registration?: string;
  zone?: string;
  registro?: number;
  itbi?: number;
  tabelionato?: number;
  corretagem?: number;
  ir?: number;
  reforma?: number;
  desocupacao?: number;
  notes?: string;
  arrematado?: 'Sim' | 'Não';
  vendido?: 'Sim' | 'Não';
  paymentDate_bid?: string;
  paymentDate_commission?: string;
  paymentDate_iptu?: string;
  paymentDate_condominium?: string;
  paymentDate_registro?: string;
  paymentDate_itbi?: string;
  paymentDate_tabelionato?: string;
  paymentDate_corretagem?: string;
  paymentDate_ir?: string;
  paymentDate_reforma?: string;
  paymentDate_desocupacao?: string;
  paymentDate_sale?: string;
  parcela_emprestimo?: number;
  paymentDate_parcela_emprestimo?: string;
  quitacao_emprestimo?: number;
  paymentDate_quitacao_emprestimo?: string;
  emprestimo?: number;
  paymentDate_emprestimo?: string;
  customExpenses?: { id: string; name: string; value: number; paymentDate?: string }[];
  assignedUserIds?: string[];
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'operator';
  createdAt: string;
}



