function Box(parent,x,y,s,f){
    this.parent = parent
    parent.bs.push(this);
    if (x==undefined) x=.25;
    if (y==undefined) y=.25;
    if (s==undefined) s=.5;
    if (f==undefined) f=(function(){return 1.0;});  //style function
    this.x = x
    this.y = y;
    this.s = s;
    this.f = f;
    this.bs = [];
    this.style = randomstyle();
}
Box.prototype.set_parent = function(parent){
    //detach from current parent
    if (this.parent){
        var bs = [];
        for (var i in this.parent.bs){
            if (this == this.parent.bs[i]) continue;
            bs.push(this.parent.bs[i]);
        }
        this.parent.bs = bs;
    }

    this.parent = parent;
    //move in with new parent
    if (parent) this.parent.bs.unshift(this);
}
Box.prototype.draw = function(){
    ctx.save();
    ctx.fillStyle = this.style;
    ctx.fillStyle = 'rgb('+this.f(this)*255 + ',10,10)';
    ctx.translate(this.x,this.y);
    ctx.scale(this.s,this.s);
    square();
    ctx.save();
    ctx.scale(1.0/100,1.0/100);
    if (this.img){
        ctx.drawImage(this.img,0,0);
    }
    ctx.restore();
    for (var i=this.bs.length;i>0;i--){
        this.bs[i-1].draw();
    }
    ctx.restore();
}
function Root(){
    //the stage on which all boxes are places.
    //can be zoomed and moved
    this.m = 1.0;
    this.dx = 0;
    this.dy = 0;
    this.bs = [];
    this.is_root = true;
    this.fingers = {};
}

Root.prototype.draw = function(){
    square();
    ctx.save();
    ctx.scale(1/this.m,1/this.m);
    ctx.translate(-this.dx,-this.dy);
    for (var i=this.bs.length;i>0;i--){
        this.bs[i-1].draw();
    }
    ctx.restore();
}

Root.prototype.coordinates = function(pt,box){
    //convert canvasview coord to root coords
    var v = vector(this.m*pt.x+this.dx,this.m*pt.y+this.dy);
    if (box==undefined){
        //default assumes root view
        return v;
    }

    //we are in a box. Travel the tree
    var ancestors = [];
    var node = box.parent;
    while (!node.is_root) {
        ancestors.push(node);
        node = node.parent;
    }

    //do the math all the way down
    while (ancestors.length) {
        node = ancestors.pop();
        v.x = (v.x - node.x) / node.s;
        v.y = (v.y - node.y) / node.s;
    }

    return v;
}

Root.prototype.fingerlist = function(){
    var fs = [];
    for (var i in this.fingers){
        fs.push(this.fingers[i]);
    }
    return fs;
}


mouseDown = function(e){
    var finger = {};
    finger.x = e.clientX/canvasWidth;
    finger.y = e.clientY/canvasHeight;
    var p = root.coordinates(finger);
    finger.grab = whichbox(p.x,p.y);
    root.fingers['mouse'] = finger;
}
mouseMove = function(e){
    var finger = root.fingers['mouse'];
    if (!finger || !finger.grab) return;
    finger.x = e.clientX/canvasWidth;
    finger.y = e.clientY/canvasHeight;
    var box = finger.grab[0];
    var p = root.coordinates(finger, box);
    box.x = p.x - finger.grab[1]*box.s;
    box.y = p.y - finger.grab[2]*box.s;
    root.draw();
}
mouseUp = function(e){
    var finger = root.fingers['mouse']
    if (finger.grab) {
        var box = finger.grab[0];
        var p = root.coordinates(finger);
        box.set_parent();
        //b is now not attached to the heirarchy

        var inside = whichbox(p.x,p.y);
        if (inside == 0){
            //in root
            box.set_parent(root);
        } else {
            box.set_parent(inside[0]);
        }

        //find position in parent
        var p = root.coordinates(finger, box);
        box.x = p.x - finger.grab[1]*box.s;
        box.y = p.y - finger.grab[2]*box.s;

        root.draw();
    }
    delete root.fingers['mouse'];
}
fingerStart = function(e){
    e.preventDefault();
    e.stopPropagation();
    for (var t in e.changedTouches){
        var touch = e.changedTouches[t];
        if (touch.identifier == undefined) continue;
        var finger = {};
        finger.x = touch.pageX/canvasWidth;
        finger.y = touch.pageY/canvasHeight;
        root.fingers[touch.identifier] = finger;
        var p = root.coordinates(finger);
        finger.grab = whichbox(p.x,p.y);
    }
    var fs = root.fingerlist();
    if (fs.length >= 2) {
        //start zoom.
        var a = root.coordinates(fs[0]);
        var b = root.coordinates(fs[1]);
        root.zoom = {
            midpoint : midpoint(a, b),
            dist : dist(a, b)
        }
        for (var i in fs){
            fs[i].grab = undefined;
        }
    }

    return false;
}
fingerMove = function(e){
    e.preventDefault();
    e.stopPropagation();
    //e.changedTouches
    //touch: identifier,pageX,pageY
    for (var t in e.changedTouches){
        var touch = e.changedTouches[t];
        if (touch.identifier==undefined) continue;
        var finger = root.fingers[touch.identifier];
        finger.x = touch.pageX/canvasWidth;
        finger.y = touch.pageY/canvasHeight;
        if (finger.grab){
            var g = finger.grab;
            var p = root.coordinates(finger, g[0]);
            var b = g[0];
            b.x = p.x - g[1]*b.s;
            b.y = p.y - g[2]*b.s;
        }
    }

    var fs = root.fingerlist();
    if (fs.length >= 2) {
        //move the zoom

        var a = fs[0];
        var b = fs[1];
        var mp = midpoint(a, b);

        root.m = root.zoom.dist / dist(a, b);
        root.dx = root.zoom.midpoint.x - mp.x * root.m;
        root.dy = root.zoom.midpoint.y - mp.y * root.m;

    }
    root.draw();
    return false;
}

