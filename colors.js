function initialize(root){

    var box1 = new Box(root, .25, .25, .05,function(box){
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
    var box2 = new Box(box1, .25, .25, .05);
    var other = new Box(root, .5, .5, .05,function(){ return 0.0;});
}
