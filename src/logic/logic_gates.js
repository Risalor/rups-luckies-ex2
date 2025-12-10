export class LogicGate {
    constructor(operation, id = null) {
        this.id = id || `gate_${Math.random().toString(36).substr(2, 9)}`;
        this.operation = operation;
        this.inputGates = [];
        this.outputGates = [];
        this.inputValues = [];
        this.cachedOutput = null;
        this.dirty = true;
    }

    connectTo(gate, inputIndex = null) {
        if (inputIndex === null) {
            inputIndex = gate.inputGates.length;
        }
        
        if (this.wouldCreateCycle(gate)) {
            console.log(`Cannot connect ${this.id} to ${gate.id}: Would create a cycle!`);
            return true;
        }
        
        gate.inputGates[inputIndex] = this;
        this.outputGates.push({
            gate: gate,
            inputIndex: inputIndex
        });
        
        this.markDownstreamDirty();
        return false;
    }

    wouldCreateCycle(targetGate) {
        const visited = new Set();
        
        function hasPathTo(start, target) {
            if (start === target) return true;
            if (visited.has(start)) return false;
            
            visited.add(start);
            
            for (const connection of start.outputGates || []) {
                if (hasPathTo(connection.gate, target)) {
                    return true;
                }
            }
            
            return false;
        }
        
        return hasPathTo(targetGate, this);
    }

    disconnectFrom(gate) {
        this.outputGates = this.outputGates.filter(conn => conn.gate !== gate);
        const inputIndex = gate.inputGates.findIndex(inputGate => inputGate === this);
        if (inputIndex !== -1) {
            gate.inputGates[inputIndex] = null;
        }
        gate.markDownstreamDirty();
    }

    setInputs(values) {
        this.inputValues = values;
        this.markDownstreamDirty();
        return this;
    }

    getInputValue(index) {
        if (this.inputGates[index]) {
            return this.inputGates[index].getOutput();
        }
        return this.inputValues[index] || false;
    }

    getAllInputValues() {
        const values = [];
        const maxInputs = Math.max(this.inputGates.length, this.inputValues.length);
        
        for (let i = 0; i < maxInputs; i++) {
            values.push(this.getInputValue(i));
        }
        
        return values;
    }

    calculateOutput() {
        const inputs = this.getAllInputValues();
        
        switch (this.operation) {
            case 'AND':
                return inputs.every(val => val === true);
            case 'OR':
                return inputs.some(val => val === true);
            case 'NOT':
                return !inputs[0];
            case 'NAND':
                return !inputs.every(val => val === true);
            case 'NOR':
                return !inputs.some(val => val === true);
            case 'XOR':
                return inputs.filter(val => val === true).length % 2 === 1;
            case 'XNOR':
                return inputs.filter(val => val === true).length % 2 === 0;
            case 'BUFFER':
                return inputs[0];
            case 'LIGHT':
                // light bulb just reflects its single input (terminal probe)
                return !!inputs[0];
            default:
                throw new Error(`Unknown operation: ${this.operation}`);
        }
    }

    getOutput() {
        if (this.dirty) {
            this.cachedOutput = this.calculateOutput();
            this.dirty = false;
        }

        if(this.inputGates.length === 0 && this.operation !== 'BUFFER') {
            return false;
        }

        return this.cachedOutput;
    }

    markDownstreamDirty() {
        if(!this.dirty) {
            this.dirty = true;
            this.outputGates.forEach(conn => {
                conn.gate.markDownstreamDirty();
            });
        }
    }

    getInfo() {
        return {
            id: this.id,
            operation: this.operation,
            inputs: this.getAllInputValues(),
            output: this.getOutput(),
            connectedOutputs: this.outputGates.length
        };
    }
}

export class InputGate extends LogicGate {
    constructor(value = false, id = null) {
        super('BUFFER', id);
        this.setInputs([value]);
    }
    
    setValue(value) {
        this.setInputs([value]);
    }
}

export class AndGate extends LogicGate {
    constructor(id = null) {
        super('AND', id);
    }
}

export class OrGate extends LogicGate {
    constructor(id = null) {
        super('OR', id);
    }
}

export class NotGate extends LogicGate {
    constructor(id = null) {
        super('NOT', id);
    }
}

