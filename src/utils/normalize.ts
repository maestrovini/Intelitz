import { ImovelLot } from '../types';
import { toTitleCase } from './formatters';

export const normalizeImovelLot = (item: any): ImovelLot => {
  if (!item || typeof item !== 'object') {
    return {
      id: `lot-${Date.now()}`,
      businessType: 'Leilão',
      typeText: 'Apartamento',
      location: '',
      area: '0m²',
      marketValue: 0,
      suggestedBid: 0,
      category: 'Prioritário',
      occupancyStatus: 'Ocupado',
      arrematado: 'Não',
      vendido: 'Não',
      assignedUserIds: ['all'],
      userShares: {},
      customExpenses: [],
      notes: ''
    };
  }

  const safeNum = (val: any, defaultVal = 0): number => {
    if (val === undefined || val === null || val === '') return defaultVal;
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    const clean = String(val).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const safeStr = (val: any, defaultVal = ''): string => {
    if (val === undefined || val === null) return defaultVal;
    return String(val);
  };

  // Normalize assignedUserIds
  let assignedUserIds: string[] = ['all'];
  if (Array.isArray(item.assignedUserIds)) {
    assignedUserIds = item.assignedUserIds
      .map((id: any) => safeStr(id).trim())
      .filter((id: string) => id !== '');
    if (assignedUserIds.length === 0) {
      assignedUserIds = ['none'];
    }
  } else if (typeof item.assignedUserIds === 'string' && item.assignedUserIds.trim() !== '') {
    assignedUserIds = [item.assignedUserIds.trim()];
  }

  // Normalize userShares
  let userShares: Record<string, number> = {};
  if (item.userShares && typeof item.userShares === 'object' && !Array.isArray(item.userShares)) {
    Object.entries(item.userShares).forEach(([uid, share]) => {
      userShares[uid] = safeNum(share, 0);
    });
  }

  // Normalize customExpenses
  let customExpenses: { id: string; name: string; value: number; paymentDate?: string }[] = [];
  if (Array.isArray(item.customExpenses)) {
    customExpenses = item.customExpenses.map((exp: any, idx: number) => ({
      id: safeStr(exp?.id || `exp-${idx}-${Date.now()}`),
      name: toTitleCase(safeStr(exp?.name || 'Despesa Extra')),
      value: safeNum(exp?.value, 0),
      paymentDate: exp?.paymentDate ? safeStr(exp.paymentDate) : undefined
    }));
  }

  const arrematadoVal: 'Sim' | 'Não' =
    item.arrematado === 'Sim' || item.arrematado === true || item.arrematado === 'sim' ? 'Sim' : 'Não';

  const vendidoVal: 'Sim' | 'Não' =
    item.vendido === 'Sim' || item.vendido === true || item.vendido === 'sim' ? 'Sim' : 'Não';

  const businessTypeVal: 'Leilão' | 'House Flipping' =
    item.businessType === 'House Flipping' ? 'House Flipping' : 'Leilão';

  const categoryVal: 'Prioritário' | 'Não Indicado' =
    item.category === 'Não Indicado' ? 'Não Indicado' : 'Prioritário';

  const occupancyVal: 'Ocupado' | 'Desocupado' =
    item.occupancyStatus === 'Desocupado' || item.occupancyStatus === 'desocupado' ? 'Desocupado' : 'Ocupado';

  return {
    ...item,
    id: safeStr(item.id || `imovel-${Date.now()}`),
    businessType: businessTypeVal,
    typeText: toTitleCase(safeStr(item.typeText, 'Apartamento')),
    location: toTitleCase(safeStr(item.location, '')),
    area: safeStr(item.area, '0m²'),
    totalArea: item.totalArea !== undefined ? safeStr(item.totalArea) : undefined,
    privateArea: item.privateArea !== undefined ? safeStr(item.privateArea) : undefined,
    condoName: item.condoName !== undefined ? toTitleCase(safeStr(item.condoName)) : undefined,
    link: item.link !== undefined ? safeStr(item.link) : undefined,
    marketValue: safeNum(item.marketValue, 0),
    suggestedBid: safeNum(item.suggestedBid, 0),
    saleValue: item.saleValue !== undefined ? safeNum(item.saleValue, 0) : undefined,
    liquidity: item.liquidity !== undefined ? safeStr(item.liquidity) : undefined,
    portalName: item.portalName !== undefined ? toTitleCase(safeStr(item.portalName)) : undefined,
    auctionDate: item.auctionDate !== undefined ? safeStr(item.auctionDate) : undefined,
    bedrooms: item.bedrooms !== undefined ? safeNum(item.bedrooms, 0) : undefined,
    garage: item.garage !== undefined ? toTitleCase(safeStr(item.garage)) : undefined,
    category: categoryVal,
    occupancyStatus: occupancyVal,
    riskAnalysis: item.riskAnalysis !== undefined ? safeStr(item.riskAnalysis) : undefined,
    executiveSummary: item.executiveSummary !== undefined ? safeStr(item.executiveSummary) : undefined,
    isCustom: Boolean(item.isCustom),
    commission: item.commission !== undefined ? safeNum(item.commission, 5) : 5,
    iptu: safeNum(item.iptu, 0),
    condominium: safeNum(item.condominium, 0),
    registration: item.registration !== undefined ? safeStr(item.registration) : undefined,
    zone: item.zone !== undefined ? toTitleCase(safeStr(item.zone)) : undefined,
    registro: safeNum(item.registro, 0),
    itbi: safeNum(item.itbi, 0),
    tabelionato: safeNum(item.tabelionato, 0),
    corretagem: safeNum(item.corretagem, 0),
    ir: safeNum(item.ir, 0),
    reforma: safeNum(item.reforma, 0),
    desocupacao: safeNum(item.desocupacao, 0),
    notes: safeStr(item.notes, ''),
    arrematado: arrematadoVal,
    vendido: vendidoVal,
    paymentDate_bid: item.paymentDate_bid ? safeStr(item.paymentDate_bid) : undefined,
    paymentDate_commission: item.paymentDate_commission ? safeStr(item.paymentDate_commission) : undefined,
    paymentDate_iptu: item.paymentDate_iptu ? safeStr(item.paymentDate_iptu) : undefined,
    paymentDate_condominium: item.paymentDate_condominium ? safeStr(item.paymentDate_condominium) : undefined,
    paymentDate_registro: item.paymentDate_registro ? safeStr(item.paymentDate_registro) : undefined,
    paymentDate_itbi: item.paymentDate_itbi ? safeStr(item.paymentDate_itbi) : undefined,
    paymentDate_tabelionato: item.paymentDate_tabelionato ? safeStr(item.paymentDate_tabelionato) : undefined,
    paymentDate_corretagem: item.paymentDate_corretagem ? safeStr(item.paymentDate_corretagem) : undefined,
    paymentDate_ir: item.paymentDate_ir ? safeStr(item.paymentDate_ir) : undefined,
    paymentDate_reforma: item.paymentDate_reforma ? safeStr(item.paymentDate_reforma) : undefined,
    paymentDate_desocupacao: item.paymentDate_desocupacao ? safeStr(item.paymentDate_desocupacao) : undefined,
    paymentDate_sale: item.paymentDate_sale ? safeStr(item.paymentDate_sale) : undefined,
    parcela_emprestimo: safeNum(item.parcela_emprestimo, 0),
    paymentDate_parcela_emprestimo: item.paymentDate_parcela_emprestimo ? safeStr(item.paymentDate_parcela_emprestimo) : undefined,
    quitacao_emprestimo: safeNum(item.quitacao_emprestimo, 0),
    paymentDate_quitacao_emprestimo: item.paymentDate_quitacao_emprestimo ? safeStr(item.paymentDate_quitacao_emprestimo) : undefined,
    emprestimo: safeNum(item.emprestimo, 0),
    paymentDate_emprestimo: item.paymentDate_emprestimo ? safeStr(item.paymentDate_emprestimo) : undefined,
    customExpenses,
    assignedUserIds,
    userShares
  };
};

