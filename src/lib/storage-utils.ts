"use client";

import { createLogger } from "./logger";

const logger = createLogger("StorageUtils");

/**
 * Enhanced localStorage utility with robust error handling and fallback mechanisms
 * Based on Context7 best practices for client-side storage
 */
export class StorageUtils {
  private static isStorageAvailable(storage: Storage): boolean {
    try {
      if (typeof storage === "undefined") return false;
      const testKey = "__storage_test__";
      storage.setItem(testKey, "test");
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private static isClientSide(): boolean {
    return typeof window !== "undefined";
  }

  /**
   * Safely get an item from localStorage with fallback to sessionStorage
   */
  static getItem(key: string): string | null {
    if (!this.isClientSide()) {
      logger.debug("🔧 Server-side environment, skipping storage access");
      return null;
    }

    try {
      // Try localStorage first
      if (this.isStorageAvailable(localStorage)) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          logger.debug(`✅ Retrieved from localStorage: ${key}`);
          return value;
        }
      }

      // Fallback to sessionStorage
      if (this.isStorageAvailable(sessionStorage)) {
        const value = sessionStorage.getItem(key);
        if (value !== null) {
          logger.warn(`📦 Retrieved from sessionStorage as fallback: ${key}`);
          return value;
        }
      }

      logger.debug(`📝 No data found for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get item ${key}:`, undefined, error);
      return null;
    }
  }

  /**
   * Safely set an item to localStorage with fallback to sessionStorage
   */
  static setItem(key: string, value: string): boolean {
    if (!this.isClientSide()) {
      logger.debug("🔧 Server-side environment, skipping storage access");
      return false;
    }

    try {
      // Try localStorage first
      if (this.isStorageAvailable(localStorage)) {
        localStorage.setItem(key, value);
        
        // Verify the save was successful
        const saved = localStorage.getItem(key);
        if (saved === value) {
          logger.debug(`✅ Saved to localStorage: ${key}`);
          return true;
        } else {
          throw new Error("Failed to verify localStorage save");
        }
      }

      // Fallback to sessionStorage
      if (this.isStorageAvailable(sessionStorage)) {
        sessionStorage.setItem(key, value);
        
        // Verify the save was successful
        const saved = sessionStorage.getItem(key);
        if (saved === value) {
          logger.warn(`⚠️ Saved to sessionStorage as fallback: ${key}`);
          return true;
        } else {
          throw new Error("Failed to verify sessionStorage save");
        }
      }

      logger.error(`❌ No storage available for key: ${key}`);
      return false;
    } catch (error) {
      logger.error(`❌ Failed to set item ${key}:`, undefined, error);
      return false;
    }
  }

  /**
   * Safely remove an item from both localStorage and sessionStorage
   */
  static removeItem(key: string): void {
    if (!this.isClientSide()) {
      logger.debug("🔧 Server-side environment, skipping storage access");
      return;
    }

    try {
      if (this.isStorageAvailable(localStorage)) {
        localStorage.removeItem(key);
      }
      if (this.isStorageAvailable(sessionStorage)) {
        sessionStorage.removeItem(key);
      }
      logger.debug(`🗑️ Removed item: ${key}`);
    } catch (error) {
      logger.error(`❌ Failed to remove item ${key}:`, undefined, error);
    }
  }

  /**
   * Safely get and parse JSON from storage
   */
  static getJSON<T = any>(key: string, defaultValue: T): T {
    const value = this.getItem(key);
    if (value === null) {
      logger.debug(`📝 Using default value for key: ${key}`);
      return defaultValue;
    }

    try {
      const parsed = JSON.parse(value);
      logger.debug(`✅ Parsed JSON for key: ${key}`);
      return parsed;
    } catch (error) {
      logger.error(`❌ Failed to parse JSON for key ${key}:`, undefined, error);
      
      // Clean up corrupted data
      this.removeItem(key);
      
      logger.debug(`🧹 Cleaned up corrupted data for key: ${key}`);
      return defaultValue;
    }
  }

  /**
   * Safely set JSON to storage
   */
  static setJSON<T = any>(key: string, value: T): boolean {
    try {
      const jsonString = JSON.stringify(value);
      const success = this.setItem(key, jsonString);
      if (success) {
        logger.debug(`✅ Saved JSON for key: ${key}`);
      }
      return success;
    } catch (error) {
      logger.error(`❌ Failed to stringify/save JSON for key ${key}:`, undefined, error);
      return false;
    }
  }

  /**
   * Clear all storage (useful for debugging)
   */
  static clear(): void {
    if (!this.isClientSide()) {
      logger.debug("🔧 Server-side environment, skipping storage clear");
      return;
    }

    try {
      if (this.isStorageAvailable(localStorage)) {
        localStorage.clear();
        logger.debug("🧹 Cleared localStorage");
      }
      if (this.isStorageAvailable(sessionStorage)) {
        sessionStorage.clear();
        logger.debug("🧹 Cleared sessionStorage");
      }
    } catch (error) {
      logger.error("❌ Failed to clear storage:", undefined, error);
    }
  }

  /**
   * Get storage info for debugging
   */
  static getStorageInfo(): {
    localStorage: { available: boolean; used?: number; total?: number };
    sessionStorage: { available: boolean; used?: number; total?: number };
  } {
    const info = {
      localStorage: { available: false },
      sessionStorage: { available: false }
    };

    if (!this.isClientSide()) {
      return info;
    }

    try {
      info.localStorage.available = this.isStorageAvailable(localStorage);
      if (info.localStorage.available) {
        // Estimate localStorage usage
        let used = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            used += localStorage[key].length + key.length;
          }
        }
        (info.localStorage as any).used = used;
        // Most browsers limit localStorage to 5-10MB
        (info.localStorage as any).total = 5 * 1024 * 1024; // 5MB estimate
      }
    } catch (error) {
      logger.warn("⚠️ Failed to get localStorage info:", undefined, error);
    }

    try {
      info.sessionStorage.available = this.isStorageAvailable(sessionStorage);
      if (info.sessionStorage.available) {
        // Estimate sessionStorage usage
        let used = 0;
        for (let key in sessionStorage) {
          if (sessionStorage.hasOwnProperty(key)) {
            used += sessionStorage[key].length + key.length;
          }
        }
        (info.sessionStorage as any).used = used;
        (info.sessionStorage as any).total = 5 * 1024 * 1024; // 5MB estimate
      }
    } catch (error) {
      logger.warn("⚠️ Failed to get sessionStorage info:", undefined, error);
    }

    return info;
  }
}

/**
 * Convenience methods for common operations
 */
export const storage = {
  get: StorageUtils.getItem,
  set: StorageUtils.setItem,
  remove: StorageUtils.removeItem,
  getJSON: StorageUtils.getJSON,
  setJSON: StorageUtils.setJSON,
  clear: StorageUtils.clear,
  info: StorageUtils.getStorageInfo
};
