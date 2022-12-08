const RENDERMODE = 0; // 0 = default, 1 = wireframe, 2 = points


function setup() {
    createCanvas(1200, 800);

    render = [];

    genDefaultScene();

    posSens = 0.1;
    rotSens = 0.25;

    //Define Camera
    camera = {
        x: 0,
        y: 0,
        z: 4,
        rx: 0,
        ry: 0,
        rz: 0,
        fov: 60,
        near: 1,
        far: 10,
        aspect: 1,
        projection: function () {
            var fov = this.fov * (Math.PI / 180);
            var f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
            var rangeInv = 1.0 / (this.near - this.far);

            var sx = f / this.aspect;
            var sy = f;
            var sz = (this.near + this.far) * rangeInv;
            var pz = this.far * this.near * rangeInv * 2;

            return [
                [sx, 0, 0, 0],
                [0, sy, 0, 0],
                [0, 0, sz, -1],
                [0, 0, pz, 0],
            ];
        },
        view: function () {
            var x = this.x;
            var y = this.y;
            var z = this.z;
            var rx = this.rx * (Math.PI / 180);
            var ry = this.ry * (Math.PI / 180);
            var rz = this.rz * (Math.PI / 180);

            var cx = Math.cos(rx);
            var cy = Math.cos(ry);
            var cz = Math.cos(rz);
            var sx = Math.sin(rx);
            var sy = Math.sin(ry);
            var sz = Math.sin(rz);

            var m00 = cy * cz;
            var m01 = cz * sx * sy - cx * sz;
            var m02 = cx * cz * sy + sx * sz;
            var m10 = cy * sz;
            var m11 = cx * cz + sx * sy * sz;
            var m12 = -cz * sx + cx * sy * sz;
            var m20 = -sy;
            var m21 = cy * sx;
            var m22 = cx * cy;

            return [
                [m00, m10, m20, 0],
                [m01, m11, m21, 0],
                [m02, m12, m22, 0],
            ];
        },
    };
}

function draw() {
    background(150);
    translate(width / 2, height / 2);

    stroke(0);
    //Loops for every object in render array
    for (var i = 0; i < render.length; i++) {
        pointCast(render[i]);
        orderRender(render[i]);
        if (objRenderTrue(render[i])) {
            switch (RENDERMODE) {
                case 0:
                    objRenderDef(render[i]);
                    break;
                case 1:
                    objRenderWire(render[i]);
                    break;
                case 2:
                    objRenderPoints(render[i]);
             }
        }
    }
    cameraController();
}

function pointCast(obj) {
    //Project 3d point to camera using camera.projection() and camera.view() matrix
    for (var i = 0; i < obj.pts.length; i++) {
        //Translate point position
        p = [
            obj.pts[i].x - camera.x,
            obj.pts[i].y - camera.y,
            obj.pts[i].z - camera.z,
            1,
        ];
        //Rotate point position
        p = math.multiply(camera.projection(), math.transpose(p));
        //Project point position
        p = math.multiply(camera.view(), p);
        //Write 2d point
        obj.spts[i] = { x: (p[0] * 90) / p[2], y: (p[1] * 90) / p[2] };
        //Check if point is behind the screen plane
        if (p[2] < 0) {
            obj.spts[i].render = false;
        } else {
            obj.spts[i].render = true;
        }
    }
}

function objRenderDef(obj) {
    fill(obj.color);
    noStroke();

    for (var i = 0; i < obj.trles.length; i++) {
        obj.trles[i].d = dToTriangle(
            obj.pts[obj.trles[i].p1],
            obj.pts[obj.trles[i].p2],
            obj.pts[obj.trles[i].p3]
        );
        obj.trles.sort(function (a, b) {
            var x = a["d"];
            var y = b["d"];
            return x > y ? -1 : x < y ? 1 : 0;
        });
    }

    for (var i = 0; i < obj.trles.length; i++) {
        p1 = obj.spts[obj.trles[i].p1];
        p2 = obj.spts[obj.trles[i].p2];
        p3 = obj.spts[obj.trles[i].p3];
        //All points in front of screen

        triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }
}

function objRenderWire(obj) {
    for (var i = 0; i < obj.trles.length; i++) {
        obj.trles[i].d = dToTriangle(
            obj.pts[obj.trles[i].p1],
            obj.pts[obj.trles[i].p2],
            obj.pts[obj.trles[i].p3]
        );
        obj.trles.sort(function (a, b) {
            var x = a["d"];
            var y = b["d"];
            return x > y ? -1 : x < y ? 1 : 0;
        });
    }

    for (var i = 0; i < obj.trles.length; i++) {
        p1 = obj.spts[obj.trles[i].p1];
        p2 = obj.spts[obj.trles[i].p2];
        p3 = obj.spts[obj.trles[i].p3];
        //All points in front of screen

        line(p1.x, p1.y, p2.x, p2.y);
        line(p2.x, p2.y, p3.x, p3.y);
        line(p3.x, p3.y, p1.x, p1.y);
    }
}

function objRenderPoints(obj) {
    for (var i = 0; i < obj.trles.length; i++) {
        obj.trles[i].d = dToTriangle(
            obj.pts[obj.trles[i].p1],
            obj.pts[obj.trles[i].p2],
            obj.pts[obj.trles[i].p3]
        );
        obj.trles.sort(function (a, b) {
            var x = a["d"];
            var y = b["d"];
            return x > y ? -1 : x < y ? 1 : 0;
        });
    }

    for (var i = 0; i < obj.trles.length; i++) {
        p1 = obj.spts[obj.trles[i].p1];
        p2 = obj.spts[obj.trles[i].p2];
        p3 = obj.spts[obj.trles[i].p3];
        //All points in front of screen

        point(p1.x, p1.y);
        point(p2.x, p2.y);
        point(p3.x, p3.y);
    }
}

