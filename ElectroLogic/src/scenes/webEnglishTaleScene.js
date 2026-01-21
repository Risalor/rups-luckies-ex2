import Phaser from 'phaser';

export default class WebEnglishTaleScene extends Phaser.Scene {
    constructor() {
        super('WebEnglishTaleScene');
        this.iframeContainer = null;
        this.backButton = null;
    }

    create() {
        const { width, height } = this.scale;

        this.children.removeAll(true);

        // Background
        this.cameras.main.setBackgroundColor('#ffffff');

        // Calculate scale to fit the game properly
        const originalWidth = 1920;
        const originalHeight = 1080;
        const scaleX = (width - 100) / originalWidth;
        const scaleY = (height - 150) / originalHeight;
        const scale = Math.min(scaleX, scaleY);

        // Create a DOM element container for the iframe
        this.iframeContainer = document.createElement('div');
        this.iframeContainer.id = 'iframe-container';
        this.iframeContainer.style.position = 'absolute';
        this.iframeContainer.style.top = '50%';
        this.iframeContainer.style.left = '50%';
        this.iframeContainer.style.width = originalWidth + 'px';
        this.iframeContainer.style.height = originalHeight + 'px';
        this.iframeContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        this.iframeContainer.style.transformOrigin = 'center center';
        this.iframeContainer.style.border = 'none';
        this.iframeContainer.style.borderRadius = '10px';
        this.iframeContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        this.iframeContainer.style.overflow = 'hidden';
        this.iframeContainer.style.zIndex = '999';
        this.iframeContainer.style.pointerEvents = 'auto';

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = '/WebEnglishTale/index.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '10px';
        iframe.style.display = 'block';
        iframe.style.pointerEvents = 'auto';

        this.iframeContainer.appendChild(iframe);
        document.body.appendChild(this.iframeContainer);

        // Back button - positioned at bottom left above everything
        const cornerRadius = 15;
        const buttonWidth = 150;
        const buttonHeight = 50;
        const buttonX = 40;
        const buttonY = height - 80;

        // Button background
        const backButtonBackground = this.add.graphics();
        backButtonBackground.fillStyle(0xff6b6b, 1);
        backButtonBackground.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, cornerRadius);
        backButtonBackground.setDepth(1000);

        // Button text
        this.backButton = this.add.text(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, '← Nazaj', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(1001)
            .on('pointerover', () => {
                backButtonBackground.clear();
                backButtonBackground.fillStyle(0xff4757, 1);
                backButtonBackground.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, cornerRadius);
                this.backButton.setStyle({ color: '#ffffff' });
            })
            .on('pointerout', () => {
                backButtonBackground.clear();
                backButtonBackground.fillStyle(0xff6b6b, 1);
                backButtonBackground.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, cornerRadius);
                this.backButton.setStyle({ color: '#ffffff' });
            })
            .on('pointerdown', () => {
                this.cleanup();
                this.scene.start('MenuScene');
            });
    }

    cleanup() {
        // Remove iframe container from DOM
        if (this.iframeContainer && this.iframeContainer.parentNode) {
            this.iframeContainer.parentNode.removeChild(this.iframeContainer);
            this.iframeContainer = null;
        }
    }

    shutdown() {
        this.cleanup();
    }

    stop() {
        this.cleanup();
    }
}
