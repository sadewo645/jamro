export class EventStream {
  constructor({ store, clock }) {
    this.store = store;
    this.clock = clock;
    this.clients = new Set();
    this.unsubscribeStore = this.store.subscribe((event, payload) => {
      this.broadcast(event, payload);
    });
    this.clock.subscribe((time) => {
      this.broadcast('tick', { now: time.toISOString() });
    });
  }

  addClient(res) {
    this.clients.add(res);
    res.on('close', () => {
      this.clients.delete(res);
    });
    res.write(`event: welcome\n`);
    res.write(`data: ${JSON.stringify({ message: 'connected', now: new Date().toISOString() })}\n\n`);
  }

  broadcast(event, payload) {
    const data = `event: ${event}\n` + `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.clients) {
      client.write(data);
    }
  }
}
