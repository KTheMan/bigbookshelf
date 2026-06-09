export const Dialog = {
  async alert() {},
  async confirm() { return { value: true } },
  async prompt() { return { value: '' } },
  async pickFiles() { return { files: [] } }
}