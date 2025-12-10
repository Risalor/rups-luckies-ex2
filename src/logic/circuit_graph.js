class CircuitGraph {
  constructor() {
    this.nodes = new Map();
    this.components = [];
    this.MERGE_RADIUS = 50;
  }

  addNode(node) {
    if (!node) return null;
    if (!node.connected) node.connected = new Set();

    // ce obstaja node z istem id updataj koordinate in vrni 
    const byId = this.nodes.get(node.id);
    if (byId) {
      byId.x = node.x;
      byId.y = node.y;
      return byId;
    }

    // proba najti en obstojec node za mergat
    for (const existingNode of this.nodes.values()) {
      const dx = existingNode.x - node.x;
      const dy = existingNode.y - node.y;
      const distance = Math.hypot(dx, dy);

      if (distance < this.MERGE_RADIUS) {
        console.log(
          `MERGE! ${node.id} (${node.x},${node.y})  ==>  ${existingNode.id} (${existingNode.x},${existingNode.y})`
        );

        // merga sete
        if (!existingNode.connected) existingNode.connected = new Set();
        if (!node.connected) node.connected = new Set();

        node.connected.forEach((n) => existingNode.connected.add(n));
        existingNode.connected.forEach((n) => node.connected.add(n));

        // rebinda comps da uporablajo nov node
        for (const comp of this.components) {
          if (comp.start && this.sameNode(comp.start, node))
            comp.start = existingNode;
          if (comp.end && this.sameNode(comp.end, node))
            comp.end = existingNode;
        }

        if (
          this.nodes.has(node.id) &&
          this.nodes.get(node.id) !== existingNode
        ) {
          this.nodes.delete(node.id);
        }

        return existingNode;
      }
    }

    console.log(`Adding new node ${node.id} at (${node.x},${node.y})`);
    this.nodes.set(node.id, node);
    return node;
  }

  removeComponent(component) {
    if (!component) return;

    const idx = this.components.indexOf(component);
    if (idx === -1) return;

    // odstrani component iz seznama
    this.components.splice(idx, 1);

    const isNodeUsed = (storedNode) => {
      return this.components.some(
        (c) =>
          (c.start && this.sameNode(c.start, storedNode)) ||
          (c.end && this.sameNode(c.end, storedNode))
      );
    };

    // najde node entries (possibly razlicni objekti s enakimi koordinatami) ki se ujemajo z removed komponentom
    const affectedCoords = [];
    if (component.start)
      affectedCoords.push({ x: component.start.x, y: component.start.y });
    if (component.end)
      affectedCoords.push({ x: component.end.x, y: component.end.y });

    for (const [key, storedNode] of Array.from(this.nodes.entries())) {
      // ce storedNode matcha keri affected koordinati
      if (
        affectedCoords.some(
          (ac) => ac.x === storedNode.x && ac.y === storedNode.y
        )
      ) {
        if (!isNodeUsed(storedNode)) {
          this.nodes.delete(key);
        }
      }
    }

    for (const storedNode of this.nodes.values()) {
      if (!storedNode.connected) continue;
      for (const maybe of Array.from(storedNode.connected)) {
        if (!Array.from(this.nodes.values()).includes(maybe)) {
          storedNode.connected.delete(maybe);
        }
      }
    }
  }

  addComponent(component) {
    if (!component || !component.start || !component.end) return;

    console.log(`Adding component ${component.id} of type ${component.type}`);
    component.start = this.addNode(component.start);
    component.end = this.addNode(component.end);

    this.components.push(component);
  }

  getConnections(node) {
    return this.components.filter(
      (comp) => this.sameNode(comp.start, node) || this.sameNode(comp.end, node)
    );
  }

  componentConducts(comp) {
    if (!comp) return false;
    if (comp.type === "switch") return comp.is_on;
    if (
      comp.type === "wire" ||
      comp.type === "bulb" ||
      comp.type === "resistor"
    )
      return true;
    return false;
  }

  sameNode(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  hasClosedLoop(current, target, visitedComps = new Set(), path = []) {
    if (!current || !target) return false;

    path = [...path, current.id];

    if (this.sameNode(current, target) && visitedComps.size > 0) {
      console.log(`Closed loop found! Path: ${path.join(" -> ")}`);
      return true;
    }

    for (const comp of this.getConnections(current)) {
      if (!this.componentConducts(comp) || visitedComps.has(comp)) continue;

      visitedComps.add(comp);
      const next = this.sameNode(comp.start, current) ? comp.end : comp.start;
      if (!next) {
        visitedComps.delete(comp);
        continue;
      }

      if (this.hasClosedLoop(next, target, visitedComps, path)) return true;

      visitedComps.delete(comp);
    }

    console.log(
      `No path from node ${
        current.id
      } along this branch. Path so far: ${path.join(" -> ")}`
    );
    return false;
  }

  simulate() {
    const battery = this.components.find((c) => c.type === "battery");
    if (!battery) {
      console.log("No battery found!");
      return -1;
    }

    console.log(`Battery found: ${battery.id}`);
    console.log(
      "All nodes in graph:",
      [...this.nodes.values()].map((n) => `${n.id}(${n.x},${n.y})`)
    );
    console.log(
      "All components in graph:",
      this.components.map((c) => `${c.id}(${c.type})`)
    );

    const start = battery.start;
    const end = battery.end;

    const closed = this.hasClosedLoop(start, end, new Set());

    if (closed) {
      console.log("Circuit is closed. Current flows!");
      const bulbs = this.components.filter((c) => c.type === "bulb");
      bulbs.forEach((b) => {
        if (b.turnOn) b.turnOn();
      });
      return 1;
    } else {
      console.log("Circuit is open. No current flows.");
      const bulbs = this.components.filter((c) => c.type === "bulb");
      bulbs.forEach((b) => {
        if (b.turnOff) b.turnOff();
      });
      return 0;
    }
  }
}

export { CircuitGraph };
