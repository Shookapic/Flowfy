import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'duckdns.flowfy.app',
  appName: 'flowfy',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    hostname: 'flowfy.duckdns.org',
    allowNavigation: ['flowfy.duckdns.org'],
    cleartext: true,
    url: 'http://flowfy.duckdns.org'
  },
  plugins: {
    App: {
      webDir: 'build'
    }
  },
  android: {
    allowMixedContent: true
  }
};

export default config;