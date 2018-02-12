const Injector = require('../build/Injector').default;
const assert = require('chai').assert;

describe('Injector', function () {
    let injector = new Injector();
    let i = 1;

    describe('const', function () {
       it('can use const', function () {
           injector.addConst('HELLO', 'WORLD');
           assert.equal(injector.inject('HELLO'), 'WORLD');
       });
        it('can use scope', function () {
            injector.addScoped('sc', ()=>++i);
            assert.equal(injector.inject('sc'), injector.inject('sc'));
        });
        it('can use service', function () {
            injector.addService('sc1', ()=>++i);
            assert.notEqual(injector.inject('sc1'), injector.inject('sc1'));
        });
   });
});