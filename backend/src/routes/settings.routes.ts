import { Router } from 'express';
import { prismaService } from '../services/prisma.service';

const router = Router();

// POST /api/settings
// Requires: userId (twitch ID), primaryColor, secondaryColor
router.post('/', async (req, res) => {
  try {
    const { userId, primaryColor, secondaryColor } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // Verify user exists first
    const user = await prismaService.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedSettings = await prismaService.client.streamerSettings.upsert({
      where: { userId },
      update: {
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
      },
      create: {
        userId,
        primaryColor: primaryColor || '#00f0ff',
        secondaryColor: secondaryColor || '#ff007f',
      },
    });

    return res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('[API] Error saving settings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/settings/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = await prismaService.client.streamerSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Return defaults if none
      return res.json({
        success: true,
        settings: {
          primaryColor: '#00f0ff',
          secondaryColor: '#ff007f'
        }
      });
    }

    return res.json({ success: true, settings });
  } catch (error) {
    console.error('[API] Error fetching settings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
