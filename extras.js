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
