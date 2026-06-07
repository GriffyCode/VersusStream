import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Route to start Twitch OAuth flow
router.get('/twitch', passport.authenticate('twitch'));

// Twitch OAuth callback route
router.get(
  '/twitch/callback',
  passport.authenticate('twitch', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:3000' }),
  (req, res) => {
    // Successful authentication, redirect to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// Route to get the current authenticated user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.status(401).json({ authenticated: false, message: 'Not authenticated' });
  }
});

// Route to logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

export default router;
