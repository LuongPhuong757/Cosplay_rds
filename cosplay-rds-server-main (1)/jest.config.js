module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/test/**/*.test.(ts|js)'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@configs/(.*)$': '<rootDir>/src/configs/$1',
    '^@config$': '<rootDir>/src/configs/index',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@interceptors/(.*)$': '<rootDir>/src/interceptors/$1',
    '^@interfaces$': '<rootDir>/src/interfaces/index',
    '^@core/(.*)$': '<rootDir>/src/core/$1'
  },
  // verbose: true,
  // setupFilesAfterEnv: ["<rootDir>/test/setup.js"]
};
