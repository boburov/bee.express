module.exports = {
  apps: [
    {
      name: 'server',
      cwd: './server',
      script: 'npm',
      args: 'run start:prod',
      env: { NODE_ENV: 'production', PORT: 4000 },
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
