module.exports = {
    testEnviroment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/prisma/**',
        '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};