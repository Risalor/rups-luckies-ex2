import Phaser from 'phaser';

const API_URL = 'http://localhost:5000/api';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    create() {
        const { width, height } = this.scale;

        // --- Ozadje laboratorija ---
        this.add.rectangle(0, 0, width, height - 150, 0xe8e8e8).setOrigin(0);
        this.add.rectangle(0, height - 150, width, 150, 0xd4c4a8).setOrigin(0);

        // miza
        const tableX = width / 2;
        const tableY = height / 2 + 50;
        const tableWidth = 500;
        const tableHeight = 250;

        this.add.rectangle(tableX, tableY, tableWidth, 30, 0x8b4513).setOrigin(0.5);
        const surface = this.add.rectangle(tableX, tableY + 15, tableWidth - 30, tableHeight - 30, 0xa0826d).setOrigin(0.5, 0);
        
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x8b7355, 0.3);
        const gridSize = 30;
        const gridStartX = tableX - (tableWidth - 30) / 2;
        const gridStartY = tableY + 15;
        const gridEndX = tableX + (tableWidth - 30) / 2;
        const gridEndY = tableY + 15 + (tableHeight - 30);

        for (let x = gridStartX; x <= gridEndX; x += gridSize) {
            grid.beginPath();
            grid.moveTo(x, gridStartY);
            grid.lineTo(x, gridEndY);
            grid.strokePath();
        }
        for (let y = gridStartY; y <= gridEndY; y += gridSize) {
            grid.beginPath();
            grid.moveTo(gridStartX, y);
            grid.lineTo(gridEndX, y);
            grid.strokePath();
        }

        // nogice mize
        const legWidth = 20;
        const legHeight = 150;
        this.add.rectangle(tableX - tableWidth / 2 + 40, tableY + tableHeight / 2 + 20, legWidth, legHeight, 0x654321);
        this.add.rectangle(tableX + tableWidth / 2 - 40, tableY + tableHeight / 2 + 20, legWidth, legHeight, 0x654321);

        // okvir
        const panelWidth = 500;
        const panelHeight = 340;
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2 - 30;

        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.92);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);
        panel.lineStyle(3, 0xcccccc, 1);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);

        // naslov
        this.add.text(width / 2, panelY + 40, 'PRIJAVA', {
            fontFamily: 'Arial',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#222'
        }).setOrigin(0.5);

        // input polji
        const inputWidth = 350;
        const inputHeight = 45;
        const corner = 10;

        const username = document.createElement('input');
        username.type = 'text';
        username.placeholder = 'Uporabniško ime';
        username.style.position = 'absolute';
        username.style.lineHeight = `${inputHeight}px`;
        username.style.width = `${inputWidth}px`;
        username.style.height = `${inputHeight}px`;
        username.style.left = `${width / 2 - inputWidth / 2}px`;
        username.style.top = `${panelY + 100}px`;
        username.style.borderRadius = '8px';
        username.style.padding = '5px';
        username.style.border = '1px solid #ccc';
        username.style.textAlign = 'center';
        username.style.fontSize = '18px';
        username.style.outline = 'none';
        username.style.backgroundColor = '#f9f9f9';
        document.body.appendChild(username);

        const password = document.createElement('input');
        password.type = 'password';
        password.placeholder = 'Geslo';
        password.style.position = 'absolute';
        password.style.lineHeight = `${inputHeight}px`;
        password.style.width = `${inputWidth}px`;
        password.style.height = `${inputHeight}px`;
        password.style.left = `${width / 2 - inputWidth / 2}px`;
        password.style.top = `${panelY + 160}px`;
        password.style.borderRadius = '8px';
        password.style.padding = '5px';
        password.style.border = '1px solid #ccc';
        password.style.textAlign = 'center';
        password.style.fontSize = '18px';
        password.style.outline = 'none';
        password.style.backgroundColor = '#f9f9f9';
        document.body.appendChild(password);

        // Loading indicator (hidden by default)
        const loadingText = this.add.text(width / 2, panelY + 220, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#666'
        }).setOrigin(0.5).setVisible(false);

        const buttonWidth = 180;  
        const buttonHeight = 45;  
        const cornerRadius = 10;  
        const buttonY = panelY + 270;
        const rectX = width / 2;

        const loginButtonBg = this.add.graphics();
        loginButtonBg.fillStyle(0x3399ff, 1);
        loginButtonBg.fillRoundedRect(
            rectX - buttonWidth / 2,
            buttonY - buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            cornerRadius
        );

        const loginButton = this.add.text(rectX, buttonY, '▶ Prijavi se', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                loginButtonBg.clear();
                loginButtonBg.fillStyle(0x0f5cad, 1);
                loginButtonBg.fillRoundedRect(
                    rectX - buttonWidth / 2,
                    buttonY - buttonHeight / 2,
                    buttonWidth,
                    buttonHeight,
                    cornerRadius
                );
            })
            .on('pointerout', () => {
                loginButtonBg.clear();
                loginButtonBg.fillStyle(0x3399ff, 1);
                loginButtonBg.fillRoundedRect(
                    rectX - buttonWidth / 2,
                    buttonY - buttonHeight / 2,
                    buttonWidth,
                    buttonHeight,
                    cornerRadius
                );
            })
            .on('pointerdown', async () => {
                const usernameTrim = username.value.trim();
                const passwordTrim = password.value.trim();
                const pfps = ['avatar1','avatar2','avatar3','avatar4','avatar5','avatar6','avatar7','avatar8','avatar9','avatar10','avatar11'];
                const randomPfp = pfps[Math.floor(Math.random() * pfps.length)];

                if (!usernameTrim || !passwordTrim) {
                    alert('Vnesi uporabniško ime in geslo!');
                    return;
                }

                // Show loading
                loadingText.setText('Prijavljam...').setVisible(true);
                loginButton.disableInteractive();

                try {
                    // First try to login
                    const loginResponse = await this.makeApiRequest(`${API_URL}/users/login`, {
                        method: 'POST',
                        body: JSON.stringify({
                            username: usernameTrim,
                            password: passwordTrim
                        })
                    });

                    // Login successful
                    localStorage.setItem('username', usernameTrim);
                    localStorage.setItem('userData', JSON.stringify(loginResponse.user));
                    
                    username.remove();
                    password.remove();
                    loadingText.setVisible(false);

                    this.scene.start('LabScene');

                } catch (loginError) {
                    try {
                        console.log('Login failed, trying registration...');
                        
                        const registerResponse = await this.makeApiRequest(`${API_URL}/users/register`, {
                            method: 'POST',
                            body: JSON.stringify({
                                username: usernameTrim,
                                password: passwordTrim,
                                displayImage: randomPfp
                            })
                        });

                        const finalLoginResponse = await this.makeApiRequest(`${API_URL}/users/login`, {
                            method: 'POST',
                            body: JSON.stringify({
                                username: usernameTrim,
                                password: passwordTrim
                            })
                        });

                        localStorage.setItem('username', usernameTrim);
                        localStorage.setItem('userData', JSON.stringify(finalLoginResponse.user));
                        
                        username.remove();
                        password.remove();
                        loadingText.setVisible(false);

                        this.scene.start('LabScene');

                    } catch (registerError) {
                        console.error('Registration failed:', registerError);
                        loadingText.setVisible(false);
                        loginButton.setInteractive();
                    }
                }
            });

        this.makeApiRequest = async (url, options = {}) => {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const response = await fetch(url, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers,
                },
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        };

        // Počisti inpute ob izhodu
        this.events.once('shutdown', () => {
            username.remove();
            password.remove();
        });

        const backButton = this.add.text(40, 30, '↩ Nazaj v meni', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#0066ff',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ color: '#0044cc' }))
            .on('pointerout', () => backButton.setStyle({ color: '#0066ff' }))
            .on('pointerdown', () => {
                username.remove();
                password.remove();
                this.scene.start('MenuScene');
            });

        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                loginButton.emit('pointerdown');
            }
        };
        
        username.addEventListener('keypress', handleEnter);
        password.addEventListener('keypress', handleEnter);
        
        this.events.once('shutdown', () => {
            username.removeEventListener('keypress', handleEnter);
            password.removeEventListener('keypress', handleEnter);
        });
    }
}