export class NandGate extends LogicGate {
    constructor(id = null) {
        super('NAND', id);
    }
}

export class NorGate extends LogicGate {
    constructor(id = null) {
        super('NOR', id);
    }
}

export class XorGate extends LogicGate {
    constructor(id = null) {
        super('XOR', id);
    }
}

export class XnorGate extends LogicGate {
    constructor(id = null) {
        super('XNOR', id);
    }
}

export const GateTypes = {
    input : 'BUFFER',
    and : 'AND',
    or : 'OR',
    not : 'NOT',
    nand : 'NAND',
    nor : 'NOR',
    xor : 'XOR',
    xnor : 'XNOR',
    bulb : 'LIGHT'
};

export class LogicCircuit {
    constructor() {
        this.gates = new Map();
    }

    addGate(type, id, value = null) {
        switch(type) {
            case GateTypes.input:
                this.gates.set(id, new InputGate(true, id));
                return this.gates.get(id);
            case GateTypes.and:
                this.gates.set(id, new AndGate(id));
                return this.gates.get(id);
            case GateTypes.or:
                this.gates.set(id, new OrGate(id));
                return this.gates.get(id);
            case GateTypes.not:
                this.gates.set(id, new NotGate(id));
                return this.gates.get(id);
            case GateTypes.nand:
                this.gates.set(id, new NandGate(id));
                return this.gates.get(id);
            case GateTypes.nor:
                this.gates.set(id, new NorGate(id));
                return this.gates.get(id);
            case GateTypes.xor:
                this.gates.set(id, new XorGate(id));
                return this.gates.get(id);
            case GateTypes.xnor:
                this.gates.set(id, new XnorGate(id));
                return this.gates.get(id);
            case GateTypes.bulb:
                // bulb acts like a probe/terminal that reflects its input
                class LightGate extends LogicGate {
                    constructor(id) { super('LIGHT', id); }
                }
                this.gates.set(id, new LightGate(id));
                return this.gates.get(id);
            default:
                console.log("Incorrect gate type provided!");
                return null;
        }
    }

    /**Returns false if connection could not be created and true when it was created*/
    connectGates(gate_source_id, gate_destination_id) {
        if(this.gates.get(gate_source_id).connectTo(this.gates.get(gate_destination_id))) {
            return false;
        }

        return true;
    }

    /**
     * Connect source -> destination using an explicit input index on the destination.
     * Returns true on success, false on failure.
     */
    connectGatesWithIndex(gate_source_id, gate_destination_id, inputIndex) {
        try {
            const src = this.gates.get(gate_source_id);
            const dst = this.gates.get(gate_destination_id);
            if (!src || !dst) return false;
            if (src.connectTo(dst, inputIndex)) {
                return false;
            }
            return true;
        } catch (err) {
            console.error('connectGatesWithIndex error', err);
            return false;
        }
    }
    
    getGate(id) {
        return this.gates.get(id);
    }
    
    removeGate(id) {
        const gate = this.gates.get(id);
        if (gate) {
            gate.inputGates.forEach((inputGate) => {
                if (inputGate) {
                    inputGate.disconnectFrom(gate);
                }
            });
            
            gate.outputGates.forEach(conn => {
                gate.disconnectFrom(conn.gate);
            });
            
            this.gates.delete(id);
        }
    }
    
    evaluate() {
        const results = {};
        this.gates.forEach((gate, id) => {
            results[id] = gate.getOutput();
        });
        return results;
    }
}

const circuit = new LogicCircuit();

const input1 = circuit.addGate(GateTypes.input, 'input1', true);
const input2 = circuit.addGate(GateTypes.input, 'input2', false);
const andGate = circuit.addGate(GateTypes.nand, 'and1');
const notGate = circuit.addGate(GateTypes.not, 'not1');
const andGate1 = circuit.addGate(GateTypes.and, 'and2');
const notGate1 = circuit.addGate(GateTypes.not, 'not2');

circuit.connectGates('input1', 'and1');
circuit.connectGates('input2', 'not1');
circuit.connectGates('not1', 'and1');
circuit.connectGates('and1', 'and2');
circuit.connectGates('input1', 'and2');
circuit.connectGates('and2', 'not2');
circuit.connectGates('and2', 'and1');

console.log('Circuit results:', circuit.evaluate());