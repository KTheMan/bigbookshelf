export const App = {
  async getInfo() { return { name: 'Bigbookshelf', version: '0.13.0-beta', build: '1', platform: 'webos' } },
  async getState() { return { isActive: true } },
  async addListener() { return { remove: () => {} } }
}