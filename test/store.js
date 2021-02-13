'use strict';

const Code = require('@hapi/code');
const Confidence = require('..');
const Lab = require('@hapi/lab');

// Declare internals

const internals = {};


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;

const tree = {
    // Fork
    key1: 'abc',
    key2: {
        // Filter
        $filter: 'env',
        production: {
            // Fork
            deeper: {
                // Value
                $value: 'value'         // Value
            }
        },
        $default: {
            // Filter
            $filter: 'platform',
            ios: 1,                     // Value
            android: false,             // Value
            $default: 2                 // Value
        }

    },
    key3: {
        // Fork
        sub1: {
            $value: 0,
            $meta: 'something'
        },
        sub2: {
            // Filter
            $filter: 'xfactor',
            $id: 'x_factor',
            yes: ''                      // Value
        }
    },
    key4: [12, 13, { $filter: 'none', x: 10, $default: 14 }],
    key5: {},
    key7: {
        $filter: 'env',
        production: [
            { animal: 'chicken' },
            { animal: 'dog' }
        ],
        staging: [
            { animal: 'cow' }
        ],
        $base: [
            { animal: 'cat' }
        ]
    },
    key8: {
        $filter: 'env',
        production: [
            { animal: 'chicken' },
            { animal: 'dog' }
        ],
        $base: { animal: 'cat' }
    },
    key9: {
        $filter: 'env',
        production: { animal: 'chicken' },
        $base: [{ animal: 'cat' }]
    },
    key10: {
        a: {
            $param: 'a.b',
            $meta: 'param without default'
        },
        b: {
            $param: 'a.c',
            $default: 123,
            $meta: 'param with default'
        },
        c: {
            $param: 'a.d',
            $coerce: 'number',
            $meta: 'param with coercion'
        }
    },
    ab: {
        // Range
        $filter: 'random.1',
        $id: 'random_ab_test',
        $range: [
            { limit: 1, value: [1, 2] },
            { limit: 2, value: { $value: 2 } },
            { limit: 3, value: { a: 5 }, id: '3' },
            { limit: 10, value: 4 },
            { limit: 20, value: 5 }
        ],
        $default: 6
    },

    arrayReplace1: { $filter: 'env', $base: { $value: ['a'], $replace: true }, $default: { $value: ['b'] }, dev: ['c'] },
    arrayReplace2: { $filter: 'env', $base: { $value: ['a'], $replace: true }, $default: ['b'],   dev: [] },
    arrayMerge1: { $filter: 'env', $base: { $value: ['a']                   }, $default: { $value: ['b'] }, dev: ['c'] },
    arrayMerge2: { $filter: 'env', $base: { $value: ['a']                   }, $default: ['b'],   dev: [] },
    arrayMerge3: { $filter: 'env', $base: ['a'],                               $default: { $value: ['b'] }, dev: {} },
    arrayMerge4: { $filter: 'env', $base: ['a'],                               $default: ['b'],   dev: {} },
    coerceArray1: { $param: 'arr', $coerce: 'array', $default: ['a'] },
    coerceArray2: { $param: 'arr', $coerce: 'array', $splitToken: '/', $default: ['a'] },
    coerceArray3: { $param: 'arr', $coerce: 'array', $splitToken: /-/i, $default: ['a'] },

    coerceBoolean1: { $param: 'bool', $coerce: 'boolean', $default: true },

    coerceObject1: { $param: 'obj', $coerce: 'object', $default: { a: 'b' } },

    noProto: Object.create(null),
    $meta: {
        something: 'else'
    }
};

