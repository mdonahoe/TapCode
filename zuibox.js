var fingers = {};
function resize_canvas(){
    var c = document.getElementById('x');
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    c.setAttribute('width',canvasWidth);
    c.setAttribute('height',canvasHeight);
    //taken from http://stackoverflow.com/questions/1152203/centering-a-canvas/1646370
}
vector = function(x,y){
    return {x:x,y:y};
}
setv = function(obj,v){
    obj.x = v.x;
    obj.y = v.y;
}
getv = function(obj){
    return vector(obj.x,obj.y);
}

var gg = function(x) { return document.getElementById(x);}
var ctx;
function ready(){
    resize_canvas();
    ctx = document.getElementById('x').getContext('2d');
    ctx.scale(canvasWidth,canvasHeight);
    ctx.fillStyle = "black";
    square();
    drawscreen();
}
function rc(){//randomcolor
    return Math.floor(255*Math.random());
}
function randomstyle(){
    return 'rgb('+rc()+','+rc()+','+rc()+')';
}
function square(){
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(0,1);
    ctx.lineTo(1,1);
    ctx.lineTo(1,0);
    ctx.closePath();
    ctx.fill();
}

var m = 1; //the size of the viewport
var dx = 0;
var dy = 0;

var makebox = function(x,y,s){
    var b = {
        x:x,y:y,s:s,cs:[],style:randomstyle()
    };
    //if (Math.random()>.3){
    //  b.cs.push(makebox(Math.random(),Math.random(),Math.random()));
    //}
    return b;
}
var drawbox = function(b){
    ctx.save();
    ctx.fillStyle = b.style;
    ctx.translate(b.x,b.y);
    ctx.scale(b.s,b.s);
    square();
    for (var i=0;i<b.cs.length;i++){
        drawbox(b.cs[i]);
    }
    ctx.restore();
}

var box = makebox(.5,.5,.5);
box.cs.push(makebox(.25,.5,.5));

drawscreen = function(){
    square();
    ctx.save();
    ctx.scale(1/m,1/m);
    ctx.translate(-dx,-dy);
    drawbox(box);
    ctx.restore();
}

whichbox = function(x,y,tbox){

    if (tbox==undefined){
        tbox = box;
    }

    //test if outside the box
    //var inside = !(x<tbox.x || x>tbox.x+tbox.s || y<tbox.y || y>tbox.y+tbox.s);

    //transform to box coordinates
    x = (x - tbox.x)/tbox.s;
    y = (y - tbox.y)/tbox.s;

    //test all the sub boxes
    for (var i=0;i<tbox.cs.length;i++){
        var b = whichbox(x,y,tbox.cs[i]);
        if (b!=0) return b;
    }


    //check if outside
    if (x<0 || y<0 || x>1 || y>1) return 0;

    //return ourselves
    return [tbox,x,y];
}

findbox = function(b,cbox){
    //returns a list from box to b (not including b)
    if (cbox==undefined) cbox = box;
    if (cbox==b) return [];

    var p=0;
    for (var i=0;i<cbox.cs.length;i++){
        p = findbox(b,cbox.cs[i]);
        if (p) break;
    }
    if (p) return [cbox].concat(p);
    return 0;
}

getcoords = function(v,rbox){

    //convert canvasview coord to root coords
    var p = vector(m*v.x+dx,m*v.y+dy);

    //default assume root, so return now
    if (rbox==undefined){
        return p;
    }

    //find the path from the root to the desired box
    var boxlist = findbox(rbox);


    if (boxlist==0) return p;

    //transform the position to parent box coordinates by walking the path
    p = reduce(function(p,b){
        p.x = (p.x - b.x) / b.s;
        p.y = (p.y - b.y) / b.s;
        return p;
    }, boxlist, p);

    return p;
}

getmousecoords = function(rbox){
    return getcoords(vector(mx,my),rbox);
}

map = function(f,xs){
    var ys = [];
    for (var i=0;i<xs.length;i++){
        ys.push(f(xs[i]));
    }
    return ys;
}

filter = function(f,xs){
    var ys = [];
    for (var i=0;i<xs.length;i++){
        if (f(xs[i])) ys.push(xs[i]);
    }
    return ys;
}

