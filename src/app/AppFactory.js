class AppFactory {
  static registry = new Map();
  static pending = [];
  static ready = false;

  static register(type, classRef) {
    this.registry.set(type, classRef);
    this.flush();
  }

  static create(type, id) {
    if (!this.ready) {
      this.pending.push([type, id]);
      return null;
    }
    return this.instantiate(type, id);
  }

  static instantiate(type, id) {
    const ClassRef = this.registry.get(type);
    if (!ClassRef) {
      throw new Error(`Unknown component: ${type}`);
    }
    return id ? new ClassRef(id) : new ClassRef();
  }

  static markReady() {
    this.ready = true;
    this.flush();
  }

  static flush() {
    if (!this.ready) return;
    this.pending.forEach(([type, id]) => this.instantiate(type, id));
    this.pending.length = 0;
  }
}
