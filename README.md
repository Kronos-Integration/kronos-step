[![Build Status](https://secure.travis-ci.org/Kronos-Integration/kronos-step.png)](http://travis-ci.org/Kronos-Integration/kronos-step)
[![codecov.io](http://codecov.io/github/Kronos-Integration/kronos-step/coverage.svg?branch=master)](http://codecov.io/github/Kronos-Integration/kronos-step?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Coverage Status](https://coveralls.io/repos/Kronos-Integration/kronos-step/badge.svg)](https://coveralls.io/r/Kronos-Integration/kronos-step)
[![Dependency Status](https://david-dm.org/Kronos-Integration/kronos-step.svg)](https://david-dm.org/Kronos-Integration/kronos-step)
[![devDependency Status](https://david-dm.org/Kronos-Integration/kronos-step/dev-status.svg)](https://david-dm.org/Kronos-Integration/kronos-step#info=devDependencies)
[![docs](http://inch-ci.org/github/Kronos-Integration/kronos-step.svg?branch=master)](http://inch-ci.org/github/Kronos-Integration/kronos-step)
[![downloads](http://img.shields.io/npm/dm/kronos-step.svg?style=flat-square)](https://npmjs.org/package/kronos-step)
[![GitHub Issues](https://img.shields.io/github/issues/Kronos-Integration/kronos-step.svg?style=flat-square)](https://github.com/Kronos-Integration/kronos-step/issues)
[![Greenkeeper](https://badges.greenkeeper.io/Kronos-Integration/kronos-step.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/Kronos-Integration/kronos-step/badge.svg)](https://snyk.io/test/github/Kronos-Integration/kronos-step)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![minified size](https://badgen.net/bundlephobia/min/kronos-step)](https://bundlephobia.com/result?p=kronos-step)
[![npm](https://img.shields.io/npm/v/kronos-step.svg)](https://www.npmjs.com/package/kronos-step)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/Kronos-Integration/kronos-step)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# kronos-step

basic step implementation

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Step](#step)
    -   [startupOrder](#startuporder)
    -   [log](#log)
    -   [name](#name)
    -   [startupOrder](#startuporder-1)
-   [StepProviderMixin](#stepprovidermixin)
-   [StepProviderMixin](#stepprovidermixin-1)

## Step

**Extends Service**

Steps are building blocks for flows

### startupOrder

Order in which the step should be started.
Higher numbers result in earlier startup

Returns **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** delivered from the constructors startupOrder

### log

Adds 'step-type' and 'step-name' to the log event

**Parameters**

-   `level`  
-   `arg`  

Returns **void** 

### name

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 'kronos-step'

### startupOrder

Order in which the step should be started.
Higher numbers result in earlier startup

Returns **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 1.0

## StepProviderMixin

Extends a class to fullfill step provider functionality

**Parameters**

-   `superclass` **Class** class to extend

Returns **Class** extended class

## StepProviderMixin

Extends a class to fullfill step provider functionality
Register and lookup step types

**Parameters**

-   `superclass` **Class** class to extend

Returns **Class** extended class

# install

With [npm](http://npmjs.org) do:

```shell
npm install kronos-step
```

# license

BSD-2-Clause
