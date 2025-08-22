const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  publicPath: '/',
  devServer: {
    port: 3000, // 포트 설정을 프록시 설정과 함께 통합
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        loglevel: 'debug'
      },
      '/api/users': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        loglevel: 'debug'
      },
      '/api/stores': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        loglevel: 'debug'
      },
      '/api/reviews': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        loglevel: 'debug'
      },
      '/api/favorites': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        loglevel: 'debug'
      },
      '/api/bookings': {
        target: 'http://localhost:8087',
        changeOrigin: true,
        pathRewrite: {
          '^/api/bookings': '/bookings'
        },
        logLevel: 'debug'
      },
      '/bookings': {
        target: 'http://localhost:8087',
        changeOrigin: true,
        logLevel: 'debug'
      },
      // 나머지 모든 /api 요청을 localhost:8085으로 프록시
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        },
        loglevel: 'debug'
      }
    }
  },
  transpileDependencies: true,
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      args[0]['process.env.VUE_APP_GOOGLE_API_KEY'] = JSON.stringify(process.env.VUE_APP_GOOGLE_API_KEY);
      return args;
    });
  }
});