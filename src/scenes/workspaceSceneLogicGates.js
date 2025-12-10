import Phaser from 'phaser';
import LabScene from './labScene';
import { LogicCircuit, GateTypes } from '../logic/logic_gates';

export default class WorkspaceSceneLogicGates extends Phaser.Scene {
    constructor() {
        super('workspaceSceneLogicGates');
    }

    init() {
        this.logicCircuit = new LogicCircuit();
        const savedIndex = localStorage.getItem('currentChallengeIndex');
        this.currentChallengeIndex = savedIndex !== null ? parseInt(savedIndex) : 0;
    }

    preload() {
        // reuse the component gate icon for all gates for now
        this.load.image('gateIcon', 'src/components/GateIco.png');
    }

    create() {
        const { width, height } = this.cameras.main;

        // ensure grid size is available before drawing
        this.gridSize = 40;
        // round rendering to integer pixels to avoid blurry text/sprites
        this.cameras.main.roundPixels = true;

        // background and grid (match workspaceScene look)
        this.add.rectangle(0, 0, width, height, 0xe0c9a6).setOrigin(0);
        this.createGrid();

        // info window
        this.infoWindow = this.add.container(0, 0).setDepth(1000).setVisible(false);
        const infoBox = this.add.rectangle(0, 0, 260, 120, 0x222222, 0.9).setOrigin(0);
        infoBox.setStrokeStyle(2, 0xffffff);
        const infoText = this.add.text(10, 10, '', { fontSize: '14px', color: '#ffffff', wordWrap: { width: 240 } });
        this.infoWindow.add([infoBox, infoText]);
        this.infoText = infoText;

        // sidebar (styled like workspaceScene)
        const panelWidth = 200;
        this.add.rectangle(0, 0, panelWidth, height, 0xc0c0c0).setOrigin(0);
        this.add.rectangle(0, 0, panelWidth, height, 0x000000, 0.2).setOrigin(0);
        // larger title positioned to avoid overlap with Nazaj
        this.add.text(panelWidth / 2, 60, 'Logični elementi', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        // gate list
        const types = [
            { key: 'input', label: 'Input' },
            { key: 'and', label: 'AND' },
            { key: 'or', label: 'OR' },
            { key: 'not', label: 'NOT' },
            { key: 'nand', label: 'NAND' },
            { key: 'nor', label: 'NOR' },
            { key: 'xor', label: 'XOR' },
            { key: 'xnor', label: 'XNOR' }
        ];

        // move sprites down a bit so they don't overlap the title
        let y = 140;
        types.forEach(t => {
            this.createComponent(panelWidth / 2, y, t.key, t.label);
            y += 80;
        });

        // controls (use same button style as WorkspaceScene)
        // bottom status text: always black for readability
        this.checkText = this.add.text(width / 2, height - 70, '', { fontSize: '18px', color: '#000000', fontStyle: 'bold', padding: { x: 15, y: 8 } }).setOrigin(0.5);

        const buttonWidth = 180;
        const buttonHeight = 45;
        const cornerRadius = 10;

        const makeButton = (x, y, label, onClick, opts = {}) => {
            const bg = this.add.graphics();
            const defaultColor = 0x3399ff;
            const hoverColor = 0x0f5cad;
            const activeColor = opts.activeColor || null;

            const drawBg = (color) => {
                bg.clear();
                bg.fillStyle(color, 1);
                bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
            };

            drawBg(defaultColor);

            const button = { bg, active: false, activeColor };

            const text = this.add.text(x, y, label, { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    drawBg(button.active && button.activeColor ? button.activeColor : hoverColor);
                })
                .on('pointerout', () => {
                    drawBg(button.active && button.activeColor ? button.activeColor : defaultColor);
                })
                .on('pointerdown', () => {
                    if (typeof onClick === 'function') {
                        onClick();
                    }
                });

            button.text = text;
            button.setActive = (isActive) => {
                button.active = !!isActive;
                drawBg(button.active && button.activeColor ? button.activeColor : defaultColor);
            };

            return button;
        };

        makeButton(width - 140, 75, 'Lestvica', () => this.scene.start('ScoreboardScene'));
        makeButton(width - 140, 125, 'Preveri', () => this.evaluateCircuit());
        makeButton(width - 140, 175, 'Reset', () => this.resetWorkspace());
        // Povezi button toggles connect mode
        let connectBtn = makeButton(width - 140, 225, 'Povezi', () => {
            this.connectMode = !this.connectMode;
            this.checkText.setText(this.connectMode ? 'Povezovanje: izberi izvor' : '');
            connectBtn.setActive(this.connectMode);
        }, { activeColor: 0xcc0000 });

        const backButton = this.add.text(Math.round(panelWidth / 2), 20, '↩ Nazaj', { fontFamily: 'Arial', fontSize: '20px', color: '#387affff', padding: { x: 20, y: 10 } })
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ color: '#0054fdff' }))
            .on('pointerout', () => backButton.setStyle({ color: '#387affff' }))
            .on('pointerdown', () => {
                this.cameras.main.fade(300, 0, 0, 0);
                this.time.delayedCall(300, () => { this.scene.start('LabScene'); });
            });

        // placement state
        this.placedComponents = [];
        this.connections = []; // { fromId, toId, gfx }
        this.connectMode = false;
        this.connectingSource = null;
        this.gridSize = 40;
        // store grid start to align exactly with the sidebar width so grid touches it
        this.gridStartX = panelWidth;
    }

    createGrid() {
        const { width, height } = this.cameras.main;
        const g = this.add.graphics();
        g.lineStyle(2, 0x8b7355, 0.4);
        const startX = this.gridStartX || 200;
        for (let x = startX; x < width; x += this.gridSize) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.strokePath(); }
        for (let y = 0; y < height; y += this.gridSize) { g.beginPath(); g.moveTo(startX, y); g.lineTo(width, y); g.strokePath(); }
    }

    snapToGrid(x, y) {
        const startX = this.gridStartX || 200;
        const snappedX = Math.round((x - startX) / this.gridSize) * this.gridSize + startX;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;
        return { x: snappedX, y: snappedY };
    }

    getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }

    createComponent(x, y, type, labelText) {
        const container = this.add.container(x, y);
        // panel items default depth so connections draw above the grid but below placed gates
        container.setDepth(5);
        const img = this.add.image(0, 0, 'gateIcon').setDisplaySize(64, 64).setOrigin(0.5);
        container.add(img);

        const label = this.add.text(0, 36, labelText || type, { fontSize: '12px', color: '#fff', backgroundColor: '#00000088', padding: { x: 4, y: 2 } }).setOrigin(0.5);
        container.add(label);

        container.setSize(64, 64);
        container.setInteractive({ draggable: true, useHandCursor: true });

        // store meta
        container.setData('originalX', x);
        container.setData('originalY', y);
        container.setData('type', type);
        container.setData('isInPanel', true);

        this.input.setDraggable(container);

        container.on('pointerover', () => {
            if (container.getData('isInPanel')) {
                this.infoText.setText(`${type.toUpperCase()}\nDrag to place`);
                this.infoWindow.x = x + 120;
                this.infoWindow.y = y - 10;
                this.infoWindow.setVisible(true);
            } else {
                const gate = container.getData('logicGate');
                if (gate) this.infoText.setText(JSON.stringify(gate.getInfo(), null, 2));
                this.infoWindow.x = container.x + 20;
                this.infoWindow.y = container.y - 40;
                this.infoWindow.setVisible(true);
            }
            container.setScale(1.05);
        });

        container.on('pointerout', () => {
            if (container.getData('isInPanel')) this.infoWindow.setVisible(false);
            else this.infoWindow.setVisible(false);
            container.setScale(1);
        });

        container.on('dragstart', () => { container.setData('isDragging', true); });

        container.on('drag', (pointer, dragX, dragY) => { container.x = dragX; container.y = dragY; });

        container.on('dragend', () => {
            const isInPanel = container.x < (this.gridStartX || 200);
            if (isInPanel && !container.getData('isInPanel')) {
                container.destroy();
            } else if (!isInPanel && container.getData('isInPanel')) {
                const snapped = this.snapToGrid(container.x, container.y);
                container.x = snapped.x; container.y = snapped.y;

                // create logic gate in the circuit
                const id = `${type}_${this.getRandomInt(1000, 9999)}`;
                let gateType = null;
                switch (type) {
                    case 'input': gateType = GateTypes.input; break;
                    case 'and': gateType = GateTypes.and; break;
                    case 'or': gateType = GateTypes.or; break;
                    case 'not': gateType = GateTypes.not; break;
                    case 'nand': gateType = GateTypes.nand; break;
                    case 'nor': gateType = GateTypes.nor; break;
                    case 'xor': gateType = GateTypes.xor; break;
                    case 'xnor': gateType = GateTypes.xnor; break;
                    default: gateType = GateTypes.and;
                }

                const gate = this.logicCircuit.addGate(gateType, id);
                container.setData('logicGate', gate);
                container.setData('gateId', id);

                // if it's an input gate, store its boolean value and update label
                if (type === 'input') {
                    container.setData('inputValue', true);
                    label.setText(`${labelText}\n1`);
                }

                container.setData('isInPanel', false);
                // placed gates should be above connection graphics
                container.setDepth(20);
                this.placedComponents.push(container);

                // create a new panel copy
                this.createComponent(container.getData('originalX'), container.getData('originalY'), container.getData('type'), labelText);

            } else if (!container.getData('isInPanel')) {
                const snapped = this.snapToGrid(container.x, container.y);
                container.x = snapped.x; container.y = snapped.y;

                // update any connection lines that reference this gate
                this.updateConnectionsForGate(container.getData('gateId'));
            } else {
                container.x = container.getData('originalX'); container.y = container.getData('originalY');
            }

            this.time.delayedCall(200, () => container.setData('isDragging', false));
        });

        container.on('pointerdown', (pointer) => {
            if (container.getData('isInPanel')) return;

            // Connect mode handling
            if (this.connectMode) {
                    if (!this.connectingSource) {
                    this.connectingSource = container;
                    // highlight
                    const imgChild = container.list.find(c => c.setTint);
                    if (imgChild) imgChild.setTint(0x00ff00);
                    this.checkText.setText('Izberi cilj za povezavo');
                } else if (this.connectingSource === container) {
                    // deselect
                    const imgChild = container.list.find(c => c.clearTint);
                    if (imgChild) imgChild.clearTint();
                    this.connectingSource = null;
                    this.checkText.setText('');
                } else {
                    // attempt connection
                    const sourceId = this.connectingSource.getData('gateId');
                    const targetId = container.getData('gateId');
                    if (!sourceId || !targetId) {
                        this.checkText.setText('Neveljavna vrata za povezavo');
                    } else if (!this.logicCircuit.getGate(sourceId) || !this.logicCircuit.getGate(targetId)) {
                        this.checkText.setText('Vrata niso pripravljena za povezavo');
                    } else {
                        // prevent connecting input gates to each other
                        const sourceType = this.connectingSource.getData('type');
                        const targetType = container.getData('type');
                        if (sourceType === 'input' && targetType === 'input') {
                            this.checkText.setText('Ne morete povezati dveh Input vrat');
                            // clear highlight
                            const imgChildErr = this.connectingSource.list.find(c => c.clearTint);
                            if (imgChildErr) imgChildErr.clearTint();
                            this.connectingSource = null;
                            this.time.delayedCall(1200, () => this.checkText.setText(''));
                            return;
                        }
                        let ok = false;
                        try {
                            ok = this.logicCircuit.connectGates(sourceId, targetId);
                        } catch (err) {
                            console.error('connectGates error', err);
                            ok = false;
                        }

                        if (ok) {
                            this.checkText.setText('Povezano');
                            // draw a line between gates
                            const gfx = this.add.graphics();
                            gfx.lineStyle(4, 0x3333ff, 1);
                            gfx.beginPath();
                            gfx.moveTo(this.connectingSource.x, this.connectingSource.y);
                            gfx.lineTo(container.x, container.y);
                            gfx.strokePath();
                            // connection graphics should sit below placed gates but above grid
                            gfx.setDepth(10);
                            this.connections.push({ fromId: sourceId, toId: targetId, gfx });
                        } else {
                            this.checkText.setText('Povezava ni mogoča');
                        }
                    }
                    // clear highlight
                    const imgChild = this.connectingSource.list.find(c => c.clearTint);
                    if (imgChild) imgChild.clearTint();
                    this.connectingSource = null;
                    this.time.delayedCall(1200, () => this.checkText.setText(''));
                }
                return;
            }

            // double-click detection for input gates to toggle value
            const now = Date.now();
            const last = container.getData('lastClick') || 0;
            if (now - last < 300) {
                    if (container.getData('type') === 'input') {
                    const gate = container.getData('logicGate');
                    const current = container.getData('inputValue') === undefined ? true : container.getData('inputValue');
                    const newVal = !current;
                    if (gate && gate.setValue) gate.setValue(newVal);
                    container.setData('inputValue', newVal);
                    label.setText(`${labelText}\n${newVal ? '1' : '0'}`);
                    this.checkText.setText(`Input ${container.getData('gateId')} = ${newVal ? '1' : '0'}`);
                    this.time.delayedCall(1200, () => this.checkText.setText(''));
                }
                container.setData('lastClick', 0);
                return;
            }
            container.setData('lastClick', now);

            // rotation disabled - only double-click for input toggle
        });
    }

    evaluateCircuit() {
        // compute only end gates (those without outputs) and show their outputs
        const resultsFull = this.logicCircuit.evaluate();
        const endResults = {};
        // logicCircuit.gates is a Map
        if (this.logicCircuit && this.logicCircuit.gates) {
            for (const [id, gate] of this.logicCircuit.gates) {
                if (!gate.outputGates || gate.outputGates.length === 0) {
                    endResults[id] = gate.getOutput();
                }
            }
        }

        const toShow = Object.keys(endResults).length > 0 ? endResults : resultsFull;
        this.checkText.setText('Evaluated: ' + JSON.stringify(toShow));
        this.time.delayedCall(4000, () => this.checkText.setText(''));
    }

    resetWorkspace() {
        // destroy placed components
        this.placedComponents.forEach(c => c.destroy());
        this.placedComponents = [];
        // destroy connection graphics
        if (this.connections && this.connections.length > 0) {
            this.connections.forEach(conn => {
                try { if (conn.gfx) conn.gfx.destroy(); } catch (e) { /* ignore */ }
            });
        }
        this.connections = [];
        // reset logic circuit
        this.logicCircuit = new LogicCircuit();
        this.checkText.setText('Workspace reset');
        this.time.delayedCall(1500, () => this.checkText.setText(''));
    }

    updateConnectionsForGate(gateId) {
        // update graphics positions for any connections referencing this gate
        this.connections.forEach(conn => {
            if (conn.fromId === gateId || conn.toId === gateId) {
                const fromContainer = this.placedComponents.find(c => c.getData('gateId') === conn.fromId);
                const toContainer = this.placedComponents.find(c => c.getData('gateId') === conn.toId);
                if (fromContainer && toContainer && conn.gfx) {
                    conn.gfx.clear();
                    conn.gfx.lineStyle(4, 0x3333ff, 1);
                    conn.gfx.beginPath();
                    conn.gfx.moveTo(fromContainer.x, fromContainer.y);
                    conn.gfx.lineTo(toContainer.x, toContainer.y);
                    conn.gfx.strokePath();
                }
            }
        });
    }

}