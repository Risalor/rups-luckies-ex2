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
        this.load.image('AND', 'src/components/logic_gates/AND.png');
        this.load.image('BULB', 'src/components/logic_gates/BULB.png');
        this.load.image('NAND', 'src/components/logic_gates/NAND.png');
        this.load.image('NOR', 'src/components/logic_gates/NOR.png');
        this.load.image('OR', 'src/components/logic_gates/OR.png');
        this.load.image('SWITCH_OFF', 'src/components/logic_gates/SWITCH_OFF.png');
        this.load.image('SWITCH_ON', 'src/components/logic_gates/SWITCH_ON.png');
        this.load.image('XNOR', 'src/components/logic_gates/XNOR.png');
        this.load.image('XOR', 'src/components/logic_gates/XOR.png');
        this.load.image('NOT', 'src/components/logic_gates/NOT.png');
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

    // info window removed — hover tooltips intentionally disabled

        // sidebar (styled like workspaceScene)
        const panelWidth = 200;
        this.add.rectangle(0, 0, panelWidth, height, 0xc0c0c0).setOrigin(0);
        this.add.rectangle(0, 0, panelWidth, height, 0x000000, 0.2).setOrigin(0);
        // larger title positioned to avoid overlap with Nazaj
        this.add.text(panelWidth / 2, 60, 'Logični elementi', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        // gate list
        const types = [
            { key: 'input', label: 'INPUT' },
            { key: 'and', label: 'AND' },
            { key: 'or', label: 'OR' },
            { key: 'not', label: 'NOT' },
            { key: 'nand', label: 'NAND' },
            { key: 'nor', label: 'NOR' },
            { key: 'xor', label: 'XOR' },
            { key: 'xnor', label: 'XNOR' },
            { key: 'bulb', label: 'OUTPUT' }
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
        // override setText to allow suppressing only clears (empty-string sets)
        this._origCheckTextSet = this.checkText.setText.bind(this.checkText);
        this._suppressCheckTextClear = false;
        this._suppressCheckTextClearUntil = 0;
        this._checkTextTimer = null;
        // helper to show a status line with color and auto-clear that respects suppression window
        this.showStatus = (text, color = '#000000', holdMs = 2000) => {
            try { if (this._checkTextTimer && this._checkTextTimer.remove) this._checkTextTimer.remove(false); } catch (e) {}
            try { this.checkText.setStyle({ color }); } catch (e) {}
            try { this._origCheckTextSet(text); } catch (e) {}
            // compute delay: if suppression-until exists and is in future, ensure we hold until then
            let delay = holdMs;
            try {
                if (this._suppressCheckTextClearUntil && this._suppressCheckTextClearUntil > Date.now()) {
                    const remaining = this._suppressCheckTextClearUntil - Date.now();
                    delay = Math.max(delay, remaining + 50);
                }
            } catch (e) {}
            try {
                this._checkTextTimer = this.time.delayedCall(delay, () => {
                    try { this._origCheckTextSet(''); } catch (e) {}
                    try { this.checkText.setStyle({ color: '#000000' }); } catch (e) {}
                    this._checkTextTimer = null;
                });
            } catch (e) {}
        };
        this.checkText.setText = (txt) => {
            try {
                if (txt === '' && this._suppressCheckTextClear) {
                    // ignore clears while suppression active
                    return this.checkText;
                }
            } catch (e) { /* ignore */ }
            return this._origCheckTextSet(txt), this.checkText;
        };

    // track used numeric indices for Inputs and Bulbs so we can reuse freed numbers
    this.inputIndices = new Set();
    this.bulbIndices = new Set();

        // Tasks for logic gates workspace (simple progression)
        this.tasks = [
            { id: 'and_task', prompt: 'Naloga 1: Poveži AND z Bulb (preveri osnovna AND vrata).', gateType: 'AND', points: 10, completed: false },
            { id: 'or_task', prompt: 'Naloga 2: Poveži OR z Bulb (preveri osnovna OR vrata).', gateType: 'OR', points: 10, completed: false },
            { id: 'not_task', prompt: 'Naloga 3: Poveži NOT z Bulb (preveri negacijo).', gateType: 'NOT', points: 10, completed: false },
            { id: 'nand_task', prompt: 'Naloga 4: Poveži NAND z Bulb.', gateType: 'NAND', points: 10, completed: false },
            { id: 'nor_task', prompt: 'Naloga 5: Poveži NOR z Bulb.', gateType: 'NOR', points: 10, completed: false },
            { id: 'xor_task', prompt: 'Naloga 6: Poveži XOR z Bulb.', gateType: 'XOR', points: 10, completed: false },
            { id: 'xnor_task', prompt: 'Naloga 7: Poveži XNOR z Bulb.', gateType: 'XNOR', points: 10, completed: false },
            // mixed tasks: specify arrays [childA, childB, top] meaning: Bulb <- top gate whose inputs include childA and childB
            { id: 'mix_1', prompt: 'Naloga 8: Naredi vezje: Bulb poveži na XOR; XOR naj ima vhoda AND in OR.', gateType: ['AND','OR','XOR'], points: 20, completed: false },
            { id: 'mix_2', prompt: 'Naloga 9: Naredi vezje: Bulb poveži na OR; OR naj ima vhoda NAND in NOR.', gateType: ['NAND','NOR','OR'], points: 20, completed: false },
            { id: 'mix_3', prompt: 'Naloga 10: Naredi vezje: Bulb poveži na XNOR; XNOR naj ima vhoda AND in XOR.', gateType: ['AND','XOR','XNOR'], points: 20, completed: false }
        ];
        const savedTaskIndex = localStorage.getItem('logicTasksIndex');
        this.currentTaskIndex = savedTaskIndex !== null ? parseInt(savedTaskIndex) : 0;

    // Task UI tab (persistent until task completed)
    const taskBoxWidth = Math.min(420, width - panelWidth - 80);
    const taskBoxHeight = 80;
    const taskBoxX = panelWidth + 20;
    const taskBoxY = 20;
    this.taskBox = this.add.rectangle(taskBoxX, taskBoxY, taskBoxWidth, taskBoxHeight, 0x222222, 0.95).setOrigin(0, 0).setDepth(1000);
    this.taskBox.setStrokeStyle(2, 0xffffff);
    this.taskText = this.add.text(taskBoxX + 10, taskBoxY + 10, this.tasks[this.currentTaskIndex].prompt, { fontSize: '14px', color: '#ffffff', wordWrap: { width: taskBoxWidth - 20 } }).setDepth(1001).setOrigin(0,0);

        const buttonWidth = 180;
        const buttonHeight = 45;
        const cornerRadius = 10;

        const makeButton = (x, y, label, onClick, opts = {}) => {
            const bg = this.add.graphics();
            const defaultColor = 0x3399ff;
            const hoverColor = 0x0f5cad;
            const activeColor = opts.activeColor || null;

            // helper: draw the rounded rect background
            const drawBg = (color) => {
                bg.clear();
                bg.fillStyle(color, 1);
                bg.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
            };

            drawBg(defaultColor);

            const button = { bg, active: false, activeColor };

            // helper to produce a slightly darker/lighter shade of a hex color (number)
            const shadeColor = (hex, factor) => {
                if (hex == null) return null;
                const h = typeof hex === 'number' ? hex : parseInt(hex);
                const r = Math.min(255, Math.max(0, Math.round(((h >> 16) & 0xff) * factor)));
                const g = Math.min(255, Math.max(0, Math.round(((h >> 8) & 0xff) * factor)));
                const b = Math.min(255, Math.max(0, Math.round((h & 0xff) * factor)));
                return (r << 16) | (g << 8) | b;
            };

            // compute a hover shade for activeColor (slightly darker)
            const activeHoverColor = activeColor ? shadeColor(activeColor, 0.85) : null;

            // Create an invisible interactive zone that covers the entire button
            const hitZone = this.add.zone(x, y, buttonWidth, buttonHeight)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    // always show a hover effect; if active, use the activeHoverColor when available
                    const hover = (button.active && button.activeColor) ? (activeHoverColor || hoverColor) : hoverColor;
                    drawBg(hover);
                })
                .on('pointerout', () => {
                    // when leaving, restore active color if active, otherwise the default
                    drawBg(button.active && button.activeColor ? button.activeColor : defaultColor);
                })
                .on('pointerdown', () => {
                    if (typeof onClick === 'function') {
                        onClick();
                    }
                });

            const text = this.add.text(x, y, label, { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

            button.text = text;
            button.hitZone = hitZone;
            button.setActive = (isActive) => {
                button.active = !!isActive;
                drawBg(button.active && button.activeColor ? button.activeColor : defaultColor);
            };

            return button;
        };

        makeButton(width - 140, 75, 'Lestvica', () => this.scene.start('ScoreboardScene'));
        makeButton(width - 140, 125, 'Preveri', () => {
            // temporarily suppress clears to keep completion text visible
            this._suppressCheckTextClear = true;
            this._suppressCheckTextClearUntil = Date.now() + 3000;
            // release suppression after a short grace period
            this.time.delayedCall(3000, () => { this._suppressCheckTextClear = false; this._suppressCheckTextClearUntil = 0; });
            this.evaluateCircuit();
        });
        makeButton(width - 140, 175, 'Reset', () => this.resetWorkspace());

        const backButton = this.add.text(Math.round(panelWidth / 2), 20, '↩ Nazaj', { fontFamily: 'Arial', fontSize: '20px', color: '#387affff', padding: { x: 20, y: 10 } })
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ color: '#0054fdff' }))
            .on('pointerout', () => backButton.setStyle({ color: '#387affff' }))
            .on('pointerdown', () => {
                // reset workspace counters and state when leaving
                try { this.resetWorkspace(); } catch (e) { /* ignore */ }
                this.cameras.main.fade(300, 0, 0, 0);
                this.time.delayedCall(300, () => { this.scene.start('LabScene'); });
            });

        // placement state
        this.placedComponents = [];
        this.connections = []; // { fromId, toId, gfx }
        this.connectingPin = null; // { pinObject, container, isOutput }
        this.previewLine = null; // Graphics for preview line while connecting
        this.gridSize = 40;
        // store grid start to align exactly with the sidebar width so grid touches it
        this.gridStartX = panelWidth;

        // Add update handler for continuous connection updates during drag
        this.events.on('update', () => this.updatePreviewLine());
    }

    updatePreviewLine() {
        // Update the preview line from selected pin to cursor
        if (!this.connectingPin) {
            if (this.previewLine) {
                this.previewLine.destroy();
                this.previewLine = null;
            }
            // Also update all connection lines when gates move
            if (this.placedComponents && this.placedComponents.length > 0) {
                this.placedComponents.forEach(c => {
                    if (c.getData('isDragging')) {
                        this.updateConnectionsForGate(c.getData('gateId'));
                    }
                });
            }
            return;
        }

        // Draw preview line from selected pin to cursor
        const { pinObject, container } = this.connectingPin;
        const pointer = this.input.activePointer;
        
        if (!this.previewLine) {
            this.previewLine = this.add.graphics();
            this.previewLine.setDepth(9);
        } else {
            this.previewLine.clear();
        }

        const fromX = container.x + (pinObject ? pinObject.x : 0);
        const fromY = container.y + (pinObject ? pinObject.y : 0);
        const toX = pointer.x;
        const toY = pointer.y;

        this.previewLine.lineStyle(3, 0xffff00, 0.7);
        this.previewLine.beginPath();
        this.previewLine.moveTo(fromX, fromY);
        this.previewLine.lineTo(toX, toY);
        this.previewLine.strokePath();
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

    cancelConnection() {
        // Cancel the current connection attempt and clear highlight
        if (this.connectingPin) {
            const { pinObject, container } = this.connectingPin;
            if (pinObject && pinObject.setStrokeStyle) {
                pinObject.setStrokeStyle(2, 0xffffff);
            }
            this.connectingPin = null;
            this._origCheckTextSet('');
        }
        // Clear preview line
        if (this.previewLine) {
            this.previewLine.destroy();
            this.previewLine = null;
        }
    }

    completeConnection(targetPin, targetContainer, targetIsOutput) {
        // Attempt to complete a connection from this.connectingPin to target pin
        if (!this.connectingPin) return;

        const source = this.connectingPin;
        const sourcePin = source.pinObject;
        const sourceContainer = source.container;
        const sourceIsOutput = source.isOutput;

        // Validate connection logic
        const sourceId = sourceContainer.getData('gateId');
        const targetId = targetContainer.getData('gateId');
        const sourceType = sourceContainer.getData('type');
        const targetType = targetContainer.getData('type');

        if (!sourceId || !targetId) {
            this.checkText.setText('Neveljavna vrata za povezavo');
            this.cancelConnection();
            return;
        }

        // Cannot connect output to output or input to input
        if (sourceIsOutput === targetIsOutput) {
            this.checkText.setText('Ne morete povezati ' + (sourceIsOutput ? 'dveh izhodov' : 'dveh vhodov'));
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
            this.cancelConnection();
            return;
        }

        // Determine which is source and which is target
        let finalSourceId, finalTargetId, toPinIndex = 0;
        if (sourceIsOutput) {
            // Source is output, target is input
            finalSourceId = sourceId;
            finalTargetId = targetId;
            const targetPins = targetContainer.getData('inputPins') || [];
            toPinIndex = targetPins.indexOf(targetPin);
        } else {
            // Source is input (shouldn't be the case but handle it)
            finalSourceId = targetId;
            finalTargetId = sourceId;
            const targetPins = sourceContainer.getData('inputPins') || [];
            toPinIndex = targetPins.indexOf(sourcePin);
        }

        // Prevent connecting input gates to each other
        if (sourceType === 'input' && targetType === 'input') {
            this.checkText.setText('Ne morete povezati dveh Input vrat');
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
            this.cancelConnection();
            return;
        }

        // Check if input is already occupied
        const targetGateObj = this.logicCircuit.getGate(finalTargetId);
        if (targetGateObj && targetGateObj.inputGates[toPinIndex]) {
            this.checkText.setText('Ta vhod je že zaseden');
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
            this.cancelConnection();
            return;
        }

        // Attempt connection
        let ok = false;
        try {
            ok = this.logicCircuit.connectGatesWithIndex(finalSourceId, finalTargetId, toPinIndex);
        } catch (err) {
            console.error('connectWithIndex error', err);
            ok = false;
        }

        if (ok) {
            this.checkText.setText('Povezano');
            
            // Draw connection line
            const fromPin = sourceIsOutput ? sourcePin : targetPin;
            const toPin = sourceIsOutput ? targetPin : sourcePin;
            const fromContainer = sourceIsOutput ? sourceContainer : targetContainer;
            const toContainer = sourceIsOutput ? targetContainer : sourceContainer;

            const fromX = fromContainer.x + (fromPin ? fromPin.x : 36);
            const fromY = fromContainer.y + (fromPin ? fromPin.y : 0);
            const toX = toContainer.x + (toPin ? toPin.x : -36);
            const toY = toContainer.y + (toPin ? toPin.y : 0);

            const gfx = this.add.graphics();
            gfx.lineStyle(4, 0x424b55, 1);
            gfx.beginPath();
            gfx.moveTo(fromX, fromY);
            gfx.lineTo(toX, toY);
            gfx.strokePath();
            gfx.setDepth(10);

            // Add hit zone for removal
            const dx = toX - fromX;
            const dy = toY - fromY;
            const dist = Math.hypot(dx, dy);
            const midX = fromX + dx / 2;
            const midY = fromY + dy / 2;
            const hit = this.add.zone(midX, midY, Math.max(30, dist), 16).setOrigin(0.5).setInteractive();
            hit.on('pointerdown', () => {
                try {
                    const srcGate = this.logicCircuit.getGate(finalSourceId);
                    const dstGate = this.logicCircuit.getGate(finalTargetId);
                    if (srcGate && dstGate) srcGate.disconnectFrom(dstGate);
                } catch (e) { /* ignore */ }
                try { gfx.destroy(); } catch (e) {}
                try { hit.destroy(); } catch (e) {}
                this.connections = this.connections.filter(c => !(c.fromId === finalSourceId && c.toId === finalTargetId && c.toPinIndex === toPinIndex));
            });

            this.connections.push({ fromId: finalSourceId, toId: finalTargetId, fromPinIndex: 0, toPinIndex, gfx, hitZone: hit });
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
        } else {
            this.checkText.setText('Povezava ni mogoča');
            this.time.delayedCall(1200, () => this._origCheckTextSet(''));
        }

        this.cancelConnection();
    }

    setupInputOutputPins(container, type, labelText, img) {
        // INPUT/OUTPUT PINS setup
        const pinRadius = 6;
        const inputPinColor = 0xff6600;   // Orange for input pins
        const outputPinColor = 0x00ff00;  // Green for output pins
        const highlightColor = 0xffff00;  // Yellow for highlighted pins
        
        let maxInputs = 2;
        if (type === 'not' || type === 'bulb') maxInputs = 1;
        if (type === 'input') maxInputs = 0;

        let inputPins = container.getData('inputPins') || [];
        if (!inputPins || inputPins.length === 0) {
            inputPins = [];

            for (let i = 0; i < maxInputs; i++) {
                const yOff = (maxInputs === 1) ? 0 : (i === 0 ? -10 : 10);
                const inPin = this.add.circle(-36, yOff, pinRadius, inputPinColor).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
                inPin.setInteractive({ useHandCursor: true });

                inPin.on('pointerdown', (pointer, localX, localY, event) => {
                    if (event && event.stopPropagation) event.stopPropagation();
                    
                    // If no pin is selected, select this one
                    if (!this.connectingPin) {
                        this.connectingPin = { pinObject: inPin, container, isOutput: false };
                        inPin.setStrokeStyle(3, highlightColor);
                        this.checkText.setText('Izberi izhod za povezavo');
                        return;
                    }

                    // If this pin is already selected, deselect it
                    if (this.connectingPin.pinObject === inPin) {
                        this.cancelConnection();
                        return;
                    }

                    // Try to complete connection to this input pin
                    this.completeConnection(inPin, container, false);
                });
                container.add(inPin);
                inputPins.push(inPin);
            }
        }

        // output pin (for all gates except bulb — bulbs are terminals with only inputs)
        let outputPin = container.getData('outputPin') || null;
        if (type !== 'bulb' && !outputPin) {
            outputPin = this.add.circle(36, 0, pinRadius, outputPinColor).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
            outputPin.setInteractive({ useHandCursor: true });
            outputPin.on('pointerdown', (pointer, localX, localY, event) => {
                if (event && event.stopPropagation) event.stopPropagation();
                
                // If no pin is selected, select this one
                if (!this.connectingPin) {
                    this.connectingPin = { pinObject: outputPin, container, isOutput: true };
                    outputPin.setStrokeStyle(3, highlightColor);
                    this.checkText.setText('Izberi vhod za povezavo');
                    return;
                }

                // If this pin is already selected, deselect it
                if (this.connectingPin.pinObject === outputPin) {
                    this.cancelConnection();
                    return;
                }

                // Try to complete connection from this output pin
                this.completeConnection(outputPin, container, true);
            });
            container.add(outputPin);
        }

        container.setData('inputPins', inputPins);
        container.setData('outputPin', outputPin);
    }

    createComponent(x, y, type, labelText) {
        const container = this.add.container(x, y);
        // panel items default depth so connections draw above the grid but below placed gates
        container.setDepth(5);

        var size = 80;
        var textureName = '';
        switch (type) {
            case 'bulb': textureName = 'BULB'; break;
            case 'and': textureName = 'AND'; break;
            case 'or': textureName = 'OR'; break;
            case 'not': textureName = 'NOT'; break;
            case 'nand': textureName = 'NAND'; break;
            case 'nor': textureName = 'NOR'; break;
            case 'xor': textureName = 'XOR'; break;
            case 'xnor': textureName = 'XNOR'; break;
            case 'input': textureName = 'SWITCH_ON'; break;
        }

        const img = this.add.image(0, 0, textureName).setDisplaySize(size, size).setOrigin(0.5);
        container.add(img);
        // keep a reference to the image for easy updates (tint/texture)
        container.setData('img', img);

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

        // hover handlers removed — no tooltip or hover box
        container.on('pointerover', () => {});
        container.on('pointerout', () => {});

        container.on('dragstart', () => { container.setData('isDragging', true); });

        container.on('drag', (pointer, dragX, dragY) => { 
            container.x = dragX; 
            container.y = dragY;
            // Update connection lines in real-time while dragging
            this.updateConnectionsForGate(container.getData('gateId'));
        });

        container.on('dragend', () => {
            const isInPanel = container.x < (this.gridStartX || 200);
            if (isInPanel && !container.getData('isInPanel')) {
                // moved back into the sidebar: remove the placed gate and any connections
                const gateId = container.getData('gateId');

                // if this was the currently selected connecting source, clear it
                if (this.connectingSource === container) this.connectingSource = null;

                // remove any connection graphics that reference this gate
                try {
                    this.connections = this.connections.filter(conn => {
                        if (conn.fromId === gateId || conn.toId === gateId) {
                            try { if (conn.gfx) conn.gfx.destroy(); } catch (e) { /* ignore */ }
                            try { if (conn.hitZone) conn.hitZone.destroy(); } catch (e) { /* ignore */ }
                            return false; // remove this connection from the array
                        }
                        return true;
                    });
                } catch (e) { /* ignore */ }

                // remove the gate from the logic circuit (disconnects underlying links)
                try { if (this.logicCircuit && typeof this.logicCircuit.removeGate === 'function') this.logicCircuit.removeGate(gateId); } catch (e) { /* ignore */ }

                // remove from placedComponents list
                try { this.placedComponents = this.placedComponents.filter(c => c !== container); } catch (e) { /* ignore */ }

                // free any used numeric index for inputs/bulbs
                try {
                    const name = container.getData('displayName');
                    const idx = container.getData('displayIndex');
                    const t = container.getData('type');
                    if (t === 'input' && typeof idx === 'number') {
                        try { this.inputIndices.delete(idx); } catch (e) {}
                    }
                    if (t === 'bulb' && typeof idx === 'number') {
                        try { this.bulbIndices.delete(idx); } catch (e) {}
                    }
                } catch (e) { /* ignore */ }

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
                    case 'bulb': gateType = GateTypes.bulb; break;
                    default: gateType = GateTypes.and;
                }

                const gate = this.logicCircuit.addGate(gateType, id);
                container.setData('logicGate', gate);
                container.setData('gateId', id);
                container.setData('img', img);
                container.setData('labelTextObj', label);

                if (type === 'input') {
                    container.setData('inputValue', true);
                    let idx = 1;
                    while (this.inputIndices.has(idx)) idx++;
                    this.inputIndices.add(idx);
                    const inputName = `Input ${idx}`;
                    container.setData('displayName', inputName);
                    container.setData('displayIndex', idx);
                    label.setText(`${inputName} = true`);
                }

                if (type === 'bulb') {
                    container.setData('isBulb', true);
                    let bidx = 1;
                    while (this.bulbIndices.has(bidx)) bidx++;
                    this.bulbIndices.add(bidx);
                    const displayName = `Bulb ${bidx}`;
                    label.setText(displayName);
                    container.setData('displayName', displayName);
                    container.setData('displayIndex', bidx);
                }

                container.setData('isInPanel', false);
                container.setDepth(20);

                // Setup input and output pins
                this.setupInputOutputPins(container, type, labelText, img);

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
                    const inputName = container.getData('displayName') || labelText || `Input`;
                    label.setText(`${inputName} = ${newVal ? 'true' : 'false'}`);
                    this.checkText.setText(`${inputName} = ${newVal ? 'true' : 'false'}`);
                    this.time.delayedCall(1200, () => this._origCheckTextSet(''));

                    img.setTexture(newVal ? 'SWITCH_ON' : 'SWITCH_OFF');
                }
                container.setData('lastClick', 0);
                return;
            }
            container.setData('lastClick', now);
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

        // Build a simple bulb output summary (only bulbs) — use displayed names when possible
        // We'll derive bulb outputs from placedComponents so we can show "Bulb1: true" etc.
        const bulbEntries = [];
        try {
            (this.placedComponents || []).forEach(c => {
                if (c.getData('isBulb')) {
                    const name = c.getData('displayName') || c.getData('gateId') || 'Bulb';
                    const gate = c.getData('logicGate');
                    let val = false;
                    try { val = !!(gate && gate.getOutput()); } catch (e) { val = false; }
                    bulbEntries.push(`${name}: ${val ? 'true' : 'false'}`);
                }
            });
        } catch (e) {
            // ignore
        }

        // Update bulb labels with status (no coloring)
        try {
            this.placedComponents.forEach(c => {
                if (c.getData('isBulb')) {
                    const gate = c.getData('logicGate');
                    const label = c.getData('labelTextObj');
                    const displayName = c.getData('displayName') || 'Bulb';
                    if (gate && label) {
                        const val = !!gate.getOutput();
                        label.setText(`${displayName} = ${val ? 'true' : 'false'}`);
                    }
                }
            });
        } catch (e) {
            // ignore visual update errors
        }

        // Check current task completion (structural check)
        let taskCompleted = false;
        try {
            taskCompleted = this.checkCurrentTaskCompletion();
        } catch (e) { /* ignore */ }

    // Show concise bulb outputs and task status
    const statusText = bulbEntries.length > 0 ? `Bulb outputs: ${bulbEntries.join(', ')}` : 'No bulbs present';

        if (taskCompleted && this.tasks && this.tasks[this.currentTaskIndex] && !this.tasks[this.currentTaskIndex].completed) {
            // award points and mark completed, then advance after a short delay
            this.tasks[this.currentTaskIndex].completed = true;
            this.addPoints(this.tasks[this.currentTaskIndex].points);
            this.showStatus(`${statusText} — Naloga opravljena! (+${this.tasks[this.currentTaskIndex].points})`, '#00aa00', 2000);
            this.time.delayedCall(1500, () => this.nextTask());
        } else {
            const taskMsg = (this.tasks && this.tasks[this.currentTaskIndex] && this.tasks[this.currentTaskIndex].completed) ? 'Naloga opravljena!' : 'Naloga ni opravljena';
            const color = (taskMsg === 'Naloga opravljena!') ? '#00aa00' : '#cc0000';
            this.showStatus(`${statusText} — ${taskMsg}`, color, 2000);
            // reset color to black and clear text after a short delay (respect suppression)
            try { this.time.delayedCall(2000, () => { try { this._origCheckTextSet(''); this.checkText.setStyle({ color: '#000000' }); } catch (e) {} }); } catch (e) {}
        }
    }

    checkCurrentTaskCompletion() {
        // return boolean: true if current task completed, false otherwise
        if (!this.tasks || this.currentTaskIndex == null) return false;
        const task = this.tasks[this.currentTaskIndex];
        if (!task) return false;

        // ensure gate outputs are up-to-date before checking
        try { if (this.logicCircuit && typeof this.logicCircuit.evaluate === 'function') this.logicCircuit.evaluate(); } catch (e) { /* ignore */ }

        // we look for a bulb (LIGHT) whose evaluated output is true and whose input structure matches the task requirement
        for (const [id, gate] of this.logicCircuit.gates) {
            if (gate.operation !== 'LIGHT') continue;
            // require the bulb to evaluate to true for a task to be considered complete
            let bulbVal = false;
            try { bulbVal = !!(gate && gate.getOutput && gate.getOutput()); } catch (e) { bulbVal = false; }
            if (!bulbVal) continue;

            const src = gate.inputGates[0];
            if (!src) continue;

            // support task.gateType as string (single gate) or array (composed requirement)
            if (typeof task.gateType === 'string') {
                if (src.operation === task.gateType) {
                    const numInputs = src.inputGates ? src.inputGates.filter(Boolean).length : 0;
                    // for NOT/BUFFER we don't require >=1 (they naturally have 1), for other gates ensure at least one input exists
                    const okStructure = (task.gateType === 'NOT' || task.gateType === 'BUFFER') ? true : (numInputs >= 1);
                    if (okStructure) {
                        task.completed = true;
                        this.showStatus('Naloga opravljena!', '#00aa00', 2000);
                        try { this.addPoints(task.points); } catch (e) {}
                        this.time.delayedCall(1500, () => this.nextTask());
                        return true;
                    }
                }
            } else if (Array.isArray(task.gateType)) {
                const req = task.gateType;
                if (req.length === 2) {
                    const child = req[0]; const top = req[1];
                    if (src.operation === top) {
                        const inputs = src.inputGates ? src.inputGates.filter(Boolean) : [];
                        const hasChild = inputs.some(g => g && g.operation === child);
                        if (hasChild) {
                            task.completed = true;
                            this.showStatus('Naloga opravljena!', '#00aa00', 2000);
                            try { this.addPoints(task.points); } catch (e) {}
                            this.time.delayedCall(1500, () => this.nextTask());
                            return true;
                        }
                    }
                } else if (req.length >= 3) {
                    const childA = req[0]; const childB = req[1]; const top = req[2];
                    if (src.operation === top) {
                        const inputs = src.inputGates ? src.inputGates.filter(Boolean) : [];
                        const hasA = inputs.some(g => g && g.operation === childA);
                        const hasB = inputs.some(g => g && g.operation === childB);
                        if (hasA && hasB) {
                            task.completed = true;
                            this.showStatus('Naloga opravljena!', '#00aa00', 2000);
                            try { this.addPoints(task.points); } catch (e) {}
                            this.time.delayedCall(1500, () => this.nextTask());
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    nextTask() {
        this.currentTaskIndex++;
        localStorage.setItem('logicTasksIndex', this.currentTaskIndex.toString());
        if (this.currentTaskIndex < this.tasks.length) {
            this.taskText.setText(this.tasks[this.currentTaskIndex].prompt);
        } else {
            this.taskText.setText('Vse naloge opravljene! Bravo!');
            // award a small completion bonus and show a congratulatory message
            this.showStatus('Čestitke! Vse naloge opravljene!', '#00aa00', 3000);
            try { this.addPoints(20); } catch (e) {}
            // clear saved index
            localStorage.removeItem('logicTasksIndex');
        }
    }

    addPoints(points) {
        const user = localStorage.getItem('username');
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userData = users.find(u => u.username === user);
        if (userData) {
            userData.score = (userData.score || 0) + points;
        }
        localStorage.setItem('users', JSON.stringify(users));
    }

    resetWorkspace() {
        // destroy placed components
        this.placedComponents.forEach(c => c.destroy());
        this.placedComponents = [];
        // destroy connection graphics
        if (this.connections && this.connections.length > 0) {
            this.connections.forEach(conn => {
                try { if (conn.gfx) conn.gfx.destroy(); } catch (e) { /* ignore */ }
                try { if (conn.hitZone) conn.hitZone.destroy(); } catch (e) { /* ignore */ }
            });
        }
        this.connections = [];
        // reset logic circuit
        this.logicCircuit = new LogicCircuit();
        // reset placement index trackers
        try { this.inputIndices = new Set(); } catch (e) {}
        try { this.bulbIndices = new Set(); } catch (e) {}
        this._origCheckTextSet('Workspace reset');
        this.time.delayedCall(1500, () => this._origCheckTextSet(''));
    }

    updateConnectionsForGate(gateId) {
        // update graphics positions for any connections referencing this gate
        this.connections.forEach(conn => {
            if (conn.fromId === gateId || conn.toId === gateId) {
                const fromContainer = this.placedComponents.find(c => c.getData('gateId') === conn.fromId);
                const toContainer = this.placedComponents.find(c => c.getData('gateId') === conn.toId);
                if (fromContainer && toContainer && conn.gfx) {
                    // compute endpoints using pin positions if available
                    const fromPin = fromContainer.getData('outputPin');
                    const toPins = toContainer.getData('inputPins') || [];
                    const fromX = fromContainer.x + (fromPin ? fromPin.x : 36);
                    const fromY = fromContainer.y + (fromPin ? fromPin.y : 0);
                    const toPinObj = toPins[conn.toPinIndex];
                    const toX = toContainer.x + (toPinObj ? toPinObj.x : 0);
                    const toY = toContainer.y + (toPinObj ? toPinObj.y : 0);

                    conn.gfx.clear();
                    conn.gfx.lineStyle(4, 0x424b55, 1);
                    conn.gfx.beginPath();
                    conn.gfx.moveTo(fromX, fromY);
                    conn.gfx.lineTo(toX, toY);
                    conn.gfx.strokePath();

                    // update hitZone position/size if present
                    if (conn.hitZone) {
                        const dx = toX - fromX; const dy = toY - fromY; const dist = Math.hypot(dx, dy);
                        const midX = fromX + dx / 2; const midY = fromY + dy / 2;
                        conn.hitZone.setPosition(midX, midY);
                        conn.hitZone.setSize(Math.max(30, dist), 16);
                    }
                }
            }
        });
    }

}