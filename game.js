function d(x1, y1, x2, y2){
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}

function areRotColliding(obj1, obj2){
    let sx1=obj1.sx, sy1=obj1.sy, sx2=obj2.sx, sy2=obj2.sy;
    if (Math.round(obj1.angle / (Math.PI/2))%2==0){
        sx1 = obj1.sy;
        sy1 = obj1.sx;
    }
    if (Math.round(obj2.angle / (Math.PI/2))%2==0){
        sx2 = obj2.sy;
        sy2 = obj2.sx;
    }
    return areColliding(obj1.x-sx1/2, obj1.y-sy1/2, sx1, sy1, obj2.x-sx2/2, obj2.y-sy2/2, sx2, sy2);
}

function drawImageRot(img, x, y, sx, sy, angle){
    context.save();
    context.translate(x, y);
    context.rotate(angle+Math.PI/2);
    drawImage(img, -sx/2, -sy/2, sx, sy);
    context.restore();
}
var human_img = tryToLoad("human", "blue");

class Human{
    constructor(ind, x, y){
        this.x = x;
        this.y = y;
        this.oldx = x;
        this.oldy = y;
        this.img = human_img;
        this.sx = 60;
        this.sy = 60;
        this.angle = 0;
        this.speed = 2;
        this.pickup_range = 150;
        this.held = -1;
        this.ind = ind;
        this.hp = 100;
    }
    shoot(){
        if (this.held != -1){
            weapons[this.held].shoot();
        }
    }
    moveForward(){
        this.x += Math.cos(this.angle)*this.speed;
        this.y += Math.sin(this.angle)*this.speed;
    }
    moveBack(){
        this.x -= Math.cos(this.angle)*this.speed;
        this.y -= Math.sin(this.angle)*this.speed;
    }
    moveRight(){
        this.x -= Math.sin(this.angle)*this.speed;
        this.y += Math.cos(this.angle)*this.speed;
    }
    moveLeft(){
        this.x += Math.sin(this.angle)*this.speed;
        this.y -= Math.cos(this.angle)*this.speed;
    }
    pickup(){
        let ind = -1, mind = -1;
        for (let i=0; i<weapons.length; ++i){
            let currd = d(this.x, this.y, weapons[i].x, weapons[i].y);
            if (weapons[i].held_by==-1 && (mind == -1 || currd < mind)){
                ind = i;
                mind = currd;
            }
        }
        if (mind < this.pickup_range && ind!=-1){
            if (this.held != -1) weapons[this.held].drop();
            this.held = ind;
            weapons[ind].pickup(this.ind);
        }
    }
    draw(){
        drawImageRot(this.img, this.x, this.y, this.sx, this.sy, this.angle);
    }
    update(){
        //collision with walls
        for (let i=0; i<walls.length; ++i){
            if (areRotColliding(this, walls[i])){
                this.x = this.oldx;
                this.y = this.oldy;
                walls[i].onhit("human", this.ind);
            }
        }
        this.oldx = this.x;
        this.oldy = this.y;
    }
    onkeyup(key){}
    onmouseup(){}
};
class Enemy extends Human{}
class BasicEnemy extends Enemy{
    update(){
        super.update();
        this.pickup();
        this.angle = Math.atan2(humans[0].y - this.y, humans[0].x - this.x);
        this.shoot();
        this.moveForward();
    }
}
class Player extends Human{
    update(){
        super.update();
        if (isKeyPressed[87]) this.moveForward();
        if (isKeyPressed[83]) this.moveBack();
        if (isKeyPressed[65]) this.moveLeft();
        if (isKeyPressed[68]) this.moveRight();
        this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    }
    onkeyup(key){
        if (key == 69) this.pickup();
    }
    onmouseup(){
        this.shoot();
    }
};
var gun_floor_img = tryToLoad("gun_floor", "gray");
var gun_held_img = tryToLoad("gun_held", "red");
class Weapon{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.img_down = gun_floor_img;
        this.img_held = gun_held_img;
        this.held_by = -1;
        this.angle = 0;
        this.sx = 40;
        this.sy = 40;
        this.reload_time = 10;
        this.curr_reload = 0;
    }
    shoot(){}
    update(){
        if (this.held_by != -1){
            this.curr_reload--;
            this.angle = humans[this.held_by].angle;
            this.x = humans[this.held_by].x + Math.cos(this.angle)*this.sx;
            this.y = humans[this.held_by].y + Math.sin(this.angle)*this.sx;
        }
    }
    pickup(ind){
        this.held_by = ind;
    }
    drop(){
        this.held_by = -1;
    }
    draw(){
        if (this.held_by == -1){
            drawImageRot(this.img_down, this.x, this.y, this.sx, this.sy, this.angle);
        }else{
            drawImageRot(this.img_down, this.x, this.y, this.sx, this.sy, this.angle);
        }
    }
};
class Pistol extends Weapon{
    shoot(){
        if (this.curr_reload <= 0){
            projectiles.push(new Bullet(this.x, this.y, this.x + Math.cos(this.angle), this.y + Math.sin(this.angle), this.held_by));
            this.curr_reload = this.reload_time;
        }
    }
}
var projectile_img = tryToLoad("projectile", "yellow");
class Projectile{
    constructor(x, y, tx, ty, who){
        this.x = x;
        this.y = y;
        this.sx = 5;
        this.sy = 20;
        this.speed = 20;
        this.tx = tx;
        this.ty = ty;
        this.who = who;
        this.img = projectile_img;
        this.ang = 0;
    }
    update(){}
    draw(){
        drawImageRot(this.img, this.x, this.y, this.sx, this.sy, this.ang);
    }
}
class Bullet extends Projectile{
    constructor(x, y, tx, ty, who){
        super(x, y, tx, ty, who);
        let dist = d(x, y, tx, ty);
        this.dx = (tx-x)/dist*this.speed;
        this.dy = (ty-y)/dist*this.speed;
        this.ang = Math.atan2(ty-y, tx-x);
    }
    update(){
        this.x += this.dx;
        this.y += this.dy;
    }
}
class Wall{
    constructor(x, y, sx, sy, angle){
        this.x = x;
        this.y = y;
        this.sx = sx;
        this.sy = sy;
        this.angle = angle;
        this.img = tryToLoad("wall", "black");
    }
    onhit(what, ind){}
    draw(){
        drawImageRot(this.img, this.x, this.y, this.sx, this.sy, this.angle);
    }
}
class Door extends Wall{
    constructor(x, y, sx, sy, angle){
        super(x, y, sx, sy, angle);
        this.tryToLoad("door", "brown");
    }
    onhit(what, ind){

    }
}

var projectiles = [];
var humans = [new Player(0, 400, 300), new BasicEnemy(1, 100, 100)];
var weapons = [new Pistol(200, 200), new Pistol(500, 500)];
var walls = [new Wall(300, 300, 10, 100, Math.PI/2), new Wall(350, 250, 10, 100, 0)];

function update() {
    for (let i=0; i<humans.length; ++i){
        humans[i].update();
    }
    for (let i=0; i<weapons.length; ++i){
        weapons[i].update();
    }
    for (let i=0; i<projectiles.length; ++i){
        projectiles[i].update();
    }
}
function draw() {
    for (let i=0; i<walls.length; ++i){
        walls[i].draw();
    }
    for (let i=0; i<humans.length; ++i){
        humans[i].draw();
    }
    for (let i=0; i<weapons.length; ++i){
        weapons[i].draw();
    }
    for (let i=0; i<projectiles.length; ++i){
        projectiles[i].draw();
    }
};
function keyup(key) {
    for (let i=0; i<humans.length; ++i){
        humans[i].onkeyup(key);
    }
};
function mouseup() {
    for (let i=0; i<humans.length; ++i){
        humans[i].onmouseup();
    }
};