describe('get()', () => {

    const store = new Confidence.Store();
    store.load(tree);

    const get = function (key, result, criteria, applied) {

        it('gets value for ' + key + (criteria ? ' with criteria ' + JSON.stringify(criteria) : ''), () => {

            const resultApplied = [];
            const value = store.get(key, criteria, applied ? resultApplied : null);

            expect(value).to.equal(result);
            if (applied) {
                expect(resultApplied).to.equal(applied);
            }
        });
    };

    get('/key1', 'abc');
    get('/key2', 2, null, [{ filter: 'env', valueId: '$default' }, { filter: 'platform', valueId: '$default' }]);
    get('/key2', 1, { platform: 'ios' }, [{ filter: 'env', valueId: '$default' }, { filter: 'platform', valueId: 'ios' }]);
    get('/key2', false, { platform: 'android' });
    get('/key2', 2, { platform: 'else' });
    get('/key2/deeper', 'value', { env: 'production' });
    get('/key2/deeper', undefined, { env: 'qa' });
    get('/key2/deeper', undefined);
    get('/key5', {});
    get('/key7', [{ animal: 'cat' },{ animal: 'chicken' },{ animal: 'dog' }], { env: 'production' });
    get('/key7', [{ animal: 'cat' },{ animal: 'cow' }], { env: 'staging' });
    get('/key8', [{ animal: 'chicken' },{ animal: 'dog' }], { env: 'production' });
    get('/key9', { animal: 'chicken' }, { env: 'production' });
    get('/key10', { b: 123 });
    get('/key10', { a: 'abc', b: 789 }, { a: { b: 'abc', c: 789 } });
    get('/key10', { a: 'abc', b: 123 }, { a: { b: 'abc', c: null } });
    get('/key10', { b: 123, c: 3000 }, { a: { d: '3000' } });
    get('/key10', { b: 123 }, { a: { d: 'abc' } });

    const slashResult = {
        key1: 'abc',
        key10: { b: 123 },
        key2: 2,
        key3: { sub1: 0 },
        key4: [12, 13, 14],
        key5: {},
        noProto: {},
        ab: 6,
        arrayReplace1: ['b'],
        arrayReplace2: ['b'],
        arrayMerge1: ['a', 'b'],
        arrayMerge2: ['a', 'b'],
        arrayMerge3: ['a', 'b'],
        arrayMerge4: ['a', 'b'],
        coerceArray1: ['a'],
        coerceArray2: ['a'],
        coerceArray3: ['a'],
        coerceBoolean1: true,
        coerceObject1: { a: 'b' }
    };
    get('/', slashResult);
    get('/', Object.assign({}, slashResult, { key3: { sub1: 0, sub2: '' }, ab: 6 }), { xfactor: 'yes' });

    get('/ab', 2, { random: { 1: 2 } }, [{ filter: 'random.1', valueId: '[object]', filterId: 'random_ab_test' }]);
    get('/ab', { a: 5 }, { random: { 1: 3 } }, [{ filter: 'random.1', valueId: '3', filterId: 'random_ab_test' }]);
    get('/ab', 4, { random: { 1: 9 } });
    get('/ab', 4, { random: { 1: 10 } }, [{ filter: 'random.1', valueId: '4', filterId: 'random_ab_test' }]);
    get('/ab', 5, { random: { 1: 11 } });
    get('/ab', 5, { random: { 1: 19 } });
    get('/ab', 6, { random: { 1: 29 } });

    get('/arrayReplace1', ['b']);
    get('/arrayReplace2', ['b']);
    get('/arrayMerge1',   ['a', 'b']);
    get('/arrayMerge2',   ['a', 'b']);
    get('/arrayMerge3',   ['a', 'b']);
    get('/arrayMerge4',   ['a', 'b']);

    get('/arrayReplace1', ['c'],      { env: 'dev' });
    get('/arrayReplace2', [],         { env: 'dev' });
    get('/arrayMerge1',   ['a', 'c'], { env: 'dev' });
    get('/arrayMerge2',   ['a'],      { env: 'dev' });
    get('/arrayMerge3',   {},         { env: 'dev' });
    get('/arrayMerge4',   {},         { env: 'dev' });

    get('/coerceArray1', ['a'], {}, [], {});
    get('/coerceArray1', ['a', 'b'], { arr: 'a,b' }, []);
    get('/coerceArray1', [], { arr: '' }, []);
    get('/coerceArray2', ['a', 'b'], { arr: 'a/b' }, []);
    get('/coerceArray3', ['a', 'b'], { arr: 'a-b' }, []);

    get('/coerceBoolean1', true, {}, [], {});
    get('/coerceBoolean1', true, { bool: 'true' }, []);
    get('/coerceBoolean1', true, { bool: 'TRUE' }, []);
    get('/coerceBoolean1', false, { bool: 'false' }, []);
    get('/coerceBoolean1', false, { bool: 'FALSE' }, []);
    get('/coerceBoolean1', true, { bool: 'NOT A BOOLEAN' }, []);
    get('/coerceBoolean1', true, { bool: '' }, []);

    get('/coerceObject1', { a: 'b' }, {}, []);
    get('/coerceObject1', { b: 'a' }, { obj: '{"b":"a"}' }, []);
    get('/coerceObject1', { a: 'b' }, { obj: 'BROKEN JSON' }, []);
    get('/coerceObject1', { a: 'b' }, { obj: '{"b":"a","__proto__":"x"}' }, []);

    it('fails on invalid key', () => {

        const value = store.get('key');
        expect(value).to.equal(undefined);
    });
});

