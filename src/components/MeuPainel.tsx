import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Car, Globe, TrendingUp, DollarSign, Percent, 
  ArrowRight, Sparkles, CheckCircle2, MapPin, ExternalLink,
  Wallet, Landmark, Users, ChevronUp, ChevronDown, X,
  FileText, Info, Bed, FileDown, ShieldCheck, UserCheck, Ruler,
  Calendar, CheckSquare, ChevronsUpDown, ShieldAlert, StickyNote, Pencil, Trash2, Plus, Calculator
} from 'lucide-react';
import { AppUser, ImovelLot, VehicleLot, AuctionPortal } from '../types';
import { calculateEstimatedProfit, calculateRiskLevel, calculateMarketLiquidity, handleExportPDF } from './LotesImovel';
import { BRAZIL_STATES, BRAZIL_CITIES } from '../utils/brazilData';
import RoiPotentialChart from './RoiPotentialChart';
import CashFlowTimeline from './CashFlowTimeline';

const parseValueToNumber = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const trimmed = String(val).trim();
  if (!trimmed) return 0;
  const clean = trimmed.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const formatValueToBrazilian = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  }
  return String(val);
};

const formatTypingToBrazilian = (valueStr: string): string => {
  const clean = valueStr.replace(/\D/g, '');
  if (!clean) return '';
  const num = parseInt(clean, 10);
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num / 100);
};

const parseLocation = (locStr: string = '') => {
  let street = locStr;
  let number = '';
  let complement = '';
  let neighborhood = '';
  let city = 'Porto Alegre';
  let state = 'RS';

  try {
    const parts = locStr.split('-');
    if (parts.length >= 2) {
      const cityStatePart = parts[parts.length - 1].trim();
      const cityStateTokens = cityStatePart.split('/');
      if (cityStateTokens.length === 2) {
        city = cityStateTokens[0].trim();
        state = cityStateTokens[1].trim();
      } else {
        city = cityStatePart;
      }

      const addressPart = parts.slice(0, parts.length - 1).join('-').trim();
      const commaParts = addressPart.split(',');
      if (commaParts.length >= 1) street = commaParts[0].trim();
      if (commaParts.length >= 2) {
        const numAndComp = commaParts[1].trim();
        const numMatch = numAndComp.match(/^([^\s]+)(.*)$/);
        if (numMatch) {
          number = numMatch[1];
          complement = numMatch[2].trim();
        } else {
          number = numAndComp;
        }
      }
      if (commaParts.length >= 3) neighborhood = commaParts[2].trim();
    }
  } catch (err) {
    console.error('Error parsing location:', err);
    street = locStr;
  }

  return { street, number, complement, neighborhood, city, state };
};

const getSuggestedBidOnFly = (marketValue: string, commissionPercent: number = 5) => {
  const num = parseValueToNumber(marketValue);
  if (!num) return 0;
  const divisor = 1 + (commissionPercent / 100) + 0.03;
  return Math.max(0, Math.floor((0.60 * num - 5000) / divisor));
};

interface MeuPainelProps {
  currentUser: AppUser | null;
  properties: ImovelLot[];
  setProperties?: React.Dispatch<React.SetStateAction<ImovelLot[]>>;
  vehicles: VehicleLot[];
  portals: AuctionPortal[];
  users?: AppUser[];
  onNavigate: (tabId: string) => void;
}

const formatBRL = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

const formatPercentBR = (val: number) => {
  if (!isFinite(val) || isNaN(val)) return '0,00';
  return val.toFixed(2).replace('.', ',');
};

const getSplitLocation = (locStr: string = '') => {
  if (!locStr) return { mainAddress: 'Endereço não informado', cityState: '' };
  const parts = locStr.split('-');
  if (parts.length >= 2) {
    const cityState = parts[parts.length - 1].trim();
    const mainAddress = parts.slice(0, parts.length - 1).join('-').trim();
    return { mainAddress, cityState };
  }
  return { mainAddress: locStr, cityState: '' };
};

const getAuctionCountdown = (dateStr?: string) => {
  if (!dateStr) return null;
  
  let targetDate: Date;
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    targetDate = new Date(year, month - 1, day);
  } else if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    targetDate = new Date(year, month - 1, day);
  } else {
    targetDate = new Date(dateStr);
  }

  if (isNaN(targetDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Encerrado', diffDays, isToday: false };
  }
  if (diffDays === 0) {
    return { text: 'Hoje!', diffDays: 0, isToday: true };
  }
  return { text: `${diffDays} dia(s)`, diffDays, isToday: false };
};

const parseDateString = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const matchYMD = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchYMD) {
    return new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10));
  }
  const matchDMY = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (matchDMY) {
    return new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10));
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const getTransactionDate = (field: string, daysOffset: number, property: ImovelLot): Date => {
  let customDateStr: string | undefined;
  if (field.startsWith('custom_expense_date_')) {
    const expenseId = field.replace('custom_expense_date_', '');
    const exp = (property.customExpenses || []).find(e => e.id === expenseId);
    customDateStr = exp?.paymentDate;
  } else {
    customDateStr = property[field as keyof ImovelLot] as string | undefined;
  }
  if (customDateStr) {
    return parseDateString(customDateStr);
  }
  let baseDate = new Date();
  if (property.auctionDate) {
    baseDate = parseDateString(property.auctionDate);
  }
  const result = new Date(baseDate);
  result.setDate(result.getDate() + daysOffset);
  return result;
};

