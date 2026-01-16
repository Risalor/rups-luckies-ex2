const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { username, password, displayImage } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({
      username,
      password,
      displayImage: displayImage || 'default-avatar.png',
      playedGames: []
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User login
router.post('/login', authenticate, async (req, res) => {
  try {
    const userResponse = req.user.toObject();
    delete userResponse.password;
    
    res.json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Login error' });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userResponse = req.user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a game to user
router.post('/:id/games', async (req, res) => {
  try {
    const { gameType, score, date } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newGame = {
      gameType,
      score,
      date: date || new Date()
    };

    user.playedGames.push(newGame);
    await user.save();

    res.json({
      message: 'Game added successfully',
      game: newGame,
      totalGames: user.playedGames.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's games
router.get('/:id/games', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'playedGames username displayImage');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.username,
      displayImage: user.displayImage,
      totalGames: user.playedGames.length,
      games: user.playedGames
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get games
router.get('/:id/games/:gameType', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const filteredGames = user.playedGames.filter(
      game => game.gameType.toLowerCase() === req.params.gameType.toLowerCase()
    );

    res.json({
      gameType: req.params.gameType,
      totalGames: filteredGames.length,
      averageScore: filteredGames.length > 0 
        ? filteredGames.reduce((sum, game) => sum + game.score, 0) / filteredGames.length 
        : 0,
      games: filteredGames
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { displayImage } = req.body;
    
    const updateData = {};
    if (displayImage) updateData.displayImage = displayImage;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;