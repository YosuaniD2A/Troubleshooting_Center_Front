import { Injectable } from '@angular/core';

declare global {
  interface Window {
    electronAPI?: {
      selectFolder: () => Promise<string>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  constructor() { }

  async selectFolder(): Promise<string | null> {
    if (window.electronAPI) {
      return await window.electronAPI.selectFolder();
    }
    return null;
  }
}
