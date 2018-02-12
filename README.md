# LightFramework

## Installation

### Installation via npm :

Download and build the project

    git clone {PROJECT_NAME}
    cd {PROJECT_NAME}
    npm i

Get the file `compiled.js` (require `amd` or `dependencies-before.js` and `dependencies-after.js`)

### run tests : 

    npm test

## Framework

### Root
The Framework dependency create by default an instance called Root which can contain all constant dependencies.

Root.addConst('MY_CONST', 'MY_VALUE');

### Scoped Dependencies

Each scoped dependencies are instantiated once per scope instance of Framework.

    Root.addScope('rng', ()=>Math.random());

    let scope1 = Root.newScope();
    assert_eq(scope1.inject('rng'), scope1.inject('rng'));

    let scope2 = Root.newScope();
    assert_diff(scope2.inject('rng'), scope1.inject('rng'));
    assert_diff(scope2.inject('rng'), Root.inject('rng'));

if a top scope has already resolved the dependency it use it.

    let scope3 = scope2.newScope();
    assert_eq(scope2.inject('rng'), scope3.inject('rng'));

### Const

Constants are defined globally even if set to a child Scope.

    import {Root} from 'framework';
    
    let scope3 = Root.newScope().newScope()
    
    scope3.addConst('MY_CONST', 'MY_VALUE');

    assert_eq(Root.inject('MY_CONST'), 'MY_VALUE');
    
### Service

Services are defined globally even if set to a child Scope.

Services constructor are called each time.

    let scope1 = Root.newScope();
    scope1.addService('rng', () => Math.random());
    assert_diff(Root.inject('rng'), null);
    assert_diff(Root.inject('rng'), undefined);

    assert_diff(scope1.inject('rng'), scope1.inject('rng'));
    
    
### Overriding

It is possible for a scope to override a service by a Scoped dependency


    let scope1 = Root.newScope();
    scope1.addService('rng', () => Math.random());
    assert_diff(Root.inject('rng'), null);
    assert_diff(Root.inject('rng'), undefined);
    
    scope1.addScope('rng', ((a)=>(()=>a))(scope1.inject('rng')));
    assert_eq(scope1.inject('rng'), scope1.inject('rng'));
    assert_diff(scope1.inject('rng'), Root.inject('rng'));

## [WIP] Web Component

### Beware

The use of shadowdom is currently not support and my not be ever
supported natively. This mean that you need to use a polyfill. The
inconvenience of using this polyfill is that evey in shadow dom css
will be prefixed by the name of the component so it cannot be used
as a CSS class.

### Usage
All Web Component must implement HTMLElement class.

    constructor() {
        super();
        // if used alonside the framework
        this.initComponent();
    }

All class must implements the property:

        /**
         * @return string[]
         */
        static get observedAttributes() {
            return [
                'data-percent', 'percent',
                'data-legend', 'legend',
            ];
        }

and these methods : (examples)

        /**
         * this should apply the change of the value
         *
         * @param name string
         * @param oldValue string|null
         * @param newValue string|null
         * @param updateRendering? boolean
         */
        attributeChangedCallback(name, oldValue, newValue, dontUpdateRendering) {
                switch(name) {
                    case 'data-percent':
                    case 'percent':
                        this._percent = parseInt(newValue);
                        this.shadowRoot.querySelector('.percentage').innerText = this._percent + '%';
                        break;
                    case 'data-legend':
                    case 'legend':
                        this._legend = newValue;
                        this.shadowRoot.querySelector('.legend').innerText = this._legend;
                        break;
                }
                if (!donUpdateRendering) {
                    this._updateRendering();
                }
            }
    
        /**
         *
         */
        connectedCallback() {
            this._updateRendering();
        }
    
        /**
         * This method should apply the effect of each properties (this exemple only work for property that
         * start with the keywork "data-". It should be called by constructor and is also used by the
         * framework when creating the element
         *
         * @param controller?
         */
        initComponent(controller) {
            Object.keys(this.dataset).forEach(propName => {
                let value = this.dataset[propName];
                this.attributeChangedCallback('data-'+propName, null, value, true);
            });
            this._updateRendering();
        }
                
        _updateRendering() {
            // insert here complexe change rendering like resizing, calculation, ...
        }


to add the element to the list of recognize element you have to call ``customeElements.define('my-elem', MyElemClass);``

a custom element can be used in a html document by using ``<my-elem></my-elem>`` or ``<div is="my-elem"></div>`` (W3C
standard).

The recommended way to use custom elements alongside controller is to use the attribute ``data-is="my-elem"`` which
will replace the div element (or anything else) by the right element and pass the instance of the top controller
(if any) to the function ``initComponent``.

## [WIP] Controllers

[TODO]
