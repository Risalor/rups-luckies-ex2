class CircuitGraph {
    constructor() {
        this.nodes = new Map();
        this.components = [];
        this.MERGE_RADIUS = 50;
    }

    addNode(node) {
        if (!node) return null;
        if (!node.connected) node.connected = new Set();

        for (const existingNode of this.nodes.values()) {
            const dx = existingNode.x - node.x;
            const dy = existingNode.y - node.y;
            const distance = Math.hypot(dx, dy);

            if (distance < this.MERGE_RADIUS) {
                console.log(`Merging node ${node.id} with ${existingNode.id}`);
                existingNode.connected.add(node);
                node.connected.add(existingNode);
                return existingNode;
            }
        }

        console.log(`Adding new node ${node.id} at (${node.x},${node.y})`);
        this.nodes.set(node.id, node);
        return node;
    }

    addComponent(component) {
        if (!component || !component.start || !component.end) return;

        console.log(`Adding component ${component.id} of type ${component.type}`);
        component.start = this.addNode(component.start);
        component.end = this.addNode(component.end);

        this.components.push(component);
    }

    getConnections(node) {
        return this.components.filter(comp =>
            this.sameNode(comp.start, node) || this.sameNode(comp.end, node)
        );
    }

    componentConducts(comp) {
        if (!comp) return false;
        if (comp.type === 'switch') return comp.is_on;
        if (comp.type === 'wire' || comp.type === 'bulb' || comp.type === 'resistor') return true;
        return false;
    }

    sameNode(a, b) {
        return a && b && a.x === b.x && a.y === b.y;
    }

    hasClosedLoop(current, target, visitedComps = new Set(), path = []) {
        if (!current || !target) return false;

        path = [...path, current.id];

        if (this.sameNode(current, target) && visitedComps.size > 0) {
            console.log(`Closed loop found! Path: ${path.join(' -> ')}`);
            return true;
        }

        for (const comp of this.getConnections(current)) {
            if (!this.componentConducts(comp) || visitedComps.has(comp)) continue;

            visitedComps.add(comp);
            const next = (this.sameNode(comp.start, current)) ? comp.end : comp.start;
            if (!next) {
                visitedComps.delete(comp);
                continue;
            }

            if (this.hasClosedLoop(next, target, visitedComps, path)) return true;

            visitedComps.delete(comp);
        }

        console.log(`No path from node ${current.id} along this branch. Path so far: ${path.join(' -> ')}`);
        return false;
    }

    simulate() {
        const battery = this.components.find(c => c.type === 'battery');
        if (!battery) {
            console.log("No battery found!");
            return -1;
        }

        console.log(`Battery found: ${battery.id}`);
        console.log("All nodes in graph:", [...this.nodes.values()].map(n => `${n.id}(${n.x},${n.y})`));
        console.log("All components in graph:", this.components.map(c => `${c.id}(${c.type})`));

        const start = battery.start;
        const end = battery.end;

        const closed = this.hasClosedLoop(start, end, new Set());

        if (closed) {
            console.log("Circuit is closed. Current flows!");
            const bulbs = this.components.filter(c => c.type === 'bulb');
            bulbs.forEach(b => { if (b.turnOn) b.turnOn(); });
            return 1;
        } else {
            console.log("Circuit is open. No current flows.");
            const bulbs = this.components.filter(c => c.type === 'bulb');
            bulbs.forEach(b => { if (b.turnOff) b.turnOff(); });
            return 0;
        }
    }
}

export { CircuitGraph };
