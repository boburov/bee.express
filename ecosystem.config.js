module.exports = {
  apps: [
    {
      name: 'server',
      cwd: './server',
      script: 'npm',
      args: 'run start:prod',
      // Must match the port the panels' NEXT_PUBLIC_API_URL points at (and
      // server/.env PORT). Behind nginx this is the upstream the API proxies to.
      env: { NODE_ENV: 'production', PORT: 60000 },
    },
    {
      name: 'bot',
      cwd: './bot',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'admin',
      cwd: './admin',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 6001 },
    },
    {
      name: 'client',
      cwd: './client',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 60002 },
    },
    {
      name: 'seller',
      cwd: './seller',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 60003 },
    },
    {
      name: 'courier',
      cwd: './courier',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 60004 },
    },
  ],
};
