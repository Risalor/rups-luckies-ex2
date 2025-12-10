import Phaser from 'phaser';

const API_URL = 'http://localhost:5000/api';

export default class ProfileScene extends Phaser.Scene {
  constructor() {
    super('ProfileScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const username = localStorage.getItem('username') || 'Gost';
    
    this.add.rectangle(0, 0, width, height, 0xf5f5f5).setOrigin(0);
    
    const profileHTML = `
      <div id="profile-overlay" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #f5f5f5;
        font-family: Arial, sans-serif;
        overflow: auto;
        z-index: 1000;
      ">
        <!-- Header -->
        <div style="
          text-align: center;
          padding: 20px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin-bottom: 30px;
        ">
          <h1 style="margin: 0; font-size: 36px;">Moj Profil</h1>
        </div>
        
        <!-- Main Content -->
        <div style="
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        ">
          <!-- Profile Card -->
          <div style="
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          ">
            <div style="display: flex; flex-wrap: wrap; gap: 30px;">
              <!-- Left Column - Avatar -->
              <div style="flex: 1; min-width: 250px;">
                <h3 style="color: #666; margin-bottom: 15px;">Trenutni avatar:</h3>
                
                <div id="current-avatar-container" style="
                  width: 120px;
                  height: 120px;
                  border-radius: 50%;
                  overflow: hidden;
                  border: 4px solid #3399ff;
                  margin-bottom: 20px;
                  background: #f0f0f0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <img id="current-avatar" 
                    src="src/avatars/${userData.displayImage || 'avatar1'}.png" 
                    alt="${username}'s avatar"
                    style="
                      width: 100%;
                      height: 100%;
                      object-fit: cover;
                    "
                    onerror="this.onerror=null;this.src='src/avatars/avatar1.png'"
                  >
                </div>
                
                <h3 style="color: #666; margin-bottom: 15px;">Izberi nov avatar:</h3>
                
                <div id="avatar-grid" style="
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 10px;
                  max-width: 250px;
                ">
                  <!-- Avatars will be inserted here -->
                </div>
              </div>
              
              <!-- Right Column - User Info -->
              <div style="flex: 1; min-width: 250px;">
                <div style="margin-bottom: 25px;">
                  <h2 style="color: #333; margin-bottom: 10px;">Uporabnik:</h2>
                  <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    border-left: 4px solid #3399ff;
                  ">
                    <span style="font-size: 24px; font-weight: bold; color: #333;">${username}</span>
                  </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #666; margin-bottom: 10px;">Statistika:</h3>
                  ${userData.createdAt ? `
                    <div style="
                      display: flex;
                      align-items: center;
                      margin-bottom: 10px;
                      padding: 10px;
                      background: #f8f9fa;
                      border-radius: 8px;
                    ">
                      <span style="color: #333;">Član od: ${new Date(userData.createdAt).toLocaleDateString('sl-SI')}</span>
                    </div>
                  ` : ''}
                  
                  ${userData.playedGames ? `
                    <div style="
                      display: flex;
                      align-items: center;
                      margin-bottom: 10px;
                      padding: 10px;
                      background: #f8f9fa;
                      border-radius: 8px;
                    ">
                      <span style="color: #333;">Število opravil: ${userData.playedGames.length}</span>
                    </div>
                    
                    ${(() => {
                      if (userData.playedGames.length > 0) {
                        const totalScore = userData.playedGames.reduce((sum, game) => sum + game.score, 0);
                        const averageScore = totalScore / userData.playedGames.length;
                        return `
                          <div style="
                            display: flex;
                            align-items: center;
                            margin-bottom: 10px;
                            padding: 10px;
                            background: #f8f9fa;
                            border-radius: 8px;
                          ">
                            <span style="color: #333;">Povprečni rezultat: ${averageScore.toFixed(1)}</span>
                          </div>
                        `;
                      }
                      return '';
                    })()}
                  ` : ''}
                </div>
                
                <div style="margin-top: 30px;">
                  <h3 style="color: #666; margin-bottom: 10px;">Zadnje igre:</h3>
                  ${(() => {
                    if (userData.playedGames && userData.playedGames.length > 0) {
                      const recentGames = userData.playedGames.slice(-3).reverse();
                      return recentGames.map(game => `
                        <div style="
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          padding: 10px 15px;
                          background: #f8f9fa;
                          border-radius: 8px;
                          margin-bottom: 8px;
                          border-left: 3px solid #28a745;
                        ">
                          <div>
                            <span style="font-weight: bold; color: #333;">${game.gameType}</span>
                            <div style="font-size: 12px; color: #666;">
                              ${new Date(game.date).toLocaleDateString('sl-SI')}
                            </div>
                          </div>
                          <span style="
                            background: #28a745;
                            color: white;
                            padding: 5px 15px;
                            border-radius: 20px;
                            font-weight: bold;
                          ">${game.score}</span>
                        </div>
                      `).join('');
                    }
                    return `
                      <div style="
                        text-align: center;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 10px;
                        color: #666;
                      ">
                        Še nimate igranih iger
                      </div>
                    `;
                  })()}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 30px;
            flex-wrap: wrap;
          ">
            <button id="back-button" style="
              padding: 15px 40px;
              background: #6c757d;
              color: white;
              border: none;
              border-radius: 10px;
              font-size: 18px;
              cursor: pointer;
              transition: all 0.3s;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
              ↩ Nazaj
            </button>
            
            <button id="save-button" style="
              padding: 15px 40px;
              background: #3399ff;
              color: white;
              border: none;
              border-radius: 10px;
              font-size: 18px;
              cursor: pointer;
              transition: all 0.3s;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
              Shrani spremembe
            </button>
            
            <button id="logout-button" style="
              padding: 15px 40px;
              background: #dc3545;
              color: white;
              border: none;
              border-radius: 10px;
              font-size: 18px;
              cursor: pointer;
              transition: all 0.3s;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
              Odjavi se
            </button>
          </div>
        </div>
        
        <!-- Loading Overlay -->
        <div id="loading-overlay" style="
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.9);
          z-index: 2000;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 60px;
            height: 60px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          "></div>
          <div style="font-size: 18px; color: #333;">Shranjujem...</div>
        </div>
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        
        .avatar-option {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          border: 3px solid transparent;
        }
        
        .avatar-option:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .avatar-option.selected {
          border-color: #3399ff;
          box-shadow: 0 0 0 2px rgba(51, 153, 255, 0.3);
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      </style>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = profileHTML;
    document.body.appendChild(container.firstElementChild);

    this.selectedAvatar = userData.displayImage || 'avatar1';

    this.initializeAvatars(this.selectedAvatar);

    this.setupEventListeners(userData);
    
    this.events.once('shutdown', () => {
      const overlay = document.getElementById('profile-overlay');
      if (overlay) {
        overlay.remove();
      }
    });
  }
  
  initializeAvatars(currentAvatar) {
    const avatars = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 
                    'avatar6', 'avatar7', 'avatar8', 'avatar9', 'avatar10', 'avatar11'];
    
    const avatarGrid = document.getElementById('avatar-grid');
    avatarGrid.innerHTML = '';
    
    avatars.forEach(avatar => {
      const avatarOption = document.createElement('div');
      avatarOption.className = `avatar-option ${avatar === currentAvatar ? 'selected' : ''}`;
      avatarOption.setAttribute('data-avatar', avatar);
      
      avatarOption.innerHTML = `
        <img 
          src="src/avatars/${avatar}.png" 
          alt="${avatar}"
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.onerror=null;this.src='src/avatars/avatar1.png'"
        >
      `;
      
      avatarOption.addEventListener('click', () => {
        if (this.isSaving) return;
        
        document.querySelectorAll('.avatar-option').forEach(el => {
          el.classList.remove('selected');
        });
        
        avatarOption.classList.add('selected');
        this.selectedAvatar = avatar;
        
        const currentAvatarImg = document.getElementById('current-avatar');
        currentAvatarImg.src = `src/avatars/${avatar}.png`;
      });
      
      avatarGrid.appendChild(avatarOption);
    });
  }
  
  setupEventListeners(userData) {
    const saveButton = document.getElementById('save-button');
    const backButton = document.getElementById('back-button');
    const logoutButton = document.getElementById('logout-button');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    this.isSaving = false;
    
    saveButton.addEventListener('click', async () => {
      if (this.isSaving) return;
      
      if (!userData._id) {
        this.showErrorMessage('Napaka: Uporabnik ni prijavljen!');
        return;
      }
      
      this.isSaving = true;
      saveButton.disabled = true;
      backButton.disabled = true;
      logoutButton.disabled = true;
      
      try {
        loadingOverlay.style.display = 'flex';
        
        console.log('Saving avatar:', this.selectedAvatar);
        console.log('User ID:', userData._id);
        
        const response = await fetch(`${API_URL}/users/${userData._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayImage: this.selectedAvatar
          })
        });
        
        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response text:', responseText);
        
        if (!response.ok) {
          let errorMessage = 'Napaka pri shranjevanju';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${responseText}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = JSON.parse(responseText);
        console.log('Update successful:', data);
        
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        this.showSuccessMessage('Profil uspešno posodobljen!');
        
        setTimeout(() => {
          this.cleanupAndReturnToLab();
        }, 1500);
        
      } catch (error) {
        console.error('Error updating profile:', error);
        
        loadingOverlay.style.display = 'none';
        saveButton.disabled = false;
        backButton.disabled = false;
        logoutButton.disabled = false;
        this.isSaving = false;
        
        this.showErrorMessage(`Napaka pri posodabljanju profila: ${error.message}`);
      }
    });
    
    backButton.addEventListener('click', () => {
      if (!this.isSaving) {
        this.cleanupAndReturnToLab();
      }
    });
    
    logoutButton.addEventListener('click', () => {
      if (this.isSaving) return;
      
      if (confirm('Ali ste prepričani, da se želite odjaviti?')) {
        localStorage.removeItem('username');
        localStorage.removeItem('userData');
        localStorage.removeItem('profilePic');
        
        this.cleanupAndReturnToMenu();
      }
    });
    
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && !this.isSaving) {
        this.cleanupAndReturnToLab();
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    this.escapeHandler = escapeHandler;
  }
  
  cleanupAndReturnToLab() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    
    const overlay = document.getElementById('profile-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    this.scene.start('LabScene');
  }
  
  cleanupAndReturnToMenu() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    
    const overlay = document.getElementById('profile-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    this.scene.start('MenuScene');
  }
  
  showSuccessMessage(message) {
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
  }
  
  showErrorMessage(message) {
    const existingMessage = document.querySelector('.error-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span style="font-size: 20px;">✗</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }
}