import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';

import './config/passport';
import authRoutes from './routes/auth';
import statsRoutes from './routes/stats.routes';
import settingsRoutes from './routes/settings.routes';

dotenv.config();

export const createApp = () => {
  const app = express();

  // Middlewares
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());

  // Indispensable pour que les cookies "secure" fonctionnent derrière le proxy de Render
  app.set('trust proxy', 1);

  // Session
  app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Obligatoire avec sameSite: 'none'
      sameSite: 'none', // Indispensable pour le cross-domain (Vercel -> Render)
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/settings', settingsRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'Twitch Versus Backend API is running' });
  });

  return app;
};
