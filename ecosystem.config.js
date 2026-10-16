module.exports = {
  apps: [
    {
      name: 'thiep-moi',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1000M',
      time: true, // thêm thời gian vào log
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
    },
  ],
};