const calculateDefaultDateStr = (daysOffset: number, property: ImovelLot): string => {
  let baseDate = new Date();
  if (property.auctionDate) {
    baseDate = parseDateString(property.auctionDate);
  }
  const result = new Date(baseDate);
  result.setDate(result.getDate() + daysOffset);
  const yyyy = result.getFullYear();
  const mm = String(result.getMonth() + 1).padStart(2, '0');
  const dd = String(result.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

interface MiniCardMetricsTagsProps {
  aporteInicial: number;
  roiTotal: number;
  lucroTotal: number;
}

const MiniCardMetricsTags: React.FC<MiniCardMetricsTagsProps> = ({
  aporteInicial,
  roiTotal,
  lucroTotal
}) => {
  return (
    <div className="mt-1 pt-1 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 p-2 sm:p-2.5 rounded-b-2xl">
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="flex flex-col items-center bg-black py-1 px-1.5 rounded-lg border border-[#2C2C2E]/80">
          <span className="text-slate-400 text-[8.5px] sm:text-[9px] uppercase tracking-wider font-semibold">Aporte Inicial</span>
          <span className="text-amber-400 font-black font-mono text-[11px] sm:text-xs truncate w-full">{formatBRL(aporteInicial)}</span>
        </div>
        <div className="flex flex-col items-center bg-black py-1 px-1.5 rounded-lg border border-[#2C2C2E]/80">
          <span className="text-slate-400 text-[8.5px] sm:text-[9px] uppercase tracking-wider font-semibold">ROI Total</span>
          <span className="text-emerald-400 font-black font-mono text-[11px] sm:text-xs truncate w-full">{formatPercentBR(roiTotal)}%</span>
        </div>
        <div className="flex flex-col items-center bg-black py-1 px-1.5 rounded-lg border border-[#2C2C2E]/80">
          <span className="text-slate-400 text-[8.5px] sm:text-[9px] uppercase tracking-wider font-semibold">Lucro Total</span>
          <span className={`font-black font-mono text-[11px] sm:text-xs truncate w-full ${lucroTotal >= 0 ? 'text-[#10B981]' : 'text-rose-400'}`}>
            {formatBRL(lucroTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function MeuPainel({
  currentUser,
  properties,
  setProperties,
  vehicles,
  portals,
  users = [],
  onNavigate
}: MeuPainelProps) {
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'operator';
  const userName = currentUser?.name ? currentUser.name : 'Usuário';
  const userFirstName = userName.split(' ')[0];

  const targetUser = currentUser 
    ? (users.find(u => u.id === currentUser.id || u.username === currentUser.username) || currentUser)
    : (users.length > 0 ? users[0] : null);

  const [selectedProperty, setSelectedProperty] = useState<ImovelLot | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Section expansion state
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);
  const [isPortalExpanded, setIsPortalExpanded] = useState(true);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isPricingExpanded, setIsPricingExpanded] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isRiskExpanded, setIsRiskExpanded] = useState(false);
  const [isLiquidityExpanded, setIsLiquidityExpanded] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  // Dropdown & quick edit states
  const [participationPercent, setParticipationPercent] = useState<number>(100);
  const [isParticipationDropdownOpen, setIsParticipationDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [editingCardField, setEditingCardField] = useState<{ id: string; field: string } | null>(null);
  const [editCardValue, setEditCardValue] = useState<string>('');
  const [showAddCostSelector, setShowAddCostSelector] = useState<boolean>(false);
  const [customCostName, setCustomCostName] = useState<string>('');
  const [isCustomCostSelected, setIsCustomCostSelected] = useState<boolean>(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  // States for Editing a Lot
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<ImovelLot | null>(null);
  const [editTypeText, setEditTypeText] = useState('Apartamento');
  const [editCondoName, setEditCondoName] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editComplement, setEditComplement] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editState, setEditState] = useState('RS');
  const [editCity, setEditCity] = useState('Porto Alegre');
  const [editArea, setEditArea] = useState('');
  const [editPrivateArea, setEditPrivateArea] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editMarketValue, setEditMarketValue] = useState('');
  const [editSuggestedBid, setEditSuggestedBid] = useState('');
  const [editPortalName, setEditPortalName] = useState('');
  const [editAuctionDate, setEditAuctionDate] = useState('');
  const [editBedrooms, setEditBedrooms] = useState<number>(2);
  const [editGarage, setEditGarage] = useState<string>('Box');
  const [editRegistration, setEditRegistration] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editCategory, setEditCategory] = useState<string>('Prioritário');
  const [editOccupancyStatus, setEditOccupancyStatus] = useState<string>('Ocupado');
  const [editCommission, setEditCommission] = useState<number>(5);
  const [editIptu, setEditIptu] = useState('');
  const [editCondominium, setEditCondominium] = useState('');
  const [editRegistro, setEditRegistro] = useState('');
  const [editItbi, setEditItbi] = useState('');
  const [editTabelionato, setEditTabelionato] = useState('');
  const [editCorretagem, setEditCorretagem] = useState<number>(0);
  const [editIr, setEditIr] = useState<number>(0);
  const [editReforma, setEditReforma] = useState('');
  const [editDesocupacao, setEditDesocupacao] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const portalsList = portals.map(p => p.name);
  const editCitiesList = BRAZIL_CITIES[editState] || [editCity];

  // Open Edit Modal with selected lot's details loaded
  const handleEditLot = (item: ImovelLot, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingLot(item);
    setEditTypeText(item.typeText);
    setEditCondoName(item.condoName || '');
    
    const parsed = parseLocation(item.location);
    setEditStreet(parsed.street);
    setEditNumber(parsed.number);
    setEditComplement(parsed.complement);
    setEditNeighborhood(parsed.neighborhood);
    setEditState(parsed.state || 'RS');
    setEditCity(parsed.city || 'Porto Alegre');

    setEditArea(formatValueToBrazilian(item.area));
    setEditPrivateArea(item.privateArea ? formatValueToBrazilian(item.privateArea) : '');
    setEditLink(item.link || '');
    setEditMarketValue(formatValueToBrazilian(item.marketValue));
    setEditSuggestedBid(formatValueToBrazilian(item.suggestedBid));
    setEditPortalName(item.portalName || portalsList[0] || 'Pestana Leilões');
    setEditAuctionDate(item.auctionDate || '');
    setEditBedrooms(item.bedrooms || 2);
    setEditGarage((item.garage as any) || 'Box');
    setEditRegistration(item.registration || '');
    setEditZone(item.zone || '');
    setEditCategory(item.category || 'Prioritário');
    setEditOccupancyStatus(item.occupancyStatus || 'Ocupado');
    setEditCommission(item.commission !== undefined ? item.commission : 5);
    setEditIptu(item.iptu !== undefined ? formatValueToBrazilian(item.iptu) : '');
    setEditCondominium(item.condominium !== undefined ? formatValueToBrazilian(item.condominium) : '');
    setEditRegistro(item.registro !== undefined ? formatValueToBrazilian(item.registro) : '');
    setEditItbi(item.itbi !== undefined ? formatValueToBrazilian(item.itbi) : '');
    setEditTabelionato(item.tabelionato !== undefined ? formatValueToBrazilian(item.tabelionato) : '');
    setEditCorretagem(item.corretagem !== undefined ? item.corretagem : 0);
    setEditIr(item.ir !== undefined ? item.ir : 0);
    setEditReforma(item.reforma !== undefined ? formatValueToBrazilian(item.reforma) : '');
    setEditDesocupacao(item.desocupacao !== undefined ? formatValueToBrazilian(item.desocupacao) : '');
    setIsEditModalOpen(true);
  };

  // Save the edited lot
  const handleSaveEditLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLot) return;

    let combinedLocation = '';
    const stateLabel = editState;
    if (editStreet.trim()) {
      combinedLocation = editStreet.trim();
      if (editNumber.trim()) combinedLocation += `, ${editNumber.trim()}`;
      if (editComplement.trim()) combinedLocation += ` ${editComplement.trim()}`;
      if (editNeighborhood.trim()) combinedLocation += `, ${editNeighborhood.trim()}`;
      if (editCity.trim()) combinedLocation += ` - ${editCity.trim()}/${stateLabel}`;
    }

    const marketValueNum = parseValueToNumber(editMarketValue);
    const suggestedBidNum = editSuggestedBid 
      ? parseValueToNumber(editSuggestedBid) 
      : Math.max(0, Math.floor((0.60 * marketValueNum - 5000) / (1 + (editCommission / 100) + 0.03)));
    const savedArea = editArea ? (editArea.includes('m²') ? editArea : `${editArea} m²`) : 'Não informado';
    const savedPrivateArea = editPrivateArea ? (editPrivateArea.includes('m²') ? editPrivateArea : `${editPrivateArea} m²`) : undefined;

    const updatedLot: ImovelLot = {
      ...editingLot,
      typeText: editTypeText,
      condoName: editCondoName.trim() || undefined,
      location: combinedLocation,
      area: savedArea,
      privateArea: savedPrivateArea,
      link: editLink.trim() || undefined,
      marketValue: marketValueNum,
      suggestedBid: suggestedBidNum,
      portalName: editPortalName,
      auctionDate: editAuctionDate,
      bedrooms: editBedrooms,
      garage: editGarage as any,
      registration: editRegistration.trim() || undefined,
      zone: editZone.trim() || undefined,
      iptu: editIptu ? parseValueToNumber(editIptu) : undefined,
      condominium: editCondominium ? parseValueToNumber(editCondominium) : undefined,
      registro: editRegistro ? parseValueToNumber(editRegistro) : undefined,
      itbi: editItbi ? parseValueToNumber(editItbi) : undefined,
      tabelionato: editTabelionato ? parseValueToNumber(editTabelionato) : undefined,
      corretagem: editCorretagem,
      ir: editIr,
      reforma: editReforma ? parseValueToNumber(editReforma) : undefined,
      desocupacao: editDesocupacao ? parseValueToNumber(editDesocupacao) : undefined,
      category: editCategory,
      occupancyStatus: editOccupancyStatus
    };

    if (setProperties) {
      setProperties(prev => prev.map(p => p.id === editingLot.id ? updatedLot : p));
    }
    if (selectedProperty && selectedProperty.id === editingLot.id) {
      setSelectedProperty(updatedLot);
    }

    setIsEditModalOpen(false);
    setEditingLot(null);
  };

  const handleRemoveLot = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (setProperties) {
      setProperties(prev => prev.filter(p => p.id !== id));
    }
    if (selectedProperty && selectedProperty.id === id) {
      setSelectedProperty(null);
      setShowDetails(false);
    }
    setDeleteConfirmId(null);
  };

  const assignableUsers = users.filter(u => u.id !== 'usr-admin' && u.username !== 'admin');

  const isUserAssignedToLot = (lot: ImovelLot, user: AppUser) => {
    if (user.role === 'admin' || user.username === 'admin' || user.username === 'intelitz' || user.id === 'usr-admin') {
      return true;
    }
    if (!lot.assignedUserIds || lot.assignedUserIds.length === 0 || lot.assignedUserIds.includes('all')) {
      return true;
    }
    if (lot.assignedUserIds.includes('none')) {
      return false;
    }
    return lot.assignedUserIds.includes(user.id) || (user.username && lot.assignedUserIds.includes(user.username));
  };

  const isAllUsersAssigned = (assignedUserIds?: string[], usersList: AppUser[] = assignableUsers) => {
    if (!assignedUserIds || assignedUserIds.includes('all')) {
      return true;
    }
    if (assignedUserIds.includes('none')) {
      return false;
    }
    if (usersList.length > 0 && usersList.every(u => assignedUserIds.includes(u.id))) {
      return true;
    }
    return false;
  };

  const isUserAssigned = (assignedUserIds: string[] | undefined, userId: string, usersList: AppUser[] = assignableUsers) => {
    if (!assignedUserIds || assignedUserIds.includes('all')) {
      return true;
    }
    if (assignedUserIds.includes('none')) {
      return false;
    }
    return assignedUserIds.includes(userId);
  };

  const getAssignedUsersLabel = (assignedUserIds: string[] | undefined, usersList: AppUser[] = assignableUsers) => {
    if (isAllUsersAssigned(assignedUserIds, usersList)) {
      return 'Todos';
    }
    const assigned = (assignedUserIds || []).filter(id => id !== 'none' && id !== 'all');
    if (assigned.length === 0) {
      return 'Intelitz';
    }
    if (assigned.length === 1) {
      const foundUser = usersList.find(u => u.id === assigned[0]);
      return foundUser ? (foundUser.name ? foundUser.name.split(' ')[0] : foundUser.username) : '1 Usuário';
    }
    return `${assigned.length} Usuários`;
  };

  const updatePropertyAssignedUsers = (propertyId: string, newAssignedUserIds: string[]) => {
    if (!setProperties) return;
    setProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        return { ...p, assignedUserIds: newAssignedUserIds };
      }
      return p;
    }));
  };

  const toggleUserAssignment = (propertyId: string, userId: string, currentAssignedIds: string[] | undefined, usersList: AppUser[] = assignableUsers) => {
    const allIds = usersList.map(u => u.id);
    let updated: string[] = [];

    if (isAllUsersAssigned(currentAssignedIds, usersList)) {
      updated = allIds.filter(id => id !== userId);
    } else {
      const current = (currentAssignedIds || []).filter(id => id !== 'none' && id !== 'all');
      if (current.includes(userId)) {
        updated = current.filter(id => id !== userId);
      } else {
        updated = [...current, userId];
      }
      if (usersList.length > 0 && usersList.every(u => updated.includes(u.id))) {
        updated = ['all'];
      }
    }

    if (updated.length === 0) {
      updated = ['none'];
    }

    updatePropertyAssignedUsers(propertyId, updated);
  };

  const handleQuickEditCardSave = (id: string, field: string, valueStr: string) => {
    if (!setProperties) return;
    if (field.startsWith('custom_expense_date_')) {
      const expenseId = field.replace('custom_expense_date_', '');
      const dateVal = valueStr.trim();
      setProperties(prev => prev.map(item => {
        if (item.id === id) {
          const customExpenses = (item.customExpenses || []).map(exp => 
            exp.id === expenseId ? { ...exp, paymentDate: dateVal } : exp
          );
          return { ...item, customExpenses };
        }
        return item;
      }));
      if (selectedProperty && selectedProperty.id === id) {
        setSelectedProperty(prev => prev ? {
          ...prev,
          customExpenses: (prev.customExpenses || []).map(exp => 
            exp.id === expenseId ? { ...exp, paymentDate: dateVal } : exp
          )
        } : null);
      }
      setEditingCardField(null);
      return;
    }

    if (field.startsWith('custom_expense_value_')) {
      const expenseId = field.replace('custom_expense_value_', '');
      const clean = valueStr.trim().replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
      const numValue = parseFloat(clean);
      if (isNaN(numValue) || numValue < 0) {
        setEditingCardField(null);
        return;
      }
      setProperties(prev => prev.map(item => {
        if (item.id === id) {
          const customExpenses = (item.customExpenses || []).map(exp => 
            exp.id === expenseId ? { ...exp, value: numValue } : exp
          );
          return { ...item, customExpenses };
        }
        return item;
      }));
      if (selectedProperty && selectedProperty.id === id) {
        setSelectedProperty(prev => prev ? {
          ...prev,
          customExpenses: (prev.customExpenses || []).map(exp => 
            exp.id === expenseId ? { ...exp, value: numValue } : exp
          )
        } : null);
      }
      setEditingCardField(null);
      return;
    }

    if (field.startsWith('paymentDate_')) {
      const dateVal = valueStr.trim();
      setProperties(prev => prev.map(item => item.id === id ? { ...item, [field]: dateVal } : item));
      if (selectedProperty && selectedProperty.id === id) {
        setSelectedProperty(prev => prev ? { ...prev, [field]: dateVal } : null);
      }
      setEditingCardField(null);
      return;
    }

    const clean = valueStr.trim().replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    const numValue = parseFloat(clean);

    if (isNaN(numValue) || numValue < 0) {
      setEditingCardField(null);
      return;
    }

    setProperties(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: numValue };
        if (field === 'marketValue') {
          const commission = item.commission !== undefined ? item.commission : 5;
          const divisor = 1 + (commission / 100) + 0.03;
          updatedItem.suggestedBid = Math.max(0, Math.floor((0.60 * numValue - 5000) / divisor));
        }
        const finalMarket = updatedItem.marketValue;
        const finalBid = updatedItem.suggestedBid;
        updatedItem.executiveSummary = `Calculado sob a Regra de 60% do valor de mercado estimado em R$ ${finalMarket.toLocaleString('pt-BR')}: Sugerido lance máximo de R$ ${finalBid.toLocaleString('pt-BR')} para obter margem financeira robusta.`;
        return updatedItem;
      }
      return item;
    }));

    if (selectedProperty && selectedProperty.id === id) {
      setSelectedProperty(prev => {
        if (!prev) return null;
        const updatedItem = { ...prev, [field]: numValue };
        if (field === 'marketValue') {
          const commission = prev.commission !== undefined ? prev.commission : 5;
          const divisor = 1 + (commission / 100) + 0.03;
          updatedItem.suggestedBid = Math.max(0, Math.floor((0.60 * numValue - 5000) / divisor));
        }
        return updatedItem;
      });
    }

    setEditingCardField(null);
  };

  const handleRemoveCostItem = (field: string) => {
    if (!setProperties || !selectedProperty) return;
    const id = selectedProperty.id;
    if (field.startsWith('custom_expense_value_')) {
      const expenseId = field.replace('custom_expense_value_', '');
      setProperties(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            customExpenses: (item.customExpenses || []).filter(exp => exp.id !== expenseId)
          };
        }
        return item;
      }));
      setSelectedProperty(prev => prev ? {
        ...prev,
        customExpenses: (prev.customExpenses || []).filter(exp => exp.id !== expenseId)
      } : null);
    } else {
      const dateField = `paymentDate_${field}`;
      setProperties(prev => prev.map(item => item.id === id ? { ...item, [field]: 0, [dateField]: '' } : item));
      setSelectedProperty(prev => prev ? { ...prev, [field]: 0, [dateField]: '' } : null);
    }
  };

  const handleSaveNotes = (newNotes: string) => {
    if (!selectedProperty) return;
    if (setProperties) {
      setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, notes: newNotes } : p));
    }
    setSelectedProperty(prev => prev ? { ...prev, notes: newNotes } : null);
    setIsEditingNotes(false);
  };

  const handleToggleArrematado = (value: 'Sim' | 'Não') => {
    if (!selectedProperty) return;
    if (setProperties) {
      setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, arrematado: value } : p));
    }
    setSelectedProperty(prev => prev ? { ...prev, arrematado: value } : null);
  };

  const handleToggleVendido = (value: 'Sim' | 'Não') => {
    if (!selectedProperty) return;
    if (setProperties) {
      setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, vendido: value } : p));
    }
    setSelectedProperty(prev => prev ? { ...prev, vendido: value } : null);
  };

  // Filter arrematados properties for target user
  const userArrematadosProperties = targetUser
    ? properties.filter(p => p.arrematado === 'Sim' && isUserAssignedToLot(p, targetUser))
    : properties.filter(p => p.arrematado === 'Sim');

  // Calculate Imóveis Totals
  const propertiesMetrics = properties.map(p => {
    const profitData = calculateEstimatedProfit(p);
    return {
      marketValue: p.marketValue || 0,
      upfrontCosts: profitData.upfrontCosts || 0,
      capitalProprio: profitData.capitalProprio || 0,
      recursosTerceiros: profitData.recursosTerceiros || 0,
      netProfit: profitData.netProfit || 0,
      roiPercent: profitData.roiPercent || 0,
      arrematado: p.arrematado === 'Sim'
    };
  });

  // Imóveis Arrematados Specific Totals
  const arrematadosMetrics = propertiesMetrics.filter(p => p.arrematado);
  const countPropArrematados = userArrematadosProperties.length;
  const totalArrematadosCapitalProprio = userArrematadosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).capitalProprio, 0);
  const totalArrematadosRecursosTerceiros = userArrematadosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).recursosTerceiros, 0);
  const totalArrematadosUpfront = totalArrematadosCapitalProprio + totalArrematadosRecursosTerceiros;

  // Imóveis Vendidos Specific Totals (Lucro Líquido apenas dos imóveis vendidos)
  const userVendidosProperties = targetUser
    ? properties.filter(p => p.vendido === 'Sim' && isUserAssignedToLot(p, targetUser))
    : properties.filter(p => p.vendido === 'Sim');
  const countPropVendidos = userVendidosProperties.length;
  const totalVendidosNetProfit = userVendidosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).netProfit, 0);

  // Imóveis Esperados Specific Totals (Lucro Líquido dos vendidos + arrematados + imóveis do usuário)
  const userEsperadosProperties = targetUser
    ? properties.filter(p => {
        const isAssigned = isUserAssignedToLot(p, targetUser);
        if (!isAssigned) return false;
        return p.vendido === 'Sim' || p.arrematado === 'Sim' || (p.assignedUserIds && p.assignedUserIds.length > 0) || isAssigned;
      })
    : properties.filter(p => p.vendido === 'Sim' || p.arrematado === 'Sim' || (p.assignedUserIds && p.assignedUserIds.length > 0));
  const countPropEsperados = userEsperadosProperties.length;
  const totalEsperadosNetProfit = userEsperadosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).netProfit, 0);

  const avgPropRoi = userArrematadosProperties.length > 0 
    ? userArrematadosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).roiPercent, 0) / userArrematadosProperties.length 
    : 0;

  return (
    <div className="space-y-8 w-full max-w-none px-0 py-2">
      {/* Top Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2.5 py-1"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Olá, <span className="text-emerald-600 dark:text-emerald-400">{userFirstName}</span>!
        </h1>
        
        <p className="text-lg md:text-xl font-medium text-zinc-650 dark:text-zinc-300">
          Visão geral do seu portfólio
        </p>

        <p className="text-sm text-zinc-550 dark:text-zinc-400 max-w-3xl leading-relaxed">
          Acompanhe em tempo real as métricas financeiras, aportes, lucro líquido e imóveis arrematados do seu portfólio.
        </p>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
        {/* Col 1: Aporte Próprio */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 h-full"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Aporte Próprio</span>
            <div className="text-lg md:text-xl font-black font-mono text-emerald-400 leading-tight">
              {formatBRL(totalArrematadosCapitalProprio)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Capital próprio nos imóveis arrematados ({countPropArrematados})
            </p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 flex items-center justify-center">
            <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        </motion.div>

        {/* Col 2: Aporte de Terceiros e Aporte Total (Um abaixo do outro) */}
        <div className="flex flex-col gap-3">
          {/* Aporte de Terceiros */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Aporte de Terceiros</span>
              <div className="text-lg md:text-xl font-black font-mono text-blue-400 leading-tight">
                {formatBRL(totalArrematadosRecursosTerceiros)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Recursos de terceiros nos imóveis arrematados ({countPropArrematados})
              </p>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0 flex items-center justify-center">
              <Landmark className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          </motion.div>

          {/* Card Aporte Total (Abaixo do Aporte de Terceiros) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Aporte Total</span>
              <div className="text-lg md:text-xl font-black font-mono text-amber-400 leading-tight">
                {formatBRL(totalArrematadosUpfront)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Soma de Aporte Próprio + Terceiros
              </p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 flex items-center justify-center">
              <DollarSign className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          </motion.div>
        </div>

        {/* Col 3: Lucro Líquido e Lucro Líquido Esperado (Um abaixo do outro) */}
        <div className="flex flex-col gap-3">
          {/* Lucro Líquido (Somente Imóveis Vendidos) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Lucro Líquido</span>
              <div className="text-lg md:text-xl font-black font-mono text-[#10B981] leading-tight">
                {formatBRL(totalVendidosNetProfit)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Total dos imóveis vendidos ({countPropVendidos})
              </p>
            </div>
            <div className="p-2.5 bg-[#10B981]/10 text-[#10B981] rounded-xl shrink-0 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          </motion.div>

          {/* Lucro Líquido Esperado (Vendidos, Arrematados e Imóveis Relacionados ao Usuário) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.22 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Lucro Líquido Esperado</span>
              <div className="text-lg md:text-xl font-black font-mono text-emerald-300 leading-tight">
                {formatBRL(totalEsperadosNetProfit)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Vendidos, arrematados e relacionados ({countPropEsperados})
              </p>
            </div>
            <div className="p-2.5 bg-emerald-400/10 text-emerald-300 rounded-xl shrink-0 flex items-center justify-center">
              <Calculator className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          </motion.div>
        </div>

        {/* Col 4: ROI Médio Estimado */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 h-full"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">ROI Médio Estimado</span>
            <div className="text-lg md:text-xl font-black font-mono text-purple-400 leading-tight">
              {formatPercentBR(avgPropRoi)}%
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Retorno sobre investimento médio
            </p>
          </div>
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl shrink-0 flex items-center justify-center">
            <Percent className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        </motion.div>
      </div>

      {/* IMÓVEIS ARREMATADOS SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="space-y-4 pt-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-[#10B981]" />
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Imóveis Arrematados ({countPropArrematados})
            </h2>
          </div>
        </div>

        {userArrematadosProperties.length === 0 ? (
          <div className="p-10 text-center bg-[#0E0E0E] border border-[#2C2C2E] rounded-3xl space-y-2">
            <Building className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Nenhum imóvel arrematado encontrado</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Quando houver imóveis com o status "Arrematado = Sim" atribuídos ao seu usuário, eles aparecerão detalhadamente nesta lista.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {userArrematadosProperties.map((item) => {
              const isSelected = selectedProperty?.id === item.id;
              const profitData = calculateEstimatedProfit(item);
              const { mainAddress, cityState } = getSplitLocation(item.location);
              const countdown = getAuctionCountdown(item.auctionDate);
              const isArrematado = item.arrematado === 'Sim';
              const isEncerrado = countdown && (countdown.diffDays < 0 || countdown.text?.includes('Encerrado'));

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedProperty(item);
                    setTempNotes(item.notes || '');
                    setShowDetails(true);
                  }}
                  className={`group rounded-2xl p-3.5 sm:p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col w-full border ${
                    isArrematado
                      ? `bg-emerald-950/30 border-emerald-500/40 md:hover:border-emerald-400 md:hover:bg-emerald-900/40 ${
                          isSelected ? 'shadow-sm border-emerald-400 ring-1 ring-emerald-400/40' : ''
                        }`
                      : `bg-[#0E0E0E] border-[#2C2C2E]/70 md:hover:border-emerald-500/50 md:hover:bg-[#141416] ${
                          isSelected ? 'shadow-sm md:border-emerald-500/50 border-[#2C2C2E]/70' : ''
                        }`
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Top: City Name on Left, User & Tempo Faltante on Right */}
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="text-sm md:text-base font-extrabold font-inter text-[#F8FAFC] md:group-hover:text-emerald-400 md:hover:text-emerald-400 transition-colors leading-snug">
                        {cityState || mainAddress}
                      </div>

                      <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
                        {/* Usuário ao lado esquerdo do prazo faltante */}
                        {!isAllUsersAssigned(item.assignedUserIds, assignableUsers) && (
                          <div className="flex items-center gap-1.5 text-xs md:text-sm font-extrabold font-inter text-blue-400" title="Usuário Vinculado ao Lote">
                            <span>{getAssignedUsersLabel(item.assignedUserIds, assignableUsers)}</span>
                            <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400 shrink-0" />
                          </div>
                        )}

                        {/* Tempo Faltante no topo */}
                        {!(isArrematado && isEncerrado) && (
                          <div className="flex items-center gap-1.5 text-xs md:text-sm font-extrabold font-inter text-white" title="Tempo Faltante">
                            {countdown ? (
                              <span className={countdown.isToday ? 'text-white animate-pulse font-black' : 'text-white'}>
                                {countdown.diffDays > 0 ? `${countdown.diffDays} ${countdown.diffDays === 1 ? 'dia' : 'dias'}` : countdown.diffDays === 0 ? '0 dias' : 'Encerrado'}
                              </span>
                            ) : (
                              <span className="text-white/60">—</span>
                            )}
                            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-white shrink-0" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Below: Condomínio & Address */}
                    <div className="flex items-start gap-1.5 text-xs md:text-sm font-medium text-slate-300 w-full" title={cityState ? mainAddress : item.location}>
                      <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="break-words whitespace-normal leading-normal flex-1">
                        {item.condoName ? <strong className="text-white font-semibold mr-1">{item.condoName} -</strong> : null}
                        {cityState ? mainAddress : item.location}
                      </span>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 rounded-md hover:bg-emerald-500/10 shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold"
                          title="Abrir Link do Leilão"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Link</span>
                        </a>
                      )}
                    </div>

                    {/* 3 Tags: Aporte Inicial, ROI Total, Lucro Total */}
                    <MiniCardMetricsTags
                      aporteInicial={profitData.upfrontCosts}
                      roiTotal={profitData.roiPercent}
                      lucroTotal={profitData.netProfit}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* FLOATING CARD MODAL FOR ARREMATADO PROPERTY DETAILS (EXACTLY MATCHING CONSULTOR IMÓVEIS) */}
      <AnimatePresence>
        {showDetails && selectedProperty && selectedProperty.id && (() => {
          const selectedCommission = selectedProperty.commission !== undefined ? selectedProperty.commission : 5;
          const selectedCommissionValue = selectedProperty.suggestedBid * (selectedCommission / 100);
          const selectedIptuValue = selectedProperty.iptu || 0;
          const selectedCondominiumValue = selectedProperty.condominium || 0;
          const selectedRegistroValue = selectedProperty.registro || 0;
          const selectedItbiValue = selectedProperty.itbi || 0;
          const selectedTabelionatoValue = selectedProperty.tabelionato || 0;
          const selectedCorretagemPercent = selectedProperty.corretagem !== undefined ? selectedProperty.corretagem : 0;
          const selectedSaleValueForCalc = selectedProperty.saleValue !== undefined ? selectedProperty.saleValue : selectedProperty.marketValue;
          const selectedCorretagemValue = selectedSaleValueForCalc * (selectedCorretagemPercent / 100);
          const selectedIrPercent = selectedProperty.ir !== undefined ? selectedProperty.ir : 0;
          const selectedProfitData = calculateEstimatedProfit(selectedProperty);
          const selectedIrValue = selectedProfitData.irVal;
          const selectedReformaValue = selectedProperty.reforma || 0;
          const selectedDesocupacaoValue = selectedProperty.desocupacao || 0;
          const selectedParcelaEmprestimoValue = selectedProperty.parcela_emprestimo || 0;
          const selectedQuitacaoEmprestimoValue = selectedProperty.quitacao_emprestimo || 0;
          const selectedEmprestimoValue = selectedProperty.emprestimo || 0;
          const selectedCustomExpensesValue = (selectedProperty.customExpenses || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
          const selectedUpfrontCosts = selectedProperty.suggestedBid + selectedCommissionValue + selectedIptuValue + selectedCondominiumValue + selectedRegistroValue + selectedItbiValue + selectedTabelionatoValue + selectedReformaValue + selectedDesocupacaoValue + selectedParcelaEmprestimoValue + selectedCustomExpensesValue;
          const selectedCapitalProprio = Math.max(0, selectedUpfrontCosts - selectedEmprestimoValue);
          const selectedRecursosTerceiros = Math.min(selectedUpfrontCosts, selectedEmprestimoValue);
          const selectedTotalCost = selectedUpfrontCosts - selectedEmprestimoValue + selectedQuitacaoEmprestimoValue + selectedCorretagemValue + selectedIrValue;
          const selectedRealDiscount = selectedProperty.marketValue > 0 
            ? Math.round(((selectedProperty.marketValue - selectedTotalCost) / selectedProperty.marketValue) * 100) 
            : 0;

          return (
            <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col h-screen w-screen overflow-y-auto font-sans text-[#F8FAFC]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-[#000000] min-h-screen flex flex-col w-full shadow-2xl relative text-[#F8FAFC]"
              >
                {/* Header Navbar */}
                <div className="sticky top-0 bg-[#1C1C1E] border-b border-[#2C2C2E] px-4 py-2.5 flex items-center justify-between z-20 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-[#10B981]" />
                      <span className="text-[10px] font-black uppercase font-mono text-slate-400 tracking-wider">Ficha do Imóvel</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    {/* Participation % Button & Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsParticipationDropdownOpen(!isParticipationDropdownOpen)}
                        className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#2C2C2E] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-[#2C2C2E]"
                        title="Percentual de Participação"
                      >
                        <Percent className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] font-black font-mono text-emerald-400">{participationPercent}%</span>
                      </button>
                      
                      {isParticipationDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-24 max-h-48 overflow-y-auto bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl shadow-2xl z-30 py-1 scrollbar-thin">
                          {Array.from({ length: 20 }, (_, i) => (20 - i) * 5).map((pct) => (
                            <button
                              key={pct}
                              onClick={() => {
                                setParticipationPercent(pct);
                                setIsParticipationDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors hover:bg-[#2C2C2E] hover:text-[#F8FAFC] ${
                                participationPercent === pct ? 'text-emerald-400 font-bold bg-[#10B981]/10' : 'text-slate-300'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* User Assignment Button & Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#2C2C2E] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-[#2C2C2E]"
                        title="Usuários Vinculados ao Lote"
                      >
                        <Users className="h-3 w-3 text-blue-400" />
                        <span className="text-[10px] font-black font-mono text-blue-400">
                          {getAssignedUsersLabel(selectedProperty.assignedUserIds, users)}
                        </span>
                      </button>

                      {isUserDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-60 max-h-72 overflow-y-auto bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl shadow-2xl z-30 p-2 scrollbar-thin space-y-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono px-2 py-1 border-b border-[#2C2C2E]/60 flex items-center justify-between">
                            <span>Vincular Usuários</span>
                            <UserCheck className="h-3 w-3 text-blue-400" />
                          </div>

                          {/* Option: Todos os Usuários */}
                          <button
                            type="button"
                            onClick={() => {
                              const isAllSelected = isAllUsersAssigned(selectedProperty.assignedUserIds, assignableUsers);
                              const newAssigned = isAllSelected ? ['none'] : ['all'];
                              updatePropertyAssignedUsers(selectedProperty.id, newAssigned);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                              isAllUsersAssigned(selectedProperty.assignedUserIds, assignableUsers)
                                ? 'bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30'
                                : 'text-slate-300 hover:bg-[#2C2C2E]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isAllUsersAssigned(selectedProperty.assignedUserIds, assignableUsers)}
                              onChange={() => {}}
                              className="rounded border-slate-600 bg-[#2C2C2E] text-blue-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                            />
                            <span className="font-semibold">Todos os Usuários</span>
                          </button>

                          <div className="h-px bg-[#2C2C2E] my-1" />

                          {/* List of Registered Users */}
                          {assignableUsers.length === 0 ? (
                            <div className="text-[10px] text-slate-500 italic p-2 text-center">
                              Nenhum usuário cadastrado.
                            </div>
                          ) : (
                            assignableUsers.map((u) => {
                              const isAssigned = isUserAssigned(selectedProperty.assignedUserIds, u.id, assignableUsers);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    toggleUserAssignment(selectedProperty.id, u.id, selectedProperty.assignedUserIds, assignableUsers);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                                    isAssigned
                                      ? 'bg-blue-500/10 text-blue-200 font-semibold border border-blue-500/20'
                                      : 'text-slate-300 hover:bg-[#2C2C2E]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={() => {}}
                                      className="rounded border-slate-600 bg-[#2C2C2E] text-blue-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                                    />
                                    <span className="truncate">{u.name || u.username}</span>
                                  </div>
                                  {u.role === 'admin' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded ml-1 shrink-0">
                                      Admin
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const targetState = !(isSpecsExpanded && isPortalExpanded && isNotesExpanded && isPricingExpanded && isChartExpanded && isRiskExpanded && isLiquidityExpanded && isTimelineExpanded);
                        setIsSpecsExpanded(targetState);
                        setIsPortalExpanded(targetState);
                        setIsNotesExpanded(targetState);
                        setIsPricingExpanded(targetState);
                        setIsChartExpanded(targetState);
                        setIsRiskExpanded(targetState);
                        setIsLiquidityExpanded(targetState);
                        setIsTimelineExpanded(targetState);
                      }}
                      className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#1C1C1E] rounded-full transition-all cursor-pointer flex items-center justify-center"
                      title={
                        isSpecsExpanded && isPortalExpanded && isNotesExpanded && isPricingExpanded && isChartExpanded && isRiskExpanded && isLiquidityExpanded && isTimelineExpanded
                          ? "Recolher todas as abas"
                          : "Estender todas as abas"
                      }
                    >
                      <ChevronsUpDown className="h-4 w-4 text-emerald-450" />
                    </button>
                    <button
                      onClick={() => handleExportPDF(selectedProperty)}
                      className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#1C1C1E] rounded-full transition-all cursor-pointer flex items-center justify-center"
                      title="Exportar Relatório PDF"
                    >
                      <FileDown className="h-4 w-4 text-emerald-400" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          handleEditLot(selectedProperty, e);
                          setShowDetails(false);
                        }}
                        className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#1C1C1E] rounded-full transition-all cursor-pointer flex items-center justify-center"
                        title="Editar Imóvel"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          setDeleteConfirmId(selectedProperty.id);
                          setShowDetails(false);
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full transition-all cursor-pointer flex items-center justify-center"
                        title="Excluir Imóvel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        setIsEditingNotes(false);
                        setIsParticipationDropdownOpen(false);
                        setIsUserDropdownOpen(false);
                      }}
                      className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#1C1C1E] rounded-full transition-all cursor-pointer flex items-center justify-center"
                      title="Fechar"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Content Container (Centered max-w-4xl) */}
                <div className="max-w-4xl mx-auto w-full px-4 py-5 flex-1 space-y-5">
                  {/* Title and main location info */}
                  <div className="space-y-1 pb-1">
                    {(() => {
                      const { mainAddress, cityState } = getSplitLocation(selectedProperty.location);
                      return (
                        <>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {cityState && (
                              <span className="text-[#10B981] font-black font-inter text-sm md:text-base">{cityState}</span>
                            )}
                            <span className="bg-[#1C1C1E] text-slate-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded font-mono tracking-wider border border-[#2C2C2E]">
                              {selectedProperty.typeText}
                            </span>
                          </div>
                          <h1 className="text-sm md:text-base font-black font-inter text-[#F8FAFC] leading-snug">{mainAddress}</h1>
                        </>
                      );
                    })()}
                  </div>

                  {/* Vertical Single Column Layout */}
                  <div className="flex flex-col gap-5">
                    {/* Details Sections */}
                    <div className="space-y-4 w-full">
                      {/* Specifications Section */}
                      <div className="bg-[#0E0E0E] rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                        <div 
                          onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-[#10B981]" />
                            <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Características do Imóvel</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSpecsExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isSpecsExpanded && (
                          <div className="mt-3.5 grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs text-slate-300 font-medium pl-0.5 animate-fadeIn">
                            {(selectedProperty.totalArea || selectedProperty.area) && (selectedProperty.totalArea || selectedProperty.area) !== 'N/A' && (
                              <div className="flex items-center gap-2">
                                <Ruler className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Área Total: <strong className="text-[#F8FAFC] font-mono">{selectedProperty.totalArea || selectedProperty.area}</strong></span>
                              </div>
                            )}
                            {selectedProperty.privateArea && selectedProperty.privateArea !== 'N/A' && (
                              <div className="flex items-center gap-2">
                                <Ruler className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Área Privativa: <strong className="text-[#F8FAFC] font-mono">{selectedProperty.privateArea}</strong></span>
                              </div>
                            )}
                            {selectedProperty.occupancyStatus && (
                              <div className="flex items-center gap-2">
                                <Info className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Ocupação: <strong className="text-[#F8FAFC] font-semibold">{selectedProperty.occupancyStatus}</strong></span>
                              </div>
                            )}
                            {selectedProperty.bedrooms !== undefined && (
                              <div className="flex items-center gap-2">
                                <Bed className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Dormitórios: <strong className="text-[#F8FAFC] font-mono">{selectedProperty.bedrooms}</strong></span>
                              </div>
                            )}
                            {selectedProperty.garage && (
                              <div className="flex items-center gap-2">
                                <Car className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Garagem: <strong className="text-[#F8FAFC]">{selectedProperty.garage}</strong></span>
                              </div>
                            )}
                            {selectedProperty.registration && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Matrícula: <strong className="text-[#F8FAFC] font-mono">{selectedProperty.registration}</strong></span>
                              </div>
                            )}
                            {selectedProperty.zone && (
                              <div className="flex items-center gap-2">
                                <Building className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Zona: <strong className="text-[#F8FAFC] font-semibold">{selectedProperty.zone}</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Portal/Leiloeiro Section */}
                      {(selectedProperty.portalName || selectedProperty.auctionDate || selectedProperty.arrematado) && (
                        <div className="bg-[#0E0E0E] rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                          <div 
                            onClick={() => setIsPortalExpanded(!isPortalExpanded)}
                            className="flex items-center justify-between cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-4 w-4 text-[#10B981]" />
                              <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Portal/Leiloeiro</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const countdown = getAuctionCountdown(selectedProperty.auctionDate);
                                if (!countdown) return null;
                                
                                let badgeStyle = "bg-amber-500/10 border-amber-500/25 text-amber-400";
                                if (countdown.isToday) {
                                  badgeStyle = "bg-emerald-500/10 border-emerald-500/25 text-[#10B981] animate-pulse";
                                } else if (countdown.text.includes('Encerrado')) {
                                  badgeStyle = "bg-zinc-500/10 border-zinc-500/25 text-zinc-400";
                                }
                                
                                return (
                                  <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none shrink-0 ${badgeStyle}`}>
                                    {countdown.text}
                                  </span>
                                );
                              })()}
                              {isPortalExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {isPortalExpanded && (
                            <div className="mt-3.5 space-y-3.5 pl-0.5 animate-fadeIn">
                              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs text-slate-300 font-medium">
                                {selectedProperty.portalName && (
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                    <span>Leiloeiro: <strong className="text-[#F8FAFC] font-semibold font-inter">{selectedProperty.portalName}</strong></span>
                                  </div>
                                )}
                                {selectedProperty.auctionDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                    <span>Data do Leilão: <strong className="text-[#F8FAFC] font-mono">{formatDateBR(selectedProperty.auctionDate)}</strong></span>
                                  </div>
                                )}
                              </div>

                              {(selectedProperty.link || (selectedProperty as any).portalUrl) && (
                                <div className="pt-2 border-t border-[#2C2C2E]/40 flex items-center gap-2">
                                  <ExternalLink className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                  <span className="text-slate-400 font-medium text-xs">Link do lote:</span>
                                  <a
                                    href={selectedProperty.link || (selectedProperty as any).portalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#10B981] hover:text-emerald-300 underline font-semibold text-xs transition-colors inline-flex items-center gap-1 truncate"
                                  >
                                    <span>Acessar no site do leiloeiro</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                </div>
                              )}

                              {/* Selector Button Group for Arrematado Sim x Não */}
                              <div className="pt-3 border-t border-[#2C2C2E]/60 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                  <CheckSquare className="h-3.5 w-3.5 text-[#10B981]" />
                                  <span>Arrematado?</span>
                                </div>
                                <div className="flex bg-[#000000]/40 p-0.5 rounded-lg border border-[#2C2C2E]">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArrematado('Sim')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                      selectedProperty.arrematado === 'Sim'
                                        ? 'bg-[#10B981] text-black shadow-xs font-black'
                                        : 'text-slate-400 hover:text-[#F8FAFC]'
                                    }`}
                                  >
                                    Sim
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArrematado('Não')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                      selectedProperty.arrematado === 'Não'
                                        ? 'bg-[#EF4444] text-white shadow-xs font-black'
                                        : 'text-slate-400 hover:text-[#F8FAFC]'
                                    }`}
                                  >
                                    Não
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Personal Notes / Observations Box */}
                      <div className="bg-[#0E0E0E] rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                        <div 
                          onClick={() => {
                            setIsNotesExpanded(!isNotesExpanded);
                            if (!isNotesExpanded) {
                              setTempNotes(selectedProperty.notes || '');
                            }
                          }}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <StickyNote className="h-4 w-4" />
                            <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Anotações/Informações</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isNotesExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isNotesExpanded && (
                          <div className="mt-3.5 space-y-3 animate-fadeIn">
                            {isEditingNotes ? (
                              <div className="space-y-2">
                                <textarea
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  placeholder="Digite observações sobre o imóvel, processos, contatos do condomínio, taxas extras, etc..."
                                  className="w-full h-32 bg-[#000000]/30 border border-[#2C2C2E] rounded-xl p-3 text-xs text-[#F8FAFC] placeholder:text-zinc-550 focus:outline-none focus:ring-1 focus:ring-[#10B981] resize-none transition-all font-sans leading-relaxed"
                                  autoFocus
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingNotes(false);
                                      setTempNotes(selectedProperty.notes || '');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-[#F8FAFC] hover:bg-[#2C2C2E] transition-all cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveNotes(tempNotes)}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-black text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => {
                                  if (canEdit) {
                                    setTempNotes(selectedProperty.notes || '');
                                    setIsEditingNotes(true);
                                  }
                                }}
                                className={`bg-[#000000]/30 rounded-xl p-3 border border-[#2C2C2E]/60 transition-colors ${canEdit ? 'hover:border-[#10B981]/40 cursor-pointer group' : ''}`}
                              >
                                {selectedProperty.notes ? (
                                  <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                    {selectedProperty.notes}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-500 font-medium italic">
                                    Nenhuma anotação registrada.
                                  </p>
                                )}
                                {canEdit && (
                                  <div className="mt-2 text-[9px] text-slate-500 font-mono flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Pencil className="h-2.5 w-2.5 text-slate-400" />
                                    <span>Clique em cima para editar</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financials Sections */}
                    <div className="space-y-4 w-full">
                      {/* Pricing block */}
                      <div className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-xl p-4 transition-all shadow-3xs space-y-3">
                        <div 
                          onClick={() => setIsPricingExpanded(!isPricingExpanded)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-[#10B981]" />
                            <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Valores de Referência</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedProperty.marketValue > 0 && (
                              <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none bg-emerald-500/10 text-[#10B981] border-emerald-500/20 shrink-0">
                                {selectedRealDiscount}% real
                              </span>
                            )}
                            {isPricingExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isPricingExpanded && (
                          <div className="space-y-3 pt-1 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="bg-[#10B981]/10 p-3 rounded-xl border border-[#10B981]/30 text-center flex flex-col justify-center items-center">
                                <span className="text-[9px] text-[#10B981] block font-bold font-mono tracking-wider uppercase">VALOR DE MERCADO</span>
                                {editingCardField?.id === selectedProperty.id && editingCardField?.field === 'marketValue' ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editCardValue}
                                    onChange={(e) => setEditCardValue(e.target.value)}
                                    onBlur={() => handleQuickEditCardSave(selectedProperty.id, 'marketValue', editCardValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, 'marketValue', editCardValue);
                                      if (e.key === 'Escape') setEditingCardField(null);
                                    }}
                                    className="w-full text-xs text-center bg-[#1C1C1E] text-[#F8FAFC] border border-[#10B981] rounded px-1.5 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                                  />
                                ) : (
                                  <span 
                                    onClick={() => {
                                      if (canEdit) {
                                        setEditingCardField({ id: selectedProperty.id, field: 'marketValue' });
                                        setEditCardValue(selectedProperty.marketValue.toString());
                                      }
                                    }}
                                    className={`text-sm md:text-base font-black text-[#10B981] font-mono block mt-0.5 ${canEdit ? 'cursor-pointer hover:text-emerald-400 hover:underline decoration-dotted flex items-center justify-center gap-1 group/field' : ''}`}
                                    title={canEdit ? "Clique para editação rápida" : undefined}
                                  >
                                    {formatBRL(selectedProperty.marketValue)}
                                    {canEdit && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/field:opacity-100 text-slate-500 transition-opacity" />}
                                  </span>
                                )}
                              </div>
                              <div className="bg-[#10B981]/10 p-3 rounded-xl border border-[#10B981]/30 text-center flex flex-col justify-center items-center">
                                <span className="text-[9px] text-[#10B981] block font-bold font-mono tracking-wider uppercase">VALOR LANCE</span>
                                {editingCardField?.id === selectedProperty.id && editingCardField?.field === 'suggestedBid' ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editCardValue}
                                    onChange={(e) => setEditCardValue(e.target.value)}
                                    onBlur={() => handleQuickEditCardSave(selectedProperty.id, 'suggestedBid', editCardValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, 'suggestedBid', editCardValue);
                                      if (e.key === 'Escape') setEditingCardField(null);
                                    }}
                                    className="w-full text-xs text-center bg-[#1C1C1E] text-[#10B981] border border-[#10B981] rounded px-1.5 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                                  />
                                ) : (
                                  <span 
                                    onClick={() => {
                                      if (canEdit) {
                                        setEditingCardField({ id: selectedProperty.id, field: 'suggestedBid' });
                                        setEditCardValue(selectedProperty.suggestedBid.toString());
                                      }
                                    }}
                                    className={`text-sm md:text-base font-black text-[#10B981] font-mono block mt-0.5 ${canEdit ? 'cursor-pointer hover:text-emerald-400 hover:underline decoration-dotted flex items-center justify-center gap-1 group/field' : ''}`}
                                    title={canEdit ? "Clique para editação rápida" : undefined}
                                  >
                                    {formatBRL(selectedProperty.suggestedBid)}
                                    {canEdit && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/field:opacity-100 text-[#10B981] transition-opacity" />}
                                  </span>
                                )}
                                {editingCardField?.id === selectedProperty.id && editingCardField?.field === 'paymentDate_bid' ? (
                                  <input
                                    type="date"
                                    autoFocus
                                    value={editCardValue}
                                    onChange={(e) => setEditCardValue(e.target.value)}
                                    onBlur={() => handleQuickEditCardSave(selectedProperty.id, 'paymentDate_bid', editCardValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, 'paymentDate_bid', editCardValue);
                                      if (e.key === 'Escape') setEditingCardField(null);
                                    }}
                                    className="bg-[#1C1C1E] border border-[#10B981] text-[#F8FAFC] font-mono text-[9px] rounded px-1 py-0.5 mt-1.5 focus:outline-none w-28 text-center"
                                  />
                                ) : (
                                  <span
                                    onClick={() => {
                                      if (canEdit) {
                                        setEditingCardField({ id: selectedProperty.id, field: 'paymentDate_bid' });
                                        setEditCardValue(selectedProperty.paymentDate_bid || '');
                                      }
                                    }}
                                    className={`text-[9px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 mt-1 font-mono ${canEdit ? 'cursor-pointer' : ''}`}
                                    title={canEdit ? "Definir data de pagamento do lance" : undefined}
                                  >
                                    <Calendar className="h-2.5 w-2.5 shrink-0" />
                                    {selectedProperty.paymentDate_bid ? formatDateBR(selectedProperty.paymentDate_bid) : 'D+0 (Arrematação)'}
                                  </span>
                                )}
                                {selectedProperty.marketValue > 0 && selectedProperty.suggestedBid > 0 && (
                                  <span className="mt-1 text-[9px] font-extrabold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                                    {Math.max(0, Math.round(((selectedProperty.marketValue - selectedProperty.suggestedBid) / selectedProperty.marketValue) * 100))}% desc. sugerido
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="pt-3 border-t border-dashed border-[#2C2C2E] space-y-1.5 text-slate-300 bg-[#1C1C1E]/60 p-3 rounded-xl border border-[#2C2C2E]">
                              {(() => {
                                const itemsConfig = [
                                  {
                                    id: 'commission',
                                    field: 'commission' as const,
                                    label: `Comissão Leiloeiro (${selectedCommission}%)`,
                                    paymentDateField: 'paymentDate_commission' as const,
                                    fallbackOffset: 'D+0 (Imediato)',
                                    daysOffset: 0,
                                    inputLabel: 'Comissão Leiloeiro (%)',
                                    isPercent: true,
                                    value: selectedCommission,
                                    displayValue: formatBRL(selectedCommissionValue),
                                    hasValue: selectedCommissionValue > 0,
                                    editValue: selectedCommission.toString()
                                  },
                                  {
                                    id: 'iptu',
                                    field: 'iptu' as const,
                                    label: 'IPTU',
                                    paymentDateField: 'paymentDate_iptu' as const,
                                    fallbackOffset: 'D+15',
                                    daysOffset: 15,
                                    inputLabel: 'IPTU (R$)',
                                    isPercent: false,
                                    value: selectedProperty.iptu || 0,
                                    displayValue: formatBRL(selectedProperty.iptu || 0),
                                    hasValue: selectedProperty.iptu !== undefined && selectedProperty.iptu > 0,
                                    editValue: (selectedProperty.iptu || 0).toString()
                                  },
                                  {
                                    id: 'condominium',
                                    field: 'condominium' as const,
                                    label: 'Condomínio',
                                    paymentDateField: 'paymentDate_condominium' as const,
                                    fallbackOffset: 'D+30',
                                    daysOffset: 30,
                                    inputLabel: 'Condomínio (R$)',
                                    isPercent: false,
                                    value: selectedProperty.condominium || 0,
                                    displayValue: formatBRL(selectedProperty.condominium || 0),
                                    hasValue: selectedProperty.condominium !== undefined && selectedProperty.condominium > 0,
                                    editValue: (selectedProperty.condominium || 0).toString()
                                  },
                                  {
                                    id: 'registro',
                                    field: 'registro' as const,
                                    label: 'Registro de Imóvel / Cartório',
                                    paymentDateField: 'paymentDate_registro' as const,
                                    fallbackOffset: 'D+45',
                                    daysOffset: 45,
                                    inputLabel: 'Registro de Imóvel (R$)',
                                    isPercent: false,
                                    value: selectedProperty.registro || 0,
                                    displayValue: formatBRL(selectedProperty.registro || 0),
                                    hasValue: selectedProperty.registro !== undefined && selectedProperty.registro > 0,
                                    editValue: (selectedProperty.registro || 0).toString()
                                  },
                                  {
                                    id: 'itbi',
                                    field: 'itbi' as const,
                                    label: 'ITBI',
                                    paymentDateField: 'paymentDate_itbi' as const,
                                    fallbackOffset: 'D+30',
                                    daysOffset: 30,
                                    inputLabel: 'ITBI (R$)',
                                    isPercent: false,
                                    value: selectedProperty.itbi || 0,
                                    displayValue: formatBRL(selectedProperty.itbi || 0),
                                    hasValue: selectedProperty.itbi !== undefined && selectedProperty.itbi > 0,
                                    editValue: (selectedProperty.itbi || 0).toString()
                                  },
                                  {
                                    id: 'tabelionato',
                                    field: 'tabelionato' as const,
                                    label: 'Tabelionato / Escritura',
                                    paymentDateField: 'paymentDate_tabelionato' as const,
                                    fallbackOffset: 'D+30',
                                    daysOffset: 30,
                                    inputLabel: 'Tabelionato (R$)',
                                    isPercent: false,
                                    value: selectedProperty.tabelionato || 0,
                                    displayValue: formatBRL(selectedProperty.tabelionato || 0),
                                    hasValue: selectedProperty.tabelionato !== undefined && selectedProperty.tabelionato > 0,
                                    editValue: (selectedProperty.tabelionato || 0).toString()
                                  },
                                  {
                                    id: 'corretagem',
                                    field: 'corretagem' as const,
                                    label: `Corretagem (${selectedCorretagemPercent}%)`,
                                    paymentDateField: 'paymentDate_corretagem' as const,
                                    fallbackOffset: 'No encerramento',
                                    daysOffset: 180,
                                    inputLabel: 'Corretagem (%)',
                                    isPercent: true,
                                    value: selectedCorretagemPercent,
                                    displayValue: formatBRL(selectedCorretagemValue),
                                    hasValue: selectedCorretagemPercent > 0,
                                    editValue: selectedCorretagemPercent.toString()
                                  },
                                  {
                                    id: 'ir',
                                    field: 'ir' as const,
                                    label: `Imposto de Renda - IR (${selectedIrPercent}% s/ lucro)`,
                                    paymentDateField: 'paymentDate_ir' as const,
                                    fallbackOffset: 'D+180 (Venda)',
                                    daysOffset: 180,
                                    inputLabel: 'Imposto de Renda (%)',
                                    isPercent: true,
                                    value: selectedIrPercent,
                                    displayValue: formatBRL(selectedIrValue),
                                    hasValue: selectedIrPercent > 0,
                                    editValue: selectedIrPercent.toString()
                                  },
                                  {
                                    id: 'reforma',
                                    field: 'reforma' as const,
                                    label: 'Estimativa de Reforma',
                                    paymentDateField: 'paymentDate_reforma' as const,
                                    fallbackOffset: 'D+60',
                                    daysOffset: 60,
                                    inputLabel: 'Reforma (R$)',
                                    isPercent: false,
                                    value: selectedProperty.reforma || 0,
                                    displayValue: formatBRL(selectedProperty.reforma || 0),
                                    hasValue: selectedProperty.reforma !== undefined && selectedProperty.reforma > 0,
                                    editValue: (selectedProperty.reforma || 0).toString()
                                  },
                                  {
                                    id: 'desocupacao',
                                    field: 'desocupacao' as const,
                                    label: 'Custo Desocupação / Advogado',
                                    paymentDateField: 'paymentDate_desocupacao' as const,
                                    fallbackOffset: 'D+90',
                                    daysOffset: 90,
                                    inputLabel: 'Desocupação (R$)',
                                    isPercent: false,
                                    value: selectedProperty.desocupacao || 0,
                                    displayValue: formatBRL(selectedProperty.desocupacao || 0),
                                    hasValue: selectedProperty.desocupacao !== undefined && selectedProperty.desocupacao > 0,
                                    editValue: (selectedProperty.desocupacao || 0).toString()
                                  },
                                  {
                                    id: 'parcela_emprestimo',
                                    field: 'parcela_emprestimo' as const,
                                    label: 'Parcela Empréstimo',
                                    paymentDateField: 'paymentDate_parcela_emprestimo' as const,
                                    fallbackOffset: 'D+30',
                                    daysOffset: 30,
                                    inputLabel: 'Parcela Empréstimo (R$)',
                                    isPercent: false,
                                    value: selectedProperty.parcela_emprestimo || 0,
                                    displayValue: formatBRL(selectedProperty.parcela_emprestimo || 0),
                                    hasValue: selectedProperty.parcela_emprestimo !== undefined && selectedProperty.parcela_emprestimo > 0,
                                    editValue: (selectedProperty.parcela_emprestimo || 0).toString()
                                  },
                                  {
                                    id: 'quitacao_emprestimo',
                                    field: 'quitacao_emprestimo' as const,
                                    label: 'Quitação Empréstimo',
                                    paymentDateField: 'paymentDate_quitacao_emprestimo' as const,
                                    fallbackOffset: 'D+180 (Venda)',
                                    daysOffset: 180,
                                    inputLabel: 'Quitação Empréstimo (R$)',
                                    isPercent: false,
                                    value: selectedProperty.quitacao_emprestimo || 0,
                                    displayValue: formatBRL(selectedProperty.quitacao_emprestimo || 0),
                                    hasValue: selectedProperty.quitacao_emprestimo !== undefined && selectedProperty.quitacao_emprestimo > 0,
                                    editValue: (selectedProperty.quitacao_emprestimo || 0).toString()
                                  },
                                  {
                                    id: 'emprestimo',
                                    field: 'emprestimo' as const,
                                    label: 'Empréstimo (Receita)',
                                    paymentDateField: 'paymentDate_emprestimo' as const,
                                    fallbackOffset: 'D+0 (Arrematação)',
                                    daysOffset: 0,
                                    inputLabel: 'Empréstimo (R$)',
                                    isPercent: false,
                                    isIncome: true,
                                    value: selectedProperty.emprestimo || 0,
                                    displayValue: `+ ${formatBRL(selectedProperty.emprestimo || 0)}`,
                                    hasValue: selectedProperty.emprestimo !== undefined && selectedProperty.emprestimo > 0,
                                    editValue: (selectedProperty.emprestimo || 0).toString()
                                  }
                                ];

                                const predefinedOffsets: Record<string, { daysOffset: number; fallbackOffset: string }> = {
                                  'Comissão Leiloeiro': { daysOffset: 0, fallbackOffset: 'D+0 (Imediato)' },
                                  'IPTU': { daysOffset: 15, fallbackOffset: 'D+15' },
                                  'Condomínio': { daysOffset: 30, fallbackOffset: 'D+30' },
                                  'Tabelionato / Escritura': { daysOffset: 30, fallbackOffset: 'D+30' },
                                  'Registro de Imóvel / Cartório': { daysOffset: 45, fallbackOffset: 'D+45' },
                                  'ITBI': { daysOffset: 30, fallbackOffset: 'D+30' },
                                  'Corretagem': { daysOffset: 180, fallbackOffset: 'No encerramento' },
                                  'Reforma': { daysOffset: 60, fallbackOffset: 'D+60' },
                                  'Desocupação / Advogado': { daysOffset: 90, fallbackOffset: 'D+90' },
                                  'Parcela Empréstimo': { daysOffset: 30, fallbackOffset: 'D+30' },
                                  'Quitação Empréstimo': { daysOffset: 180, fallbackOffset: 'D+180 (Venda)' },
                                  'Empréstimo (Receita)': { daysOffset: 0, fallbackOffset: 'D+0 (Arrematação)' },
                                };

                                const customItems = (selectedProperty.customExpenses || []).map(exp => {
                                  const matched = predefinedOffsets[exp.name] || { daysOffset: 30, fallbackOffset: 'D+30' };
                                  return {
                                    id: exp.id,
                                    field: `custom_expense_value_${exp.id}` as any,
                                    label: exp.name,
                                    paymentDateField: `custom_expense_date_${exp.id}` as any,
                                    fallbackOffset: matched.fallbackOffset,
                                    daysOffset: matched.daysOffset,
                                    inputLabel: `${exp.name} (R$)`,
                                    isPercent: false,
                                    value: exp.value || 0,
                                    displayValue: formatBRL(exp.value || 0),
                                    hasValue: exp.value !== undefined && exp.value > 0,
                                    editValue: (exp.value || 0).toString(),
                                    isCustom: true,
                                    paymentDate: exp.paymentDate || ''
                                  };
                                });

                                const allItems = [...itemsConfig, ...customItems];

                                const activeItems = allItems.filter(item => {
                                  const isEditingValue = editingCardField?.id === selectedProperty.id && editingCardField?.field === item.field;
                                  const isEditingDate = editingCardField?.id === selectedProperty.id && editingCardField?.field === item.paymentDateField;
                                  return item.hasValue || isEditingValue || isEditingDate;
                                });

                                const sortedItems = [...activeItems].sort((a, b) => {
                                  const dateA = getTransactionDate(a.paymentDateField, a.daysOffset, selectedProperty);
                                  const dateB = getTransactionDate(b.paymentDateField, b.daysOffset, selectedProperty);
                                  return dateA.getTime() - dateB.getTime();
                                });

                                if (sortedItems.length === 0) {
                                  return (
                                    <div className="text-center py-4 text-slate-500 text-xs italic">
                                      Nenhuma despesa adicionada. Clique no botão abaixo para incluir.
                                    </div>
                                  );
                                }

                                return sortedItems.map((item) => {
                                  const isEditingValue = editingCardField?.id === selectedProperty.id && editingCardField?.field === item.field;
                                  const isEditingDate = editingCardField?.id === selectedProperty.id && editingCardField?.field === item.paymentDateField;
                                  const dateValue = item.isCustom
                                    ? (item as any).paymentDate
                                    : (selectedProperty as any)[item.paymentDateField] || '';

                                  if (isEditingValue) {
                                    return (
                                      <div key={item.id} className="flex items-center justify-between text-[11px] bg-[#1C1C1E] border border-[#10B981] p-1.5 rounded-lg -mx-1.5 animate-fadeIn">
                                        <span className="text-[#10B981] font-bold">{item.inputLabel}</span>
                                        <input
                                          type="text"
                                          autoFocus
                                          value={editCardValue}
                                          onChange={(e) => setEditCardValue(e.target.value)}
                                          onBlur={() => handleQuickEditCardSave(selectedProperty.id, item.field, editCardValue)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, item.field, editCardValue);
                                            if (e.key === 'Escape') setEditingCardField(null);
                                          }}
                                          className="w-24 text-right bg-transparent text-[#F8FAFC] focus:outline-none font-mono text-xs font-bold"
                                        />
                                      </div>
                                    );
                                  }

                                  return (
                                    <div 
                                      key={item.id}
                                      className="flex items-center justify-between text-[11px] font-semibold text-slate-400 group/row hover:bg-[#2C2C2E]/40 px-1.5 py-1 -mx-1.5 rounded-lg transition-all"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <span 
                                          onClick={() => {
                                            if (canEdit) {
                                              setEditingCardField({ id: selectedProperty.id, field: item.field });
                                              setEditCardValue(item.editValue);
                                            }
                                          }}
                                          className={`flex items-center gap-1 ${canEdit ? 'cursor-pointer hover:text-emerald-400' : ''}`}
                                          title={canEdit ? `Clique para editar ${item.inputLabel}` : undefined}
                                        >
                                          {item.label}
                                          {canEdit && <Pencil className="h-2.5 w-2.5 text-slate-500 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" />}
                                        </span>
                                        {isEditingDate ? (
                                          <input
                                            type="date"
                                            autoFocus
                                            value={editCardValue}
                                            onChange={(e) => setEditCardValue(e.target.value)}
                                            onBlur={() => handleQuickEditCardSave(selectedProperty.id, item.paymentDateField, editCardValue)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, item.paymentDateField, editCardValue);
                                              if (e.key === 'Escape') setEditingCardField(null);
                                            }}
                                            className="bg-[#1C1C1E] border border-[#10B981] text-[#F8FAFC] font-mono text-[9px] rounded px-1 py-0.5 mt-0.5 focus:outline-none w-28"
                                          />
                                        ) : (
                                          <span
                                            onClick={() => {
                                              if (canEdit) {
                                                setEditingCardField({ id: selectedProperty.id, field: item.paymentDateField });
                                                setEditCardValue(dateValue);
                                              }
                                            }}
                                            className={`text-[9px] text-slate-500 hover:text-[#10B981] flex items-center gap-1 mt-0.5 ${canEdit ? 'cursor-pointer' : ''}`}
                                            title={canEdit ? "Definir data de pagamento" : undefined}
                                          >
                                            <Calendar className="h-2.5 w-2.5 shrink-0" />
                                            {dateValue ? formatDateBR(dateValue) : item.fallbackOffset}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 self-start mt-0.5">
                                        {item.hasValue ? (
                                          <strong 
                                            onClick={() => {
                                              if (canEdit) {
                                                setEditingCardField({ id: selectedProperty.id, field: item.field });
                                                setEditCardValue(item.editValue);
                                              }
                                            }}
                                            className={`text-[#F8FAFC] font-mono text-xs font-medium ${canEdit ? 'cursor-pointer hover:text-[#10B981] hover:underline decoration-dotted' : ''}`}
                                            title={canEdit ? `Clique para editar ${item.inputLabel}` : undefined}
                                          >
                                            {item.displayValue}
                                          </strong>
                                        ) : (
                                          <span 
                                            onClick={() => {
                                              if (canEdit) {
                                                setEditingCardField({ id: selectedProperty.id, field: item.field });
                                                setEditCardValue(item.editValue);
                                              }
                                            }}
                                            className="text-slate-500 font-mono text-[10px] font-extrabold uppercase tracking-wider hover:text-[#10B981] transition-colors cursor-pointer"
                                          >
                                            {item.field === 'corretagem' ? '+ Definir %' : '+ Definir'}
                                          </span>
                                        )}

                                        {canEdit && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveCostItem(item.field);
                                            }}
                                            className="opacity-0 group-hover/row:opacity-100 p-0.5 hover:text-red-400 text-slate-500 rounded transition-all shrink-0 cursor-pointer"
                                            title="Excluir despesa"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}

                              {/* Add Cost Item Button / Dropdown */}
                              {canEdit && (
                                <div className="pt-2 border-t border-[#2C2C2E]/60" onClick={(e) => e.stopPropagation()}>
                                  {!showAddCostSelector ? (
                                    <button
                                      onClick={() => {
                                        setShowAddCostSelector(true);
                                        setIsCustomCostSelected(false);
                                        setCustomCostName('');
                                      }}
                                      className="w-full py-1.5 border border-dashed border-[#2C2C2E] hover:border-[#10B981]/50 text-slate-400 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all bg-[#1C1C1E]/40"
                                    >
                                      <Plus className="h-3.5 w-3.5 text-emerald-400" />
                                      Adicionar Despesa
                                    </button>
                                  ) : (
                                    <div className="bg-[#1C1C1E] border border-[#2C2C2E] p-2.5 rounded-lg space-y-2.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Nova Despesa</span>
                                        <button
                                          onClick={() => setShowAddCostSelector(false)}
                                          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>

                                      {!isCustomCostSelected ? (
                                        <div className="space-y-1.5">
                                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Selecione uma opção pré-definida:</span>
                                          <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-1">
                                            {[
                                              { label: 'Comissão Leiloeiro', field: 'commission', daysOffset: 0 },
                                              { label: 'IPTU', field: 'iptu', daysOffset: 15 },
                                              { label: 'Condomínio', field: 'condominium', daysOffset: 30 },
                                              { label: 'Tabelionato / Escritura', field: 'tabelionato', daysOffset: 30 },
                                              { label: 'Registro de Imóvel / Cartório', field: 'registro', daysOffset: 45 },
                                              { label: 'ITBI', field: 'itbi', daysOffset: 30 },
                                              { label: 'Corretagem', field: 'corretagem', daysOffset: 180 },
                                              { label: 'Imposto de Renda (IR)', field: 'ir', daysOffset: 180 },
                                              { label: 'Reforma', field: 'reforma', daysOffset: 60 },
                                              { label: 'Desocupação / Advogado', field: 'desocupacao', daysOffset: 90 },
                                              { label: 'Parcela Empréstimo', field: 'parcela_emprestimo', daysOffset: 30 },
                                              { label: 'Quitação Empréstimo', field: 'quitacao_emprestimo', daysOffset: 180 },
                                              { label: 'Empréstimo (Receita)', field: 'emprestimo', daysOffset: 0 },
                                            ].map((opt) => {
                                              const isAlreadyActive = opt.field === 'commission' 
                                                ? selectedCommissionValue > 0 
                                                : opt.field === 'corretagem' 
                                                  ? selectedCorretagemValue > 0 
                                                  : opt.field === 'ir'
                                                    ? selectedIrPercent > 0
                                                    : (selectedProperty as any)[opt.field] > 0;

                                              return (
                                                <button
                                                  key={opt.field}
                                                  onClick={() => {
                                                    if (isAlreadyActive) {
                                                      const newExpId = Date.now().toString();
                                                      const defaultDate = calculateDefaultDateStr(opt.daysOffset, selectedProperty);
                                                      const newExp = { id: newExpId, name: opt.label, value: 0, paymentDate: defaultDate };
                                                      if (setProperties) {
                                                        setProperties(prev => prev.map(item => item.id === selectedProperty.id ? { ...item, customExpenses: [...(item.customExpenses || []), newExp] } : item));
                                                      }
                                                      setSelectedProperty(prev => prev ? { ...prev, customExpenses: [...(prev.customExpenses || []), newExp] } : null);

                                                      setEditingCardField({ id: selectedProperty.id, field: `custom_expense_value_${newExpId}` });
                                                      setEditCardValue('');
                                                      setShowAddCostSelector(false);
                                                    } else {
                                                      setEditingCardField({ id: selectedProperty.id, field: opt.field });
                                                      if (opt.field === 'commission') {
                                                        setEditCardValue(selectedCommission.toString());
                                                      } else if (opt.field === 'corretagem') {
                                                        setEditCardValue(selectedCorretagemPercent.toString());
                                                      } else if (opt.field === 'ir') {
                                                        setEditCardValue(selectedIrPercent > 0 ? selectedIrPercent.toString() : '15');
                                                      } else {
                                                        setEditCardValue(((selectedProperty as any)[opt.field] || 0).toString());
                                                      }
                                                      setShowAddCostSelector(false);
                                                    }
                                                  }}
                                                  className="text-left px-2 py-1.5 text-[11px] rounded transition-all flex items-center justify-between bg-[#2C2C2E]/40 hover:bg-[#2C2C2E] text-slate-300 cursor-pointer"
                                                >
                                                  <span>{opt.label}</span>
                                                  {isAlreadyActive && (
                                                    <span className="text-[9px] uppercase font-extrabold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                      Incluir mais um
                                                    </span>
                                                  )}
                                                </button>
                                              );
                                            })}

                                            <button
                                              onClick={() => {
                                                setIsCustomCostSelected(true);
                                                setCustomCostName('');
                                              }}
                                              className="text-left px-2 py-1.5 text-[11px] rounded bg-emerald-950/40 hover:bg-[#10B981]/20 text-emerald-400 font-bold border border-emerald-900/30 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                              <Plus className="h-3 w-3" />
                                              <span>Outros (Personalizada)...</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Nome do item personalizado:</span>
                                          <input
                                            type="text"
                                            autoFocus
                                            placeholder="Ex: Custas Judiciais"
                                            value={customCostName}
                                            onChange={(e) => setCustomCostName(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && customCostName.trim()) {
                                                const newExpId = Date.now().toString();
                                                const newExp = { id: newExpId, name: customCostName.trim(), value: 0 };
                                                if (setProperties) {
                                                  setProperties(prev => prev.map(item => item.id === selectedProperty.id ? { ...item, customExpenses: [...(item.customExpenses || []), newExp] } : item));
                                                }
                                                setSelectedProperty(prev => prev ? { ...prev, customExpenses: [...(prev.customExpenses || []), newExp] } : null);

                                                setEditingCardField({ id: selectedProperty.id, field: `custom_expense_value_${newExpId}` });
                                                setEditCardValue('');
                                                setShowAddCostSelector(false);
                                              }
                                            }}
                                            className="w-full bg-[#2C2C2E] border border-[#2C2C2E] focus:border-[#10B981] text-[#F8FAFC] text-[11px] rounded px-2.5 py-1.5 focus:outline-none placeholder-slate-500 font-mono"
                                          />
                                          <div className="flex items-center gap-2 pt-1">
                                            <button
                                              onClick={() => {
                                                if (customCostName.trim()) {
                                                  const newExpId = Date.now().toString();
                                                  const newExp = { id: newExpId, name: customCostName.trim(), value: 0 };
                                                  if (setProperties) {
                                                    setProperties(prev => prev.map(item => item.id === selectedProperty.id ? { ...item, customExpenses: [...(item.customExpenses || []), newExp] } : item));
                                                  }
                                                  setSelectedProperty(prev => prev ? { ...prev, customExpenses: [...(prev.customExpenses || []), newExp] } : null);

                                                  setEditingCardField({ id: selectedProperty.id, field: `custom_expense_value_${newExpId}` });
                                                  setEditCardValue('');
                                                  setShowAddCostSelector(false);
                                                }
                                              }}
                                              disabled={!customCostName.trim()}
                                              className="flex-1 py-1 bg-[#10B981] hover:bg-[#059669] disabled:bg-[#2C2C2E] disabled:text-slate-500 text-black font-extrabold text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                                            >
                                              Adicionar
                                            </button>
                                            <button
                                              onClick={() => setIsCustomCostSelected(false)}
                                              className="flex-1 py-1 bg-transparent border border-[#2C2C2E] text-slate-400 font-extrabold text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                                            >
                                              Voltar
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Total and Real Discount */}
                              <div className="pt-2 border-t border-[#2C2C2E] space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-300">
                                  <span>Custo Total Estimado</span>
                                  <strong className="text-[#F8FAFC] font-mono text-sm font-black">
                                    {formatBRL(selectedTotalCost)}
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                                  <span>Custo Estimado Total Participação ({participationPercent}%)</span>
                                  <strong className="text-emerald-400 font-mono text-xs font-black">
                                    {formatBRL(selectedTotalCost * (participationPercent / 100))}
                                  </strong>
                                </div>
                                {selectedProperty.marketValue > 0 && (
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                                    <span>Desconto Real (Avaliação)</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black leading-none ${selectedRealDiscount >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                      {selectedRealDiscount}% real
                                    </span>
                                  </div>
                                )}
                                <div className="mt-2 pt-2 border-t border-[#2C2C2E]/60 space-y-1 bg-[#1C1C1E]/50 p-2 rounded-lg border border-[#2C2C2E]/40">
                                  <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Fonte de Recursos</span>
                                    <span className="text-emerald-400 font-mono text-[9px] lowercase font-normal">ROI proporcional ao capital próprio</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                                    <span className="flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                                      <span>Capital Próprio ({selectedUpfrontCosts > 0 ? Math.round((selectedCapitalProprio / selectedUpfrontCosts) * 100) : 100}%)</span>
                                    </span>
                                    <strong className="text-slate-100 font-mono">{formatBRL(selectedCapitalProprio)}</strong>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                                    <span className="flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
                                      <span>Recursos de Terceiros ({selectedUpfrontCosts > 0 ? Math.round((selectedRecursosTerceiros / selectedUpfrontCosts) * 100) : 0}%)</span>
                                    </span>
                                    <strong className="text-slate-100 font-mono">{formatBRL(selectedRecursosTerceiros)}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ROI Potential Chart */}
                      <RoiPotentialChart
                        marketValue={selectedProperty.marketValue}
                        suggestedBid={selectedProperty.suggestedBid}
                        commission={selectedCommission}
                        iptu={selectedIptuValue}
                        condominium={selectedCondominiumValue}
                        registro={selectedRegistroValue}
                        itbi={selectedItbiValue}
                        tabelionato={selectedTabelionatoValue}
                        corretagem={selectedCorretagemPercent}
                        ir={selectedIrPercent}
                        reforma={selectedReformaValue}
                        desocupacao={selectedDesocupacaoValue}
                        parcela_emprestimo={selectedParcelaEmprestimoValue}
                        quitacao_emprestimo={selectedQuitacaoEmprestimoValue}
                        emprestimo={selectedEmprestimoValue}
                        customExpenses={selectedProperty.customExpenses || []}
                        initialSaleValue={selectedProperty.saleValue}
                        onSaleValueChange={(val) => {
                          if (setProperties) {
                            setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, saleValue: val } : p));
                          }
                          setSelectedProperty(prev => prev ? { ...prev, saleValue: val } : null);
                        }}
                        initialSaleDate={selectedProperty.paymentDate_sale}
                        initialBidDate={selectedProperty.paymentDate_bid || selectedProperty.auctionDate}
                        onSaleDateChange={(date) => {
                          if (setProperties) {
                            setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, paymentDate_sale: date } : p));
                          }
                          setSelectedProperty(prev => prev ? { ...prev, paymentDate_sale: date } : null);
                        }}
                        isExpanded={isChartExpanded}
                        onToggle={() => setIsChartExpanded(!isChartExpanded)}
                        participationPercent={participationPercent}
                        vendido={selectedProperty.vendido}
                        onVendidoChange={handleToggleVendido}
                      />

                      {/* Cash Flow Timeline & Time Value of Money */}
                      <CashFlowTimeline
                        property={selectedProperty}
                        participationPercent={participationPercent}
                        isExpanded={isTimelineExpanded}
                        onToggle={() => setIsTimelineExpanded(!isTimelineExpanded)}
                      />

                      {/* Nível de Risco Section */}
                      {(() => {
                        const risk = calculateRiskLevel(selectedProperty);
                        const RiskIcon = risk.label === 'Baixo' ? ShieldCheck : ShieldAlert;
                        return (
                          <div className="bg-[#0E0E0E] rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                            <div 
                              onClick={() => setIsRiskExpanded(!isRiskExpanded)}
                              className="flex items-center justify-between cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-1.5">
                                <RiskIcon className={`h-4 w-4 ${risk.label === 'Alto' ? 'text-rose-400' : risk.label === 'Médio' ? 'text-amber-400' : 'text-[#10B981]'}`} />
                                <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Análise Operacional de Risco</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none shrink-0 ${risk.bgColor}`}>
                                  Risco {risk.label}
                                </span>
                                {isRiskExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {isRiskExpanded && (
                              <div className="space-y-3 mt-3 animate-fadeIn">
                                <div className="space-y-1.5 bg-[#000000]/30 rounded-xl p-3 border border-[#2C2C2E]/60">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-300">Índice Geral de Risco</span>
                                    <span className={`text-sm font-mono font-black ${risk.scoreColor}`}>{risk.score}/100</span>
                                  </div>
                                  <div className="w-full bg-[#2C2C2E] rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 rounded-full ${risk.barColor}`}
                                      style={{ width: `${risk.score}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-450 leading-relaxed font-medium pt-0.5">
                                    {risk.label === 'Baixo' 
                                      ? '✓ Este lote possui ótimos indicadores jurídicos e operacionais, minimizando riscos de liquidez ou atraso.' 
                                      : risk.label === 'Médio'
                                      ? '⚠ Recomenda-se cautela. Há fatores que requerem diligência moderada (como ocupação ou despesas pendentes).'
                                      : '🚨 Alerta de Alto Risco. Fatores cumulativos sugerem alto custo operacional ou judicial. Analise detalhadamente o edital.'}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[9px] text-slate-400 block font-bold font-mono tracking-wider uppercase">Fatores Analisados:</span>
                                  <div className="space-y-1.5 pl-0.5">
                                    {risk.factors.map((factor, index) => (
                                      <div key={index} className="flex items-start gap-2 text-[11px] leading-tight">
                                        <span className={`mt-0.5 text-xs font-bold shrink-0 ${factor.isGood ? 'text-[#10B981]' : 'text-slate-500'}`}>
                                          {factor.isGood ? '✓' : '•'}
                                        </span>
                                        <div className="flex-1 flex justify-between gap-2">
                                          <span className={factor.isGood ? 'text-slate-400' : 'text-slate-300 font-medium'}>
                                            {factor.text}
                                          </span>
                                          {factor.points > 0 && (
                                            <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                              +{factor.points} pts
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Liquidez de Mercado Section */}
                      {(() => {
                        const liquidity = calculateMarketLiquidity(selectedProperty);
                        return (
                          <div className="bg-[#0E0E0E] rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                            <div 
                              onClick={() => setIsLiquidityExpanded(!isLiquidityExpanded)}
                              className="flex items-center justify-between cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className={`h-4 w-4 ${liquidity.level === 'Altíssima' || liquidity.level === 'Alta' ? 'text-emerald-400' : liquidity.level === 'Média' ? 'text-amber-400' : 'text-rose-400'}`} />
                                <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Liquidez de Mercado</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none shrink-0 ${liquidity.bgColor}`}>
                                  Giro {liquidity.level}
                                </span>
                                {isLiquidityExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {isLiquidityExpanded && (
                              <div className="space-y-3 mt-3 animate-fadeIn">
                                {/* Estimated Resale Time Highlight */}
                                <div className="bg-[#10B981]/5 rounded-xl p-3 border border-[#10B981]/15 text-center flex flex-col justify-center items-center">
                                  <span className="text-[9px] text-[#10B981] block font-bold font-mono tracking-wider uppercase">PRAZO ESTIMADO DE REVENDA</span>
                                  <span className="text-base font-black text-[#10B981] font-mono block mt-0.5">{liquidity.prazoTexto}</span>
                                </div>

                                <div className="space-y-1.5 bg-[#000000]/30 rounded-xl p-3 border border-[#2C2C2E]/60">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-300">Índice Geral de Liquidez</span>
                                    <span className={`text-sm font-mono font-black ${liquidity.level === 'Altíssima' || liquidity.level === 'Alta' ? 'text-emerald-400' : liquidity.level === 'Média' ? 'text-amber-400' : 'text-rose-400'}`}>{liquidity.score}/100</span>
                                  </div>
                                  <div className="w-full bg-[#2C2C2E] rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 rounded-full ${liquidity.barColor}`}
                                      style={{ width: `${liquidity.score}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[9px] text-slate-400 block font-bold font-mono tracking-wider uppercase">Sinalizadores & Fatores de Demanda:</span>
                                  <div className="space-y-1.5 pl-0.5">
                                    {liquidity.analysis.map((line, index) => (
                                      <div key={index} className="flex items-start gap-2 text-[11px] leading-tight">
                                        <span className="mt-0.5 text-xs font-bold text-[#10B981] shrink-0">•</span>
                                        <span className="text-slate-300">
                                          {line}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* CTA Buttons */}
                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          onClick={() => {
                            setShowDetails(false);
                            setIsEditingNotes(false);
                            setIsParticipationDropdownOpen(false);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full py-2 px-3 bg-[#1C1C1E] hover:bg-[#1C1C1E]/80 text-[#F8FAFC] border border-[#2C2C2E] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                        >
                          Fechar Ficha
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* MODAL: EDITAR IMÓVEL */}
      <AnimatePresence>
        {isEditModalOpen && editingLot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingLot(null);
              }}
              className="fixed inset-0 bg-zinc-950/45 backdrop-blur-xs cursor-pointer"
              id="edit-imovel-modal-backdrop"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-[#1C1C1E] rounded-3xl border border-[#2C2C2E] shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
              id="edit-imovel-modal"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#2C2C2E] bg-[#1C1C1E]/65 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#10B981]/15 text-[#10B981] p-2 rounded-xl">
                    <Pencil className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#F8FAFC]">Editar Imóvel</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">Atualização de Dados Cadastrais</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirmId(editingLot.id);
                      setIsEditModalOpen(false);
                      setEditingLot(null);
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    title="Excluir Imóvel"
                    id="btn-delete-edit-imovel"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingLot(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                    id="btn-close-edit-imovel-modal"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEditLot} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Tipo de Imóvel */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">TIPO DE IMÓVEL *</label>
                  <select
                    value={editTypeText}
                    onChange={(e) => setEditTypeText(e.target.value)}
                    className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                    required
                  >
                    {['Apartamento', 'Casa', 'Sobrado', 'Terreno / Lote', 'Loja / Sala Comercial', 'Pavilhão / Galpão', 'Vaga de Garagem', 'Sítio / Chácara', 'Prédio Inteiro'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Nome do Condomínio / Edifício */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">CONDOMÍNIO / EDIFÍCIO</label>
                  <input
                    type="text"
                    value={editCondoName}
                    onChange={(e) => setEditCondoName(e.target.value)}
                    className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                    placeholder="Ex: Edifício Solar das Acácias"
                  />
                </div>

                {/* Endereço / Rua */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">ENDEREÇO / RUA *</label>
                  <input
                    type="text"
                    value={editStreet}
                    onChange={(e) => setEditStreet(e.target.value)}
                    className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                    placeholder="Ex: Av. Carlos Gomes"
                    required
                  />
                </div>

                {/* Número e Complemento */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">NÚMERO</label>
                    <input
                      type="text"
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 1200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">COMPLEMENTO</label>
                    <input
                      type="text"
                      value={editComplement}
                      onChange={(e) => setEditComplement(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: Ap 302 Bloco B"
                    />
                  </div>
                </div>

                {/* Bairro e Estado */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">BAIRRO *</label>
                    <input
                      type="text"
                      value={editNeighborhood}
                      onChange={(e) => setEditNeighborhood(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: Centro"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">ESTADO *</label>
                    <select
                      value={editState}
                      onChange={(e) => {
                        setEditState(e.target.value);
                      }}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                      required
                    >
                      {BRAZIL_STATES.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cidade */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">CIDADE *</label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                    required
                  >
                    {editCitiesList.map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>

                {/* Área Total e Área Privativa */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">ÁREA TOTAL (M²)</label>
                    <input
                      type="text"
                      value={editArea}
                      onChange={(e) => setEditArea(formatTypingToBrazilian(e.target.value))}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 120,00"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">ÁREA PRIVATIVA (M²)</label>
                    <input
                      type="text"
                      value={editPrivateArea}
                      onChange={(e) => setEditPrivateArea(formatTypingToBrazilian(e.target.value))}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 85,00"
                    />
                  </div>
                </div>

                {/* Dormitórios e Garagem */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">DORMITÓRIOS</label>
                    <select
                      value={editBedrooms}
                      onChange={(e) => setEditBedrooms(Number(e.target.value))}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                    >
                      {[1, 2, 3, 4].map((num) => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Dormitório' : 'Dormitórios'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">GARAGEM</label>
                    <select
                      value={editGarage}
                      onChange={(e) => setEditGarage(e.target.value as any)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="Não possui">Não possui</option>
                      <option value="Box">Box</option>
                      <option value="Rotativo">Rotativo</option>
                    </select>
                  </div>
                </div>

                {/* Matrícula e Zona */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">MATRÍCULA</label>
                    <input
                      type="text"
                      value={editRegistration}
                      onChange={(e) => setEditRegistration(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 123.456"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">ZONA</label>
                    <input
                      type="text"
                      value={editZone}
                      onChange={(e) => setEditZone(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 1ª Zona"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">PORTAL / LEILOEIRO</label>
                    <select
                      value={editPortalName}
                      onChange={(e) => setEditPortalName(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium disabled:opacity-40"
                      disabled={portalsList.length === 0}
                    >
                      {portalsList.length === 0 ? (
                        <option value="">Nenhum cadastrado (Aba 'Portais')</option>
                      ) : (
                        portalsList.map((pt) => (
                          <option key={pt} value={pt}>{pt}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">DATA DO LEILÃO</label>
                    <input
                      type="date"
                      value={editAuctionDate}
                      onChange={(e) => setEditAuctionDate(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium"
                    />
                  </div>
                </div>

                {/* Link */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">LINK DO LEILÃO / IMÓVEL</label>
                  <input
                    type="url"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                    placeholder="Ex: https://www.leiloeiro.com.br/lote/123"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">AVALIAÇÃO DE MERCADO (R$)</label>
                  <input
                    type="text"
                    value={editMarketValue}
                    onChange={(e) => setEditMarketValue(formatTypingToBrazilian(e.target.value))}
                    className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                    placeholder="Ex: 350.000,00"
                  />
                </div>

                {editMarketValue && parseValueToNumber(editMarketValue) > 0 && (
                  <div className="p-3 bg-[#10B981]/10 rounded-xl border border-emerald-500/20 text-xs space-y-1 text-slate-300">
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider font-mono">Simulador de Teto em Tempo Real</span>
                    <p className="leading-relaxed font-medium">Regra de 60%: Lance Máximo Sugerido de <strong className="text-[#10B981] font-mono">{formatBRL(getSuggestedBidOnFly(editMarketValue, editCommission))}</strong>.</p>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">LANCE (R$)</label>
                  <input
                    type="text"
                    value={editSuggestedBid}
                    onChange={(e) => setEditSuggestedBid(formatTypingToBrazilian(e.target.value))}
                    className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                    placeholder="Ex: 210.000,00"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1.5">OCUPAÇÃO *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Verificar', 'Ocupado', 'Desocupado'].map((status) => {
                      const isActive = editOccupancyStatus === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setEditOccupancyStatus(status)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                            isActive
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-[#2C2C2E]/40 border-[#2C2C2E] text-slate-300 hover:bg-[#2C2C2E] hover:border-zinc-700'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingLot(null);
                    }}
                    className="flex-1 py-2.5 px-4 bg-[#2C2C2E] hover:bg-zinc-800 text-slate-300 border border-[#2C2C2E] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-200" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE IMÓVEL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <Trash2 className="h-6 w-6 shrink-0" />
                <h3 className="text-sm font-bold text-white">Excluir Imóvel</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tem certeza que deseja excluir este imóvel? Esta ação não poderá ser desfeita.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#2C2C2E] hover:bg-zinc-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveLot(deleteConfirmId)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
