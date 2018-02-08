export interface IWebStorageCacheItem {
  createdOn: Date;
  value: any;
}

export class WebStorageCacheItem implements IWebStorageCacheItem {
  constructor(
    public createdOn = new Date(),
    public value = null
  ) { }
}
