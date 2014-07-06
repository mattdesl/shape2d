var Vector2 = require('vecmath/lib/Vector2');
var Class = require('klasse');
var lerp = require('interpolation').lerp;

function distanceTo(x1, y1, x2, y2) {
    var dx = x2-x1;
    var dy = y2-y1;
    return Math.sqrt(dx*dx+dy*dy);
}

var tmp1 = new Vector2();
var tmp2 = new Vector2();

var Shape = new Class({

    initialize: function() {
        this.steps = 1;
        this.points = [];

        // If step is not provided to a ***CurveTo function, 
        // then it will be approximated with a very simple distance check
        this.approximateCurves = true;
        this.approximationFactor = 0.5;

        this._move = new Vector2();
        this._start = new Vector2();
        this._hasMoved = false;
        this._newPath = true;
    },


    reset: function() {
        this.points.length = 0;
        this._newPath = true;
        this._hasMoved = false;
        this._move.x = this._move.y = 0;
        this._start.x = this._start.y = 0;
    },

    beginPath: function() {
        this.reset();
    },
    
    moveTo: function(x, y) {
        this._newPath = true;
        this._move.x = x;
        this._move.y = y;
        this._start.x = x;
        this._start.y = y;
        this._hasMoved = true;
    },

    __newPoint: function(nx, ny) {
        this.points.push(new Vector2(nx, ny));
        this._newPath = false;
    },
    
    /** Closes the path by performing a lineTo with the first 'starting' point. 
        If the path is empty, this does nothing. */
    closePath: function(steps) {
        if (this.points.length===0)
            return;
        this.lineTo(this._start.x, this._start.y, steps);
    },
    
    lineTo: function(x, y, steps) {
        //if we are calling lineTo before any moveTo.. make this the first point
        if (!this._hasMoved) {
            this.moveTo(x, y);
            return;
        }

        steps = Math.max(1, steps || this.steps);
        for (var i=0; i<=steps; i++) { 
            if (!this._newPath && i==0)
                continue;
                
            var t = i/steps;   
            var nx = lerp(this._move.x, x, t);
            var ny = lerp(this._move.y, y, t);
            
            this.__newPoint(nx, ny);
        }
        this._move.x = x;
        this._move.y = y; 
    },

    /** Creates a bezier (cubic) curve to the specified point, with the given control points.
    If steps is not specified or is a falsy value, this function will use the default value
    set for this Path object. It will be capped to a minimum of 3 steps. 
    */
    bezierCurveTo: function(x2, y2, x3, y3, x4, y4, steps) {
        //if we are calling bezierCurveTo before any moveTo.. the control point takes the lead
        //this is how it works with HTML5 canvas context
        if (!this._hasMoved) {
            this.moveTo(x2, y2);
        }
        
        var x1 = this._move.x;
        var y1 = this._move.y;
        
        //try to approximate with a simple distance sum.
        //more accurate would be to use this:
        //http://antigrain.com/research/adaptive_bezier/
        if (!steps) {
            if (this.approximateCurves) {
                var d1 = distanceTo(x1, y1, x2, y2);
                var d2 = distanceTo(x2, y2, x3, y3);
                var d3 = distanceTo(x3, y3, x4, y4);
                steps = ~~((d1 + d2 + d3) * this.approximationFactor);
            } else {
                steps = Math.max(1, this.steps);
            }
        } 
        
        for (var i=0; i<steps; i++) {
            var t = i / (steps-1);
            var dt = (1 - t);
            
            var dt2 = dt * dt;
            var dt3 = dt2 * dt;
            var t2 = t * t;
            var t3 = t2 * t;
            
            var x = dt3 * x1 + 3 * dt2 * t * x2 + 3 * dt * t2 * x3 + t3 * x4;
            var y = dt3 * y1 + 3 * dt2 * t * y2 + 3 * dt * t2 * y3 + t3 * y4;
            
            this.__newPoint(x, y);
        }
        
        this._move.x = x4;
        this._move.y = y4;
    },
    
    /** Creates a quadratic curve to the specified point, with the given control points.
    If steps is not specified or is a falsy value, this function will use the default value
    set for this Path object. It will be capped to a minimum of 3 steps. 
    */
    quadraticCurveTo: function(x2, y2, x3, y3, steps) {
        //parity with HTML5 canvas context, just move to first control point
        if (!this._hasMoved) {
            this.moveTo(x2, y2);
        } 
        
        var x1 = this._move.x;
        var y1 = this._move.y;
        
        //try to approximate with a simple distance sum.
        //more accurate would be to use this:
        //http://antigrain.com/research/adaptive_bezier/
        if (!steps) {
            if (this.approximateCurves) {
                var d1 = tmp1.set(x1, y1).distance( tmp2.set(x2, y2) );
                var d2 = tmp1.set(x2, y2).distance( tmp2.set(x3, y3) );
                steps = ~~((d1 + d2) * this.approximationFactor);
            } else {
                steps = Math.max(1, this.steps);
            }
        } 
        
        for (var i=0; i<steps; i++) {
            var t = i / (steps-1);
            var dt = (1 - t);
            var dtSq = dt * dt;
            var tSq = t * t;
            
            var x = dtSq * x1 + 2 * dt * t * x2 + tSq * x3;
            var y = dtSq * y1 + 2 * dt * t * y2 + tSq * y3;
            
            this.__newPoint(x, y);
        }
        
        this._move.x = x3;
        this._move.y = y3;
    },

    calculateBoundingBox: function() {
        var points = this.points;

        var minX = Number.MAX_VALUE,
            minY = Number.MAX_VALUE,
            maxX = -Number.MAX_VALUE,
            maxY = -Number.MAX_VALUE;

        for (var i=0; i<points.length; i++) {
            var p = points[i];

            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return {
            x: minX,
            y: minY,
            width: maxX-minX,
            height: maxY-minY
        };
    },

    contains: function(x, y) {
        var testx = x, testy = y;
        if (typeof x === "object") {
            testx = x.x;
            testy = x.y;
        }

        var points = this.points;
        var nvert = points.length;
        var i, j, c = 0;
        for (i=0, j=nvert-1; i<nvert; j=i++) {
            if ( ((points[i].y>testy) != (points[j].y>testy)) &&
                (testx < (points[j].x-points[i].x) * (testy-points[i].y) / (points[j].y-points[i].y) + points[i].x) ) {
                c = !c;
            }
        }
        return c;
    },


    simplify: function(tolerance, out) {
        var points = this.points,
            len = points.length,
            point = new Vector2(),
            sqTolerance = tolerance*tolerance,
            prevPoint = new Vector2( points[0] );

        if (!out)
            out = new Shape();

        var outPoints = [];
        outPoints.push(prevPoint);

        for (var i=1; i<len; i++) {
            point = points[i];
            if ( point.distanceSq(prevPoint) > sqTolerance ) {
                outPoints.push(new Vector2(point));
                prevPoint = point;
            }
        }
        if (prevPoint.x !== point.x || prevPoint.y !== point.y)
            outPoints.push(new Vector2(point));

        out.points = outPoints;
        return out; 
    }
});

module.exports = Shape;