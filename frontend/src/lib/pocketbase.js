import PocketBase from 'pocketbase';

// In production, when served by PocketBase, origin is window.location.origin
export const pb = new PocketBase(typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8095');

// Auto cancel duplicate requests is disabled to prevent race conditions during state updates
pb.autoCancellation(false);
