# Interpolation Functions

Provides two interpolation functions: lerp (linear interpolation) and smoothstep (Hermite interpolation).

```npm install interpolation```


Use:

```js
var lerp = require('interpolation').lerp;
var smoothstep = require('interpolation').smoothstep;

var res = lerp(a, b, t);
var res2 = smoothstep(a, b, t);
```