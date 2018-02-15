const StateBox = require('./../build/stateBox').default;
// noinspection JSUnresolvedVariable
const assert = require('chai').assert;

function newSb() {
    return new StateBox(() => Math.random());
}

describe('StateBox', function() {
   describe('#call', function () {
       it ('should use argument', function() {
           // noinspection CommaExpressionJS
           assert.deepEqual((new StateBox((b) => (b.a=2, b))).call({c:14}), {a:2, c:14});
       });

       it('should save call', function () {
           let sb = newSb('aze');
           assert.equal(sb.call(), sb.call());
           assert.notEqual(newSb('aze').call(), sb.call());
       });
   });

    describe('#copy', function () {
        it('should copy actual state', function () {
            let sb = newSb('aze');
            let v = sb.copy().call();
            let w = sb.call();
            assert.notEqual(v, w);
            assert.equal(sb.copy().call(), sb.call());
        });
    });
});
