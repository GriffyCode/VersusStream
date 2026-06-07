declare module 'passport-twitch-new' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
    customHeaders?: Record<string, string>;
  }

  export interface Profile {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    email?: string;
    provider: string;
  }

  export type VerifyCallback = (err?: Error | null, user?: any, info?: any) => void;

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => void
    );
  }
}
