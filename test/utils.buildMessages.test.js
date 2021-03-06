const assert = require('assert');
const buildMessage = require('../utils/buildMessage');

// Example to TDD
describe('utils - buildMessage', function () {
    describe('when receives and entity and an action', function () {
        it('should return the respective message', function () {
            const result = buildMessage('movie', 'create');
            const expect = 'movie created';
            assert.strictEqual(result, expect);
        });
    });

    describe('when receives and entity and an action and is a list', function () {
        it('should return the respective message with the entity in plural', function () {
            const result = buildMessage('movie', 'list');
            const expect = 'movies listed';
            assert.strictEqual(result, expect);
        });
    });
});