function objRenderTrue(obj) {
    
    for (var i = 0; i < obj.trles.length; i++) {
        if (obj.spts[obj.trles[i].p1].render && obj.spts[obj.trles[i].p2].render && obj.spts[obj.trles[i].p3].render) {
            obj.trles[i].render = true;
        }else {
            obj.trles[i].render = false;
        }
    }

    t = true;
    for (var i = 0; i < obj.trles.length; i++) {
        t = t * obj.trles[i].render;
    }
    return t;
}

function orderRender(obj) {
    //Order object by first triangle distance to camera
    obj.d = dToTriangle(
        obj.pts[obj.trles[0].p1],
        obj.pts[obj.trles[0].p2],
        obj.pts[obj.trles[0].p3]
    );
    render.sort(function (a, b) {
        var x = a["d"];
        var y = b["d"];
        return x > y ? -1 : x < y ? 1 : 0;
    });
}

function createCube(size, x, y, z, color) {
    render.push({
        render: true,
        color: color,
        pts: [
            { x: x, y: y, z: z },
            { x: x + size, y: y, z: z },
            { x: x + size, y: y + size, z: z },
            { x: x, y: y + size, z: z },
            { x: x, y: y, z: z + size },
            { x: x + size, y: y, z: z + size },
            { x: x + size, y: y + size, z: z + size },
            { x: x, y: y + size, z: z + size },
        ],
        trles: [
            { p1: 0, p2: 1, p3: 2 },
            { p1: 0, p2: 2, p3: 3 },
            { p1: 1, p2: 5, p3: 6 },
            { p1: 1, p2: 6, p3: 2 },
            { p1: 5, p2: 4, p3: 7 },
            { p1: 5, p2: 7, p3: 6 },
            { p1: 4, p2: 0, p3: 3 },
            { p1: 4, p2: 3, p3: 7 },
            { p1: 3, p2: 2, p3: 6 },
            { p1: 3, p2: 6, p3: 7 },
            { p1: 4, p2: 5, p3: 1 },
            { p1: 4, p2: 1, p3: 0 },
        ],
        spts: [],
    });
}

function cameraController() {
    wkey = keyIsDown(87);
    akey = keyIsDown(65);
    skey = keyIsDown(83);
    dkey = keyIsDown(68);
    spacekey = keyIsDown(32);
    shiftkey = keyIsDown(16);

    leftkey = keyIsDown(LEFT_ARROW);
    rightkey = keyIsDown(RIGHT_ARROW);
    upkey = keyIsDown(UP_ARROW);
    downkey = keyIsDown(DOWN_ARROW);

    if (wkey) {
        camera.z -= posSens;
    }
    if (skey) {
        camera.z += posSens;
    }
    if (akey) {
        camera.x -= posSens;
    }
    if (dkey) {
        camera.x += posSens;
    }

    if (spacekey) {
        camera.y -= posSens;
    }
    if (shiftkey) {
        camera.y += posSens;
    }

    if (leftkey) {
        camera.ry -= rotSens;
    }
    if (rightkey) {
        camera.ry += rotSens;
    }
    if (upkey) {
        camera.rx += rotSens;
    }
    if (downkey) {
        camera.rx -= rotSens;
    }
}

function genDefaultScene() {
    //Portal
    createCube(1, 0, 0, 0, color(200, 0, 0));
    createCube(1, 1, 0, 0, color(0, 0, 200));
    createCube(1, 2, 0, 0, color(200, 0, 0));
    createCube(1, 3, 0, 0, color(0, 0, 200));

    createCube(1, 0, 1, 0, color(200, 0, 0));
    createCube(1, 0, 2, 0, color(0, 0, 200));
    createCube(1, 0, 3, 0, color(200, 0, 0));
    createCube(1, 0, 4, 0, color(0, 0, 200));

    createCube(1, 3, 1, 0, color(200, 0, 0));
    createCube(1, 3, 2, 0, color(0, 0, 200));
    createCube(1, 3, 3, 0, color(200, 0, 0));
    createCube(1, 3, 4, 0, color(0, 0, 200));

    createCube(1, 0, 4, 0, color(200, 0, 0));
    createCube(1, 1, 4, 0, color(0, 0, 200));
    createCube(1, 2, 4, 0, color(200, 0, 0));
    createCube(1, 3, 4, 0, color(0, 0, 200));

    //Large blue cube
    createCube(4, 20, 0, -4, color(0, 0, 200));

    //Floor
    for(var i = -10; i <= 10; i++){
        for(var j = -10; j <= 10; j++){
            createCube(4, i*4, 10, j*4, color(200*((i+j)%2) + 40));
        }
    }
}
function dToTriangle(p1, p2, p3) {
    p = {
        x: (p1.x + p2.x + p3.x) / 3,
        y: (p1.y + p2.y + p3.y) / 3,
        z: (p1.z + p2.z + p3.z) / 3,
    };
    d = sqrt(
        (p.x - camera.x) * (p.x - camera.x) +
            (p.y - camera.y) * (p.y - camera.y) +
            (p.z - camera.z) * (p.z - camera.z)
    );

    return d;
}
