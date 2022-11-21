export default {
  appenders: {
    consoleLog: {
      type: 'console',
    },
    systemLog: {
      type: 'console',
    },
    httpLog: {
      type: 'console',
    },
    accessLog: {
      type: 'console',
    },
  },
  categories: {
    default: {
      appenders: ['consoleLog'],
      level: 'ALL',
    },
    systemLog: {
      appenders: ['systemLog'],
      level: 'INFO',
    },
    httpLog: {
      appenders: ['httpLog'],
      level: 'INFO',
    },
    accessLog: {
      appenders: ['accessLog'],
      level: 'INFO',
    },
  },
};
