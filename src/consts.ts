import path from 'path';

export const authCallbackPath = '/oauthCallback';
export const callbackPagePath = '/oauthHtml';
export const oauthCallbackPort = 60002;

// consts.ts (this file) is compiled to [project]/out.
export const srcPath = path.resolve(__dirname, '..', 'src');
export const envPath = path.resolve(__dirname, '..', '.env');

export const githubUrl = 'https://github.com';