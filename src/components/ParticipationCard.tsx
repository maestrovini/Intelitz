import React, { useState, useEffect } from 'react';
import { Users, PieChart, ChevronDown, ChevronUp, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { ImovelLot, AppUser } from '../types';

interface ParticipationCardProps {
  property: ImovelLot;
  users: AppUser[];
  currentUser?: AppUser | null;
  canEdit?: boolean;
  onUpdateProperty: (propertyId: string, updatedFields: Partial<ImovelLot>) => void;
  onSyncParticipationPercent?: (percent: number) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const USER_COLORS = [
  { bg: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.85)]', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { bg: 'bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-300 shadow-[0_0_8px_rgba(59,130,246,0.85)]', text: 'text-blue-400', border: 'border-blue-500/30' },
  { bg: 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-pink-300 shadow-[0_0_8px_rgba(168,85,247,0.85)]', text: 'text-purple-400', border: 'border-purple-500/30' },
  { bg: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-300 shadow-[0_0_8px_rgba(245,158,11,0.85)]', text: 'text-amber-400', border: 'border-amber-500/30' },
  { bg: 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-300 shadow-[0_0_8px_rgba(6,182,212,0.85)]', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { bg: 'bg-gradient-to-r from-rose-500 via-pink-400 to-red-300 shadow-[0_0_8px_rgba(244,63,94,0.85)]', text: 'text-rose-400', border: 'border-rose-500/30' },
  { bg: 'bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.85)]', text: 'text-indigo-400', border: 'border-indigo-500/30' },
];

export default function ParticipationCard({
  property,
  users = [],
  currentUser,
  canEdit = true,
  onUpdateProperty,
  onSyncParticipationPercent,
  isExpanded,
  onToggle,
}: ParticipationCardProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isControlled = isExpanded !== undefined && onToggle !== undefined;
  const isOpen = isControlled ? isExpanded : localIsOpen;
  const handleToggle = isControlled ? onToggle : () => setLocalIsOpen(!localIsOpen);

  useEffect(() => {
    if (!isControlled) {
      setLocalIsOpen(false);
    }
  }, [property?.id, isControlled]);

  // Assignable users (exclude system admin)
  const assignableUsers = users.filter(u => u.id !== 'usr-admin' && u.username !== 'admin');

  // Determine which user IDs are currently active
  const getAssignedUserIds = (): string[] => {
    if (!property.assignedUserIds || property.assignedUserIds.includes('all')) {
      return assignableUsers.map(u => u.id);
    }
    if (property.assignedUserIds.includes('none')) {
      return [];
    }
    return property.assignedUserIds;
  };

  const assignedUserIds = getAssignedUserIds();

  // Get current user shares map
  const getShares = (): Record<string, number> => {
    if (property.userShares && Object.keys(property.userShares).length > 0) {
      return property.userShares;
    }
    // Default equal distribution if no shares set
    if (assignedUserIds.length === 0) return {};
    const equalShare = Math.round((100 / assignedUserIds.length) * 100) / 100;
    const initialShares: Record<string, number> = {};
    assignedUserIds.forEach(id => {
      initialShares[id] = equalShare;
    });
    return initialShares;
  };

  const shares = getShares();

  // Calculate sum of percentages for assigned users
  const totalPercentage = assignedUserIds.reduce((sum, id) => {
    return sum + (shares[id] || 0);
  }, 0);

  const formattedTotal = Math.round(totalPercentage * 100) / 100;
  const isTotal100 = Math.abs(formattedTotal - 100) < 0.01;

  // Toggle user inclusion in lot
  const handleToggleUser = (userId: string) => {
    if (!canEdit) return;

    let updatedAssigned: string[];
    const isCurrentlyAssigned = assignedUserIds.includes(userId);

    if (isCurrentlyAssigned) {
      updatedAssigned = assignedUserIds.filter(id => id !== userId);
    } else {
      updatedAssigned = [...assignedUserIds, userId];
    }

    // Convert to storage format
    let newAssignedUserIds: string[];
    if (updatedAssigned.length === 0) {
      newAssignedUserIds = ['none'];
    } else if (updatedAssigned.length === assignableUsers.length) {
      newAssignedUserIds = ['all'];
    } else {
      newAssignedUserIds = updatedAssigned;
    }

    // Recalculate shares equally for new assigned group
    const newShares: Record<string, number> = { ...shares };
    if (!isCurrentlyAssigned) {
      // Added new user -> distribute equally or set share
      const newCount = updatedAssigned.length;
      const equalShare = Math.round((100 / newCount) * 100) / 100;
      updatedAssigned.forEach(id => {
        newShares[id] = equalShare;
      });
    } else {
      delete newShares[userId];
      // Redistribute among remaining
      if (updatedAssigned.length > 0) {
        const equalShare = Math.round((100 / updatedAssigned.length) * 100) / 100;
        updatedAssigned.forEach(id => {
          newShares[id] = equalShare;
        });
      }
    }

    onUpdateProperty(property.id, {
      assignedUserIds: newAssignedUserIds,
      userShares: newShares,
    });

    if (currentUser && onSyncParticipationPercent) {
      if (updatedAssigned.includes(currentUser.id)) {
        onSyncParticipationPercent(newShares[currentUser.id] || 100);
      }
    }
  };

  // Change individual percentage
  const handleShareChange = (userId: string, value: number) => {
    if (!canEdit) return;
    const newShares = {
      ...shares,
      [userId]: Math.max(0, Math.min(100, value)),
    };

    onUpdateProperty(property.id, {
      userShares: newShares,
    });

    if (currentUser && currentUser.id === userId && onSyncParticipationPercent) {
      onSyncParticipationPercent(newShares[userId]);
    }
  };

  // Distribute equally among selected users
  const handleDistributeEqually = () => {
    if (!canEdit || assignedUserIds.length === 0) return;
    const equalShare = Math.round((100 / assignedUserIds.length) * 100) / 100;
    const newShares: Record<string, number> = {};
    assignedUserIds.forEach(id => {
      newShares[id] = equalShare;
    });

    onUpdateProperty(property.id, {
      userShares: newShares,
    });

    if (currentUser && onSyncParticipationPercent && assignedUserIds.includes(currentUser.id)) {
      onSyncParticipationPercent(equalShare);
    }
  };

  return (
    <div className="bg-[#0E0E0E] rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
      {/* Card Header */}
      <div
        onClick={handleToggle}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-[#10B981]" />
          <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">
            Participação dos Usuários
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
            {assignedUserIds.length} {assignedUserIds.length === 1 ? 'Participante' : 'Participantes'}
          </span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Card Body */}
      {isOpen && (
        <div className="space-y-4 mt-3 animate-fadeIn">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-1 pb-2 border-b border-[#2C2C2E]/60 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">
              Selecione os operadores participantes e defina o percentual de cada um:
            </span>
            {canEdit && assignedUserIds.length > 0 && (
              <button
                type="button"
                onClick={handleDistributeEqually}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                title="Dividir 100% igualmente entre os selecionados"
              >
                <RefreshCw className="h-3 w-3" />
                Dividir Igualmente
              </button>
            )}
          </div>

          {/* User Participation List */}
          <div className="space-y-2">
            {assignableUsers.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Nenhum usuário operador cadastrado.
              </p>
            ) : (
              assignableUsers.map((u, idx) => {
                const isSelected = assignedUserIds.includes(u.id);
                const userShare = shares[u.id] !== undefined ? shares[u.id] : 0;
                const color = USER_COLORS[idx % USER_COLORS.length];

                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#18181A] border-[#2C2C2E]'
                        : 'bg-[#121214]/60 border-[#2C2C2E]/40 opacity-60'
                    }`}
                  >
                    {/* Left: User Select Checkbox & Info */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleUser(u.id)}
                        className={`p-1 rounded transition-colors ${
                          canEdit ? 'cursor-pointer hover:bg-[#2C2C2E]' : 'cursor-default'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#10B981]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500" />
                        )}
                      </button>

                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-full ${color.bg} flex items-center justify-center text-[10px] font-bold text-black uppercase font-mono`}>
                          {(u.name || u.username).substring(0, 2)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {u.name || u.username}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {u.role === 'admin' ? 'Administrador' : 'Operador'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Percentage Input */}
                    {isSelected && (
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-400 font-mono">Participação:</span>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            disabled={!canEdit}
                            value={userShare}
                            onChange={(e) => handleShareChange(u.id, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-[#000000]/60 text-right pr-6 pl-2 py-1 text-xs font-mono font-bold text-emerald-400 border border-[#2C2C2E] rounded-lg focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-80"
                          />
                          <span className="absolute right-2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Visual Multi-Segment Participation Progress Bar */}
          {assignedUserIds.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#2C2C2E]/60">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Distribuição de Cotas</span>
                <span className={isTotal100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {formattedTotal}% / 100%
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-[#1C1C1E] h-2.5 rounded-full overflow-visible flex border border-[#2C2C2E] relative">
                {assignableUsers.map((u, idx) => {
                  if (!assignedUserIds.includes(u.id)) return null;
                  const share = shares[u.id] || 0;
                  if (share <= 0) return null;
                  const color = USER_COLORS[idx % USER_COLORS.length];
                  const isCurrentUser = currentUser?.id === u.id;
                  const totalUpfront = property.suggestedBid || (property as any).secondBid || (property as any).secondBidValue || property.marketValue || 0;
                  const shareValueInReais = (totalUpfront * share) / 100;
                  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shareValueInReais);

                  return (
                    <div
                      key={u.id}
                      style={{ width: `${Math.min(100, share)}%` }}
                      className={`relative group/segment ${color.bg} h-full transition-all duration-300 cursor-pointer ${
                        isCurrentUser
                          ? 'hover:scale-y-[1.8] hover:brightness-125 hover:ring-2 hover:ring-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.9)] z-20 hover:animate-pulse'
                          : 'hover:scale-y-[1.5] hover:brightness-110 hover:ring-1 hover:ring-white/60 z-10'
                      }`}
                    >
                      {/* Tooltip Flutuante */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/segment:opacity-100 transition-all duration-200 pointer-events-none z-30 flex flex-col items-center whitespace-nowrap">
                        <div className="bg-zinc-950/95 text-white text-[10.5px] font-sans px-2.5 py-1.5 rounded-lg border border-zinc-700/80 shadow-2xl backdrop-blur-md flex flex-col items-center gap-0.5">
                          <span className="font-bold text-slate-100 flex items-center gap-1">
                            {u.name || u.username} {isCurrentUser ? <span className="text-emerald-400 text-[9px] font-mono font-extrabold">(Você)</span> : ''}
                          </span>
                          <span className="text-slate-300 font-mono text-[9.5px]">
                            <strong className={isCurrentUser ? 'text-emerald-400' : 'text-cyan-400'}>{share}% Cotas</strong>
                            {shareValueInReais > 0 && (
                              <span className="text-emerald-400 font-bold ml-1">
                                • {formattedValue}
                              </span>
                            )}
                          </span>
                        </div>
                        {/* Seta do tooltip */}
                        <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-950/95" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono text-slate-300">
                {assignableUsers.map((u, idx) => {
                  if (!assignedUserIds.includes(u.id)) return null;
                  const share = shares[u.id] || 0;
                  const color = USER_COLORS[idx % USER_COLORS.length];
                  return (
                    <div key={u.id} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${color.bg}`} />
                      <span className="text-slate-300 font-medium">{u.name || u.username}:</span>
                      <strong className={`${color.text}`}>{share}%</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
