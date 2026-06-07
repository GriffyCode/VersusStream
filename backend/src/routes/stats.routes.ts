import express from 'express';
import { prismaService } from '../services/prisma.service';

const router = express.Router();

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Find user (case insensitive)
    const user = await prismaService.client.user.findFirst({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      include: { settings: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Streamer not found' });
    }

    // Get matches where the user was streamerA or streamerB
    const matches = await prismaService.client.matchHistory.findMany({
      where: {
        OR: [
          { streamerAId: user.id },
          { streamerBId: user.id }
        ]
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Calculate Winrate and Record
    let wins = 0;
    let maxPoints = 0;

    const allMatches = await prismaService.client.matchHistory.findMany({
      where: {
        OR: [
          { streamerAId: user.id },
          { streamerBId: user.id }
        ]
      }
    });

    allMatches.forEach((match: any) => {
      if (match.vainqueurId === user.id) wins++;
      
      const myScore = match.streamerAId === user.id ? match.scoreFinalA : match.scoreFinalB;
      if (myScore > maxPoints) {
        maxPoints = myScore;
      }
    });

    const totalMatches = allMatches.length;
    const winrate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    res.json({
      success: true,
      user: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        primaryColor: user.settings?.primaryColor || '#00f0ff',
        secondaryColor: user.settings?.secondaryColor || '#ff007f'
      },
      stats: {
        winrate,
        totalMatches,
        wins,
        maxPoints
      },
      recentMatches: matches
    });

  } catch (error) {
    console.error('[Stats API] Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