describe('meta()', () => {

    const validate = (title, path, meta) => {

        it(title, () => {

            const store = new Confidence.Store();
            store.load(tree);
            expect(store.meta(path)).to.equal(meta);
        });
    };

    validate('returns root meta', '/', tree.$meta);
    validate('returns nested meta', '/key3/sub1', 'something');
    validate('returns undefined for missing meta', '/key1', undefined);
    validate('return param meta', '/key10/a', 'param without default');
});

describe('load()', () => {

    it('fails on invalid tree', () => {

        const store = new Confidence.Store();
        expect(() => {

            store.load({ $c: 3 });
        }).to.throw('"$c" is not allowed');

    });
});

describe('validate()', () => {

    const validate = (reason, obj, message) => {

        it(`fails on ${reason}`, () => {

            const err = Confidence.Store.validate(obj);
            expect(err).to.exist();
            if (message) {
                expect(err.message).to.equal(message);
            }
        });
    };

    // Invalid Nodes
    validate('Error node', { key: new Error() });
    validate('RegExp node', { key: new RegExp() });
    validate('Date node', { key: new Date() });

    // string $filter
    validate('empty filter', { key: { $filter: '' } });
    validate('non-string filter', { key: { $filter: 3 } });
    validate('invalid filter', { key: { $filter: '4$' } });

    // object $filter with env
    validate('empty object filter', { key: { $filter: {} } });
    validate('object filter without env', { key: { $filter: { a: 'b' } } });

    // unknown $ directives
    validate('invalid default', { key: { $default: { $b: 5 } } });
    validate('unknown directive', { key: { $unknown: 'asd' } });
    validate('invalid child node', { key: { sub: { $b: 5 } } });
    validate('invalid value node', { key: { $value: { $b: 5 } } });

    // invalid directive combinations
    validate('value with filter', { key: { $value: 1, $filter: 'a' } });
    validate('value with default', { key: { $value: 1, $default: '1' } });
    validate('value with range', { key: { $value: 1, $range: [{ limit: 10, value: 4 }] } });
    validate('value with param', { key: { $value: 1, $param: 'a.b' } });
    validate('value with non-directive keys', { key: { $value: 1, a: 1 } });
    validate('param with filter', { key: { $param: 'a.b', $filter: 'a' } });
    validate('param with range', { key: { $param: 'a.b', $range: [{ limit: 10, value: 4 }] } });
    validate('param with non-directive keys', { key: { $param: 'a.b', a: 1 } });
    validate('filter without any value', { key: { $filter: '1' } });
    validate('filter with only default', { key: { $filter: 'a', $default: 1 } });
    validate('default value without a filter or param', { key: { $default: 1 } });

    // $range
    validate('non-array range', { key: { $filter: 'a', $range: {}, $default: 1 } });
    validate('empty array range', { key: { $filter: 'a', $range: [], $default: 1 } });
    validate('non-object range array element', { key: { $filter: 'a', $range: [5], $default: 1 } });
    validate('range array element missing limit', { key: { $filter: 'a', $range: [{}], $default: 1 } });
    validate('range array element with non-number limit', { key: { $filter: 'a', $range: [{ limit: 'a' }], $default: 1 } });
    validate('out of order range array elements', { key: { $filter: 'a', $range: [{ limit: 11, value: 2 }, { limit: 10, value: 6 }], $default: 1 } });
    validate('range array element missing value', { key: { $filter: 'a', $range: [{ limit: 1 }], $default: 1 } });
    validate('range array element with invalid value', { key: { $filter: 'a', $range: [{ limit: 1, value: { $b: 5 } }], $default: 1 } });
    validate('range without a filter', { key: { $range: [{ limit: 1, value: 1 }] } });
    validate('range with non-ranged values', { key: { $filter: 'a', $range: [{ limit: 1, value: 1 }], a: 1 } });

    validate('invalid id', { key: 5, $id: 4 });
    validate('empty id', { key: 5, $id: null });

    validate('$replace with no $value', { $base: { $replace: true } });
    validate('$replace with non-array $value', { $base: { $value: 'a', $replace: true } });
    validate('$replace not under $base', { $default: { $value: ['a'], $replace: true } });

    it('returns null with null as the node', () => {

        const err = Confidence.Store.validate(null);
        expect(err).to.equal(null);
    });

    it('returns null with undefined as the node', () => {

        const err = Confidence.Store.validate(undefined);
        expect(err).to.equal(null);
    });

    it('returns null with function in a node', () => {

        const err = Confidence.Store.validate({ func: () => {} });
        expect(err).to.equal(null);
    });
});

