export const Preferences = {
  async get({ key }) { return { value: localStorage.getItem(key) } },
  async set({ key, value }) { localStorage.setItem(key, value) },
  async remove({ key }) { localStorage.removeItem(key) },
  async clear() { localStorage.clear() },
  async keys() { return { keys: Object.keys(localStorage) } }
}