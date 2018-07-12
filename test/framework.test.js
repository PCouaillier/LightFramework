const Framework = require('../build/framework').Framework;
const assert = require('chai').assert;

describe('Framework', function() {

    describe('#inject()', function() {
        let f = new Framework();

        f.addService('hello', () => new Promise(resolve => {
            setTimeout(() => resolve(Math.random()), 40);
        }));

        f.addScoped('scope', () => new Promise(resolve => {
            setTimeout(() => resolve(Math.random()), 40);
        }));

        it('should inject', function () {
            const begin = new Date();
            return f.inject('hello')
                .then(() => {
                    let duration = new Date() - begin;
                    assert.isAtLeast(duration, 40, 'exec time over 40');
                });
        });
        it('should instantiate', function() {
            const begin = new Date();
            return f.inject('scope')
                .then(()=> {
                    let duration = new Date() - begin;
                    assert.isAtLeast(duration, 40, 'exec time over 40');
                });
        });
    });

    describe('#cla()', function() {
        it('should instantiate', function(done) {
            let f = new Framework();
            const begin = new Date();
            f.addService('hello', () => new Promise(resolve => {
                setTimeout(() => resolve(Math.random()), 25);
            }));

            f.addService('world', () => new Promise(resolve => {
                setTimeout(() => resolve(Math.random()), 25);
            }));

            f.addScoped('scope', () => new Promise(resolve => {
                setTimeout(() => resolve(Math.random()), 80);
            }));

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
                            let delta = new Date() - begin;
                            assert.isDefined(res[0]);
                            assert.isDefined(res[1]);
                            assert.notEqual(res[0], res[1]);
                            assert.isAtLeast(delta, 25);
                            assert.isAtMost(delta, 80);
                            done();
                        });
                }
            );
        });
    });

    describe('#classWait()', function() {

        it('should instantiate', function (done) {

            let f = new Framework();
            f.addConst('aze', 'aze');
            f.addConst('bbb', 'bbb');
            f.addConst('11', 11);
            f.addConst('3', 3);
            f.addService('ok', () => Promise.resolve({status: "Ok"}));
            f.addService('waitLong', () => new Promise(resolve => setTimeout(() => resolve(), 40)));
            f.addService('reject', () => new Promise((_resolve, reject) => setTimeout(() => reject(), 40)));
            f.addConst('13', 13);

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

        it('should instantiate and wait', function () {
            let f = new Framework();
            f.addConst('AZE', 'aze');
            f.addConst('3', 3);
            f.addService('ok', () => Promise.resolve({status: "Ok"}));
            f.addService('waitLong', () => new Promise(resolve => setTimeout(() => resolve(true), 40)));

            const begin = new Date();
            return f.classWait(['AZE', 'ok', '3', 'waitLong'],
                class MyApp {
                    constructor(str, ok, tree) {
                        let duration = new Date() - begin;
                        assert.isAtLeast(duration, 40, 'exec time under 40');
                        assert.equal(str, 'aze');
                        assert.equal(ok.status, 'Ok');
                        assert.equal(tree, 3);
                    }
                }
            );
        });
    });

    describe('scopes', function() {

        it ('create a hierarchy', function () {
            let scope = (new Framework()).newScope('0');
            let scope1 = scope.newScope('1');
            assert.equal(scope1._parentScope._name, '0', 'first child');
            let scope2 = scope1.newScope('2');
            assert.equal(scope2._parentScope._name, '1', 'grand child');
        });

        it ('can handle service', function() {
            let root = new Framework();
            let scope = root.newScope();
            let scope1 = scope.newScope();
            scope1.addService('rng', () => Math.random());
            assert.exists(root.inject('rng'));
            assert.notEqual(scope1.inject('rng'), scope1.inject('rng'));
        });

        it ('Has scope cascading top to bottom', function () {
            let scope = (new Framework()).newScope('scope0');
            scope.addScoped('rng', ()=>Math.random());

            let scope1 = scope.newScope('scope1');
            let scope2 = scope1.newScope('scope2');
            assert.equal(scope.inject('rng'), scope.inject('rng'), 'scope value should be saved');
            assert.equal(scope.inject('rng'), scope1.inject('rng'), 'scope value should be passed to children (N+1)');
            assert.equal(scope1.inject('rng'), scope2.inject('rng'), 'scope value should be passed to children (N+2)');
        });

        it ('Has scope cascading top to bottom (discontinuously)', function () {
            let scope = (new Framework()).newScope('scope0');
            scope.addScoped('rng', ()=>Math.random());
            let scope1 = scope.newScope('scope1');
            let scope2 = scope1.newScope('scope2');
            assert.equal(scope1.inject('rng'), scope1.inject('rng'), 'scope value should be saved');
            assert.equal(scope1.inject('rng'), scope2.inject('rng'), 'scope value should be passed to children (N+2)');
        });

        it ('Has scoped services isolated from bottom to top', function () {
            let scope =  (new Framework()).newScope().newScope();
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