describe('bind()', () => {

    it('binds criteria for get()', () => {

        const store = new Confidence.Store();
        store.load(tree).bind({
            a: { b: 1, c: 2 }
        });

        expect(store.get('/key10')).to.equal({ a: 1, b: 2 });
        expect(store.get('/key10', { a: { b: 3 } })).to.equal({ a: 3, b: 2 });
    });

    it('binds criteria for meta()', () => {

        const store = new Confidence.Store({
            m: {
                $filter: 'a.b',
                x: {
                    $meta: 'got x'
                },
                $default: {
                    $meta: 'got default m'
                }
            },
            n: {
                $filter: 'a.c',
                y: {
                    $meta: 'got y'
                },
                $default: {
                    $meta: 'got default n'
                }
            }
        });

        store.bind({
            a: { b: 'x', c: 'z' }
        });

        expect(store.meta('/m')).to.equal('got x');
        expect(store.meta('/n')).to.equal('got default n');
        expect(store.meta('/m', { a: { b: 'z' } })).to.equal('got default m');
        expect(store.meta('/n', { a: { c: 'y' } })).to.equal('got y');
    });

    it('accumulates bindings', () => {

        const store = new Confidence.Store(tree);
        store.bind({ a: { b: 1 } });
        store.bind({ a: { c: 2 } });

        expect(store.get('/key10')).to.equal({ a: 1, b: 2 });
        expect(store.get('/key10', { a: { b: 3 } })).to.equal({ a: 3, b: 2 });
    });

    it('resets bindings when no arguments are passed', () => {

        const store = new Confidence.Store(tree);
        store.bind({ a: { b: 1, c: 2 } });
        store.bind();

        expect(store.get('/key10')).to.equal({ b: 123 });
    });
});

describe('_logApplied', () => {

    it('adds the filter to the list of applied filters if node or criteria is not defined ', () => {

        const applied = [];

        Confidence.Store._logApplied(applied, { filter: 'env', valueId: '$default' });
        expect(applied.length).to.equal(1);
    });
});

it('accepts a document object in the constructor', () => {

    const load = Confidence.Store.prototype.load;

    Confidence.Store.prototype.load = function (document) {

        expect(document).to.equal(tree);
        Confidence.Store.prototype.load = load;
    };

    new Confidence.Store(tree);

});
