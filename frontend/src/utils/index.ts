// Native storage (Metro picks index.web.ts on web)
// Self-contained: all shared types and the abstract base are defined here to
// avoid a relative ./storage-base import that some editors (with TS < 5.0) flag
// incorrectly under Expo's moduleResolution: \"bundler\".
// Helpers never throw: reads return `fallback`, writes return `false`.
// Values supported: string | number | boolean | null (JSON-serialized on disk).
// Usage: import { storage } from \"@/src/utils/storage\"; await storage.getItem(key, fallback);

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// ───────────────────── Shared types & base ─────────────────────
export type StorageItemKey = string;
export type StorageItemValue = string | number | boolean | null;

// Helper for subclasses to enforce that they don't declare methods beyond
// StorageBase. Use as: type _ = AssertNoExtras<Exclude<keyof Storage, keyof StorageBase>>;
export type AssertNoExtras<T extends never> = T;

export abstract class StorageBase {
  protected warn(op: string, key: StorageItemKey, e: unknown) {
    console.warn(`[storage] ${op}(${key}) failed`, e);
  }

  // raw is whatever AsyncStorage / SecureStore returned: a JSON-encoded string
  // (because setItem always JSON.stringifies) or null if the key was missing.
  // We always JSON.parse so values round-trip correctly across types.
  protected retrieve<Fallback extends StorageItemValue>(
    raw: string | null,
    fallback: Fallback,
  ): Fallback | null {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as Fallback;
    } catch (e) {
      this.warn("retrieve", "parse error", e);
      return fallback;
    }
  }

  abstract getItem<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null>;
  abstract setItem<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean>;
  abstract removeItem(key: string): Promise<boolean>;
  abstract secureGet<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null>;
  abstract secureSet<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean>;
  abstract secureRemove(key: string): Promise<boolean>;
}

// ───────────────────── Native implementation ─────────────────────
export class Storage extends StorageBase {
  // General KV — backed by AsyncStorage.
  async getItem<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return this.retrieve(raw, fallback);
    } catch (e) {
      this.warn("getItem", key, e);
      return fallback;
    }
  }

  async setItem<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      this.warn("setItem", key, e);
      return false;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      this.warn("removeItem", key, e);
      return false;
    }
  }

  // Sensitive values — Keychain (iOS) / EncryptedSharedPreferences (Android).
  async secureGet<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null> {
    try {
      const raw = await SecureStore.getItemAsync(key);
      return this.retrieve(raw, fallback);
    } catch (e) {
      this.warn("secureGet", key, e);
      return fallback;
    }
  }

  async secureSet<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(value));
      return true;
    } catch (e) {
      this.warn("secureSet", key, e);
      return false;
    }
  }

  async secureRemove(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (e) {
      this.warn("secureRemove", key, e);
      return false;
    }
  }
}

export const storage = new Storage();

// Compile-time guard: any new method must be declared in StorageBase above first.
type _NoExtras = AssertNoExtras<Exclude<keyof Storage, keyof StorageBase>>;
