export const Network = {
  async getStatus() { return { connected: navigator.onLine, connectionType: 'wifi' } },
  async addListener() {
    return { remove: () => {} }
  }
}