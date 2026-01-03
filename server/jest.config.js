/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // This tells Jest to transpile the uuid package even though it's in node_modules
    transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
    // Optional: If the error persists, force Jest to use the CommonJS version of uuid
    moduleNameMapper: {
        '^uuid$': 'uuid',
    },
};