fingerUp = function(e){
    e.preventDefault();
    e.stopPropagation();
    for (var t in e.changedTouches){
        var touch = e.changedTouches[t];
        if (touch.identifier==undefined) continue;
        var finger = root.fingers[touch.identifier];
        if (finger.grab) {
            var box = finger.grab[0];
            var p = root.coordinates(finger);
            box.set_parent();
            //b is now not attached to the heirarchy

            var inside = whichbox(p.x,p.y);
            if (inside == 0){
                //in root
                box.set_parent(root);
            } else {
                box.set_parent(inside[0]);
            }

            //find position in parent
            var p = root.coordinates(finger, box);
            box.x = p.x - finger.grab[1]*box.s;
            box.y = p.y - finger.grab[2]*box.s;

            root.draw();
        }
        delete root.fingers[touch.identifier];
    }
    return false;
}


//Recursive search functions

whichbox = function(x,y,box){

    //transform to box coordinates
    if (box==undefined) box = root;

    if (!box.is_root){
        x = (x - box.x)/box.s;
        y = (y - box.y)/box.s;
    }
    //test all the sub boxes
    for (var i in box.bs){
        var target = whichbox(x,y,box.bs[i]);
        if (target) return target;
    }

    //check if outside (assumes square boxes)
    if (x < 0 || y < 0 || x > 1 || y > 1 || box.is_root) return 0;

    //The target objects gives the box
    //and relative coordinates
    // (equivalent to Root.coordinates(box))
    return [box, x, y];
}


// <--------

// Colors and Shapes --------------->

function rc(){//randomcolor
    return Math.floor(255*Math.random());
}
function randomstyle(){
    return 'rgb('+rc()+','+rc()+','+rc()+')';
}

red = 'rgb(255,0,0)';
green = 'rgb(0,255,0)';

function square(){
    ctx.strokeStyle = 'rgb(255,255,255)';
    ctx.lineWidth = .01;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(0,1);
    ctx.lineTo(1,1);
    ctx.lineTo(1,0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// <---------------------


// Vectors and Math -----

dist = function(a,b){
    var dx = a.x-b.x;
    var dy = a.y-b.y;
    return Math.sqrt(dx*dx+dy*dy);
}

vector = function(x,y){
    return {x:x,y:y};
}

midpoint = function(a, b){
    var x = 0.5 * (a.x + b.x);
    var y = 0.5 * (a.y + b.y);
    return vector(x, y);
}

// <---------------------


// HTML Config ----------

function resize_canvas(){
    var c = document.getElementById('x');
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    c.setAttribute('width',canvasWidth);
    c.setAttribute('height',canvasHeight);
    //taken from http://stackoverflow.com/questions/1152203/centering-a-canvas/1646370
}

var gg = function(x) { return document.getElementById(x);}
var ctx;
window.onload = function(){

    root = new Root(); //must be named root. (and global)
    var box1 = new Box(root, .25, .25, .5,function(box){
        //sum the styles of the children
        var s = 0;
        for (var i in box.bs){
            var c = box.bs[i];
            s+=c.f(c);
        }
        if (box.bs.length>0 ){
            l = box.bs.length;
        } else {
            l = 1;
        }
        return s / l;
    });
    box1.img = new Image();
    box1.img.src = 'icon.png';
    var box2 = new Box(box1, .25, .25, .5);
    var other = new Box(root, .5, .5, .5,function(){ return 0.0;});

    gg('x').addEventListener('touchstart', fingerStart, false);
    gg('x').addEventListener('touchmove', fingerMove, false);
    gg('x').addEventListener('touchend', fingerUp, false);

    window.addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mousemove', mouseMove, false);
    window.addEventListener('mouseup', mouseUp, false);


    resize_canvas();
    ctx = document.getElementById('x').getContext('2d');
    ctx.scale(canvasWidth,canvasHeight);
    ctx.fillStyle = "black";
    square();
    root.draw();
}

// <---------------------

//START





