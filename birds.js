function initialize(root){
    //root is global, but we pass it anyway
    // birds from http://www.iconarchive.com/show/ugly-birds-icons-by-banzaitokyo.html
    var b1 = new Image(); b1.src = 'icons/bird1.png';
    var b2 = new Image(); b2.src = 'icons/bird2.png';
    var b3 = new Image(); b3.src = 'icons/bird3.png';
    var bird1 = new Box(root,.5,.5,.5, onoff(b1,b2));
    var bird2 = new Box(root,.5,.5,.5, function(){return 0}); bird2.img = b3;
}
// simple style function for switching between images
// if the box has children
var onoff = function(image1,image2){
    return function(box){
        if (box.bs.length>0){
            box.img = image1;
        } else {
            box.img = image2;
        }
        return 0;
    }
}
