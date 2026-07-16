import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { AuctionItem, FeasibilityCalculation, LotAlert, AuctionPortal, VehicleLot, ImovelLot, AppUser } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App gracefully
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get firestore instance with custom database ID and ignore undefined properties
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId || '(default)');

export { db };

// Retrieve or generate a persistent device context id for guest synchronization
export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem('intelitz_device_id') || localStorage.getItem('leilutz_device_id');
    if (!deviceId || deviceId === 'leilutz_production_v1' || deviceId.startsWith('dev_')) {
      // Use 'vinicius' as the stable default identifier so user data is perfectly preserved across devices/sessions
      deviceId = 'vinicius';
    }
    localStorage.setItem('intelitz_device_id', deviceId);
    return deviceId;
  } catch {
    return 'vinicius';
  }
}

export function setDeviceId(id: string): void {
  try {
    localStorage.setItem('intelitz_device_id', id.trim());
    localStorage.setItem('leilutz_device_id', id.trim());
  } catch (e) {
    console.error('Failed to set device id: ', e);
  }
}

export interface IntelitzSyncedState {
  favorites?: string[];
  savedSimulations?: FeasibilityCalculation[];
  alerts?: LotAlert[];
  portals?: AuctionPortal[];
  auctions?: AuctionItem[];
  consultorVehicles?: VehicleLot[];
  consultorProperties?: ImovelLot[];
  users?: AppUser[];
  lastSyncedAt?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Pushes the local state directly to Firebase Firestore
 */
export async function saveStateToFirebase(state: IntelitzSyncedState): Promise<void> {
  const deviceId = getDeviceId();
  const path = `leilutz_app_data/${deviceId}`;
  try {
    const docRef = doc(db, 'leilutz_app_data', deviceId);
    await setDoc(docRef, {
      ...state,
      deviceId,
      lastSyncedAt: new Date().toISOString()
    }, { merge: true });
    console.log('State successfully synchronized with cloud database (Firebase Firestore)');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Loads the current state from Firebase Firestore
 */
export async function fetchStateFromFirebase(): Promise<IntelitzSyncedState | null> {
  const deviceId = getDeviceId();
  const path = `leilutz_app_data/${deviceId}`;
  try {
    const docRef = doc(db, 'leilutz_app_data', deviceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as IntelitzSyncedState;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Subscribes to real-time updates from Firebase Firestore for this device
 */
export function subscribeToState(callback: (state: IntelitzSyncedState, exists: boolean) => void): () => void {
  const deviceId = getDeviceId();
  const path = `leilutz_app_data/${deviceId}`;
  try {
    const docRef = doc(db, 'leilutz_app_data', deviceId);
    return onSnapshot(docRef, (docSnap) => {
      callback((docSnap.data() as IntelitzSyncedState) || {}, docSnap.exists());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (error) {
    console.error('Failed to setup Firebase real-time subscription:', error);
    return () => {};
  }
}
