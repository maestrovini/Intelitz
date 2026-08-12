import React from 'react';
import { ImovelLot, AppUser, AuctionPortal } from '../types';
import BaseCardLayout, { MiniCardMetricsTags } from './BaseCardLayout';

export { MiniCardMetricsTags };

export interface PropertyLotCardProps {
  key?: string;
  item: ImovelLot;
  isSelected?: boolean;
  onClick: () => void;
  portals?: AuctionPortal[];
  assignableUsers?: AppUser[];
  activeUserObj?: AppUser | null;
  currentUser?: AppUser | null;
}

export default function PropertyLotCard({
  item,
  isSelected = false,
  onClick,
  portals = [],
  assignableUsers = [],
  activeUserObj,
  currentUser
}: PropertyLotCardProps) {
  return (
    <BaseCardLayout
      item={item}
      isSelected={isSelected}
      onClick={onClick}
      portals={portals}
      assignableUsers={assignableUsers}
      activeUserObj={activeUserObj}
      currentUser={currentUser}
    />
  );
}
