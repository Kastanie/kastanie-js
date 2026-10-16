export class VersionView {
  render(data) {
    return `Version: ${data.version} (Build ${data.number})`;
  }
}
