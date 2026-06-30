export const App = {
  async getInfo() { return { name: 'Bigbookshelf', version: '0.13.3', build: '1', platform: 'web' } },
  async getState() { return { isActive: true } },
  async addListener() { return { remove: () => {} } }
}
