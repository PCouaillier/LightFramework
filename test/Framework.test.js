const Framework = require('../build/framework').Framework;
const Root = require('../build/framework').Root;
const assert = require('chai').assert;

let f = new Framework();

f.addService('hello', () => new Promise(a => {
    setTimeout(()=>a(Math.random()), 10);
}));

f.addService('world', () => new Promise(a => {
    setTimeout(()=>a(Math.random()), 10);
}));

f.addScoped('scope', () => new Promise(resolve => {
    setTimeout(()=>resolve(Math.random()), 20);
}));

describe('Framework', function() {

    describe('#inject()', function() {
        it('should inject', function (done) {
            const begin = new Date();
            f.inject('hello')
                .then(() => {
                    let duration = new Date() - begin;
                    assert.isBelow(duration, 14, 'exec time under 14');
                    assert.isAtMost(10, duration, 'exec time over 10');
                    done();
                });
        });
        it('should instantiate', function(done) {
            const begin = new Date();
            f.inject('scope')
                .then(()=> {
                    let duration = new Date() - begin;
                    assert.isBelow(duration, 24, 'exec time under 24');
                    assert.isAtMost(20, duration, 'exec time over 20');
                    done();
                });
        });
    });

    describe('#cla()', function() {
        it('should instantiate', function(done) {
            f.cla(
                [
                    'hello',
                    'world',
                ],
                function add(a, b) {
                    Promise.all(
                        [
                            a,
                            b
                        ])
                        .then(res => {
                            assert.isDefined(res[0]);
                            assert.isDefined(res[1]);
                            assert.notEqual(res[0], res[1]);
                            done();
                        });
                }
            );
        });
    });

    describe('#classWait()', function() {
        let f = new Framework();

        f.addConst('aze', 'aze');
        f.addConst('bbb', 'bbb');
        f.addConst('11', 11);
        f.addConst('3', 3);
        f.addService('ok', () => Promise.resolve({status: "Ok"}));
        f.addService('waitLong', () => new Promise(resolve => setTimeout(() => resolve(), 400)));
        f.addService('reject', () => new Promise((_resolve, reject) => setTimeout(() => reject(), 400)));
        f.addConst('13', 13);

        it('should instantiate', function (done) {
            /**
             * @param {string} bbb
             * @param {number} eleven
             * @param {Promise} ok
             * @param {number} thirteen
             */
            f.cla(['BBB', '11', 'ok', '13'], function(bbb, eleven, ok, thirteen) {
                assert.equal(bbb, 'bbb');
                assert.equal(eleven, 11);
                assert.equal(thirteen, 13);
                ok.then(a => {
                    assert.equal(a.status, 'Ok');
                    done();
                });
            });
        });

        it('should instantiate and wait', function (done) {
            const begin = new Date();
            f.classWait(['AZE', 'ok', '3', 'waitLong'],
                class MyApp {
                    constructor(str, ok, tree) {
                        let duration = new Date() - begin;
                        assert.isBelow(duration, 410, 'exec time under 410');
                        assert.isAtMost(400, duration, 'exec time over 400');
                        assert.equal(str, 'aze');
                        assert.equal(ok.status, 'Ok');
                        assert.equal(tree, 3);
                        done();
                    }
                }
            );
        });
    });

    describe('scopes', function() {
        it ('can handle service', function() {
            let scope1 = Root.newScope();
            scope1.addService('rng', () => Math.random());
            assert.exists(Root.inject('rng'));
            assert.notEqual(scope1.inject('rng'), scope1.inject('rng'));
        });

        it ('Has scope cascading top to bottom', function () {
            let scope =  Root.newScope();
            scope.addScoped('rng', ()=>Math.random());

            let scope1 = scope.newScope();
            let scope2 = scope.newScope();
            assert.equal(scope1.inject('rng'), scope1.inject('rng'), 'scope value should be saved');
            assert.equal(scope1.inject('rng'), scope2.inject('rng'), 'scope value should be passed to children');
        });

        it ('Has scoped services isolated from bottom to top', function () {
            let scope =  Root.newScope();
            scope.addScoped('rng', ()=>Math.random());

            let scope1 = scope.newScope();
            let scope2 = scope.newScope();
            assert.equal(scope2.inject('rng'), scope2.inject('rng'));
            assert.notEqual(scope2.inject('rng'), scope1.inject('rng'));
        });
    });
});

/*
df = new DocumentFragment();
div = document.createElement('div');
div.setAttribute('data-controller', 'c0');
div.setAttribute('data-is', 'i00');
df.appendChild(div);

div = document.createElement('div');
div.setAttribute('data-controller', 'c1');
div2 = document.createElement('div');
div2.setAttribute('data-is', 'i10');
div.appendChild(div2);
df.appendChild(div);

div = document.createElement('div');
div.setAttribute('data-controller', 'c2');
div2 = document.createElement('div');
div2.setAttribute('data-controller', 'c20');
div3 = document.createElement('div');
div3.setAttribute('data-is', 'i200');
div2.appendChild(div3);
div.appendChild(div2);
df.appendChild(div);

f.initControllers(df);
*/