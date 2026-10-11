// Preload scripts can contain Node.js APIs that are exposed to the renderer.
// We use contextIsolation and a context bridge to expose only what we need.

const { contextBridge, ipcRenderer } = require('electron');

// Example: Expose a simple version getter
contextBridge.exposeInMainWorld('electronAPI', {
  // We can add methods here as needed, e.g., for saving/loading settings
  // For now, we'll leave it empty but ready for extension.
});