import MD5 = require('crypto-js/md5');
import { WebStorageCacheItem, IWebStorageCacheItem } from './WebStorageCacheItem';

export const enum StorageType {
  localStorage = 'localStorage',
  sessionStorage = 'sessionStorage'
}

export class WebStorageCache {
  private isStoreEnabled = false;

  constructor(
    public keyPrefix: string = '',
    public timeoutSecs: number = 0,
    storeType: StorageType
  ) {
    this.isStoreEnabled = this.isStorageEnabled(storeType);
  }

  public getItem(key: string, timeoutSecs?: number): any {
    let item = null;
    const effectiveTimeoutSecs = timeoutSecs || this.timeoutSecs;

    if (this.isStoreEnabled && effectiveTimeoutSecs) {
      const storedItem = sessionStorage.getItem(this.getItemKey(key));
      if (storedItem) {
        const cacheItem: IWebStorageCacheItem = JSON.parse(storedItem, this.dateReviver);
        if (cacheItem) {
          if (cacheItem.createdOn.getTime() + effectiveTimeoutSecs * 1000 > Date.now()) {
            item = cacheItem.value;
          }
          else {
            this.removeItem(key);
          }
        }
      }
    }

    return item;
  }

  public setItem(key: string, value: any, timeoutSecs?: number) {
    const effectiveTimeoutSecs = timeoutSecs || this.timeoutSecs;

    if (this.isStoreEnabled && effectiveTimeoutSecs && this.isStorageAvailable(StorageType.sessionStorage)) {
      sessionStorage.setItem(this.getItemKey(key), JSON.stringify(new WebStorageCacheItem(new Date(), value)));
    }
  }

  public removeItem(key: string) {
    if (this.isStoreEnabled) {
      sessionStorage.removeItem(this.getItemKey(key));
    }
  }

  protected getItemKey(key: string) {
    const keyHash = MD5(key).toString(); // Use a hash of the key to keep it short.
    return `${this.keyPrefix}-${keyHash}`;
  }

  protected dateReviver(key: string, value: any) {
    let revivedValue = value;

    if (key === 'createdOn' && typeof value === 'string') {
      revivedValue = new Date(value); // Date string will be in ISO 8601 format.
    }

    return revivedValue;
  }

  protected isStorageEnabled(type: StorageType) {
    const store = (window as any)[type];
    return Boolean(store && store.getItem && store.setItem && store.removeItem);
  }

  protected isStorageAvailable(type: StorageType) {
    const store = (window as any)[type];
    try {
      const storageTestString = '__storage_test__';
      store.setItem(storageTestString, storageTestString);
      store.removeItem(storageTestString);
      return true;
    }
    catch (error) {
      return error instanceof DOMException && store.length !== 0 && ( // Only acknowledge exception if there is something in the store.
        error.code === 2 || // Test legacy code for all browsers except Firefox.
        error.code === 1014 || // Test legacy code for Firefox.
        error.name === 'QuotaExceededError' || // Test for new exception for all browsers except Firefox.
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' // Test for new exception for Firefox.
      );
    }
  }
}