reduce = function(f,xs,val) {
    for (var i=0;i<xs.length;i++){
        val = f(val,xs[i]);
    }
    return val;
}
fingerStart = function(e){
    e.preventDefault();
    for (var t in e.changedTouches){
        var touch = e.changedTouches[t];
        if (touch.identifier==undefined) continue;
        var finger = {};
        finger.x = touch.pageX/canvasWidth;
        finger.y = touch.pageY/canvasHeight;
        fingers[touch.identifier] = finger;
        var p = getcoords(finger);
        finger.grab = whichbox(p.x,p.y);
    }
    if (countfingers()==2) startzoom();

    return false;
}
countfingers = function(){
    var i=0;
    for (var f in fingers){
        i++;
    }
    return i;
}

fingerMove = function(e){
    e.preventDefault();
    //e.changedTouches
    //touch: identifier,pageX,pageY
    for (var t in e.changedTouches){
        var touch = e.changedTouches[t];
        if (touch.identifier==undefined) continue;
        var finger = fingers[touch.identifier];
        finger.x = touch.pageX/canvasWidth;
        finger.y = touch.pageY/canvasHeight;
        if (finger.grab){
            var g = finger.grab;
            var p = getcoords(finger,g[0]);
            g[0].x = p.x - g[1]*g[0].s;
            g[0].y = p.y - g[2]*g[0].s;
            drawscreen();
        }
    }
    if (countfingers()==2) {
        movezoom();
        //no touching while zooming
        for (var i in fingers){
            fingers[i].grab = undefined;
        }
    }
    return false;
}

fingerUp = function(e){
    e.preventDefault();
    for (var t in e.changedTouches){
        var touch = e.changedTouches[t];
        if (touch.identifier==undefined) continue;
        finger = fingers[touch.identifier];
        if (finger.grab) {
            console.log('releasing the grab');
            //see where this box is relative to its parent
            var b = finger.grab;
            var xy = getcoords(finger);
            var parent = findbox(b);
            orphan(b,parent);
            //b is now not attached to the heirarchy
            var inside = whichbox(xy.x,xy.y)[0];
            console.log(inside);
            if (parent == inside) {
                console.log('still in parent');
                parent.cs.push(b); //add it back
                continue;
            }
            inside.style = randomstyle();
            inside.cs.push(b);
            //add or remove

        }
        delete fingers[touch.identifier];
    }
    return false;
}

orphan = function(child,parent){
    var cs = [];
    for (var i in parent.cs){
        var c = parent.cs[i];
        if (c!=child) cs.push(c);
    }
    parent.cs = cs;
}

dist = function(a,b){
    var dx = a.x-b.x;
    var dy = a.y-b.y;
    return Math.sqrt(dx*dx+dy*dy);
}

startzoom = function() {
    var fs = [];
    for (var i in fingers){
        fs.push(fingers[i]);
    }
    var a = getcoords(fs[0]);
    var b = getcoords(fs[1]);
    zoommidpoint = vector(0.5 * (a.x+b.x), 0.5*(a.y+b.y));
    zoomdist = dist(a,b);
}

movezoom = function() {
    var fs = [];
    for (var i in fingers){
        fs.push(fingers[i]);
    }
    var a = fs[0];
    var b = fs[1];
    var c = vector(0.5 * (a.x+b.x), 0.5*(a.y+b.y));

//  x1*m1+dx1 = px;
//  px = x2*m2+dx2;
//  dist*m2 = dist1

    m = zoomdist / dist(a,b);
    dx = zoommidpoint.x - c.x*m;
    dy = zoommidpoint.y - c.y*m;
    drawscreen();
}

pointinsideboxes = function(p,b){
    //returns a list of boxes that b is inside of, starting from the box b
    if (b==undefined) b = rootbox;
    v = vector(
        (p.x - b.x)/b.s,
        (p.y - b.y)/b.s
    ); //transform to current box coords
    //not sure what will happen if rootbox.x != 0


    var bs = [];
    for (var i=0;i<b.cs.length;i++){
        bs = bs.concat(pointinsideboxes(v,b.cs[i]));
    }
    if (v.x < 0 || v.y < 0 || v.x > 1 || v.y > 1) return bs;
    return [{b:b,x:p.x,y:p.y}].concat(bs);
    //sorted by box draw order (ie, the last box to be drawn is the last in the array)
}


/*
Read

As far as I can tell:

1. this is a zui
2. it has boxes
3. boxes have x,y,scale (relative to parent)






*/

