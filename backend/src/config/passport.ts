import passport from 'passport';
import { Strategy as TwitchStrategy } from 'passport-twitch-new';
import dotenv from 'dotenv';

dotenv.config();

// User interface for TypeScript
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  accessToken: string;
  refreshToken: string;
}

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

passport.use(
  new TwitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
      callbackURL: process.env.TWITCH_CALLBACK_URL || 'http://localhost:3001/api/auth/twitch/callback',
      scope: 'user:read:email user:read:chat bits:read channel:read:subscriptions',
    },
    (accessToken: string, refreshToken: string, profile: any, done: any) => {
      const user: TwitchUser = {
        id: profile.id,
        login: profile.login,
        display_name: profile.display_name,
        profile_image_url: profile.profile_image_url,
        accessToken,
        refreshToken,
      };
      
      return done(null, user);
    }
  )
);
