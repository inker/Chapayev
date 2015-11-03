/// <reference path="./typings/tsd.d.ts" />
require('babylon');
var Chapayev = (function () {
    function Chapayev(dimensions, colors) {
        var _this = this;
        if (dimensions === void 0) { dimensions = { w: 8, h: 8 }; }
        if (colors === void 0) { colors = [new BABYLON.Color3(0.9, 0.9, 0.7), new BABYLON.Color3(0.4, 0.2, 0)]; }
        this.dimensions = dimensions;
        this.colors = colors;
        document.addEventListener("DOMContentLoaded", function () {
            if (!BABYLON.Engine.isSupported()) {
                throw new Error("babylon not supported");
            }
            _this.init();
        }, false);
    }
    Chapayev.prototype.init = function () {
        var _this = this;
        var canvas = document.getElementsByTagName('canvas')[0];
        this.engine = new BABYLON.Engine(canvas, true);
        this.createScene(this.engine);
        console.log(this.scene);
        this.engine.runRenderLoop(function () { return _this.scene.render(); });
        window.addEventListener("resize", function (e) { return _this.engine.resize(); });
    };
    Chapayev.prototype.createScene = function (engine) {
        var _this = this;
        this.scene = new BABYLON.Scene(engine);
        this.scene.enablePhysics(null, new BABYLON.OimoJSPlugin());
        //scene.clearColor = new BABYLON.Color3(0, 0, 0);
        this.makeCamera();
        var board = this.makeBoard(1);
        var light = new BABYLON.PointLight("light1", this.camera.position, this.scene);
        light.intensity = 1;
        this.checkers = new Array();
        for (var c = 0; c < 2; ++c) {
            this.checkers.push(new Array(this.dimensions.w));
            for (var i = 0; i < this.dimensions.w; ++i) {
                this.checkers[c].push(this.makeChecker({ w: i, h: 0 }, c));
            }
        }
        var timestamp = 0;
        window.addEventListener('mousedown', function (e) { return timestamp = new Date().getTime(); });
        window.addEventListener('mouseup', function (e) {
            var strength = (new Date().getTime() - timestamp) / 10;
            var pickResult = _this.scene.pick(_this.scene.pointerX, _this.scene.pointerY);
            if (!pickResult.hit)
                return;
            var mesh = pickResult.pickedMesh;
            if (mesh.name !== 'Checker')
                return;
            mesh.applyImpulse(pickResult.pickedPoint.subtract(_this.camera.position).normalize().scale(strength), pickResult.pickedPoint);
        });
    };
    Chapayev.prototype.makeCamera = function () {
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, 10), this.scene);
        camera.keysUp.push(87);
        camera.keysDown.push(83);
        camera.keysLeft.push(65);
        camera.keysRight.push(68);
        //camera.inertia = 0;
        //camera.speed = 10;
        //camera.rotation = new BABYLON.Vector3(100, 100, 100);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(this.engine.getRenderingCanvas(), false);
        this.camera = camera;
    };
    Chapayev.prototype.makeBoard = function (tileSize) {
        var xmin = -this.dimensions.w * tileSize / 2;
        var zmin = xmin;
        var xmax = -xmin;
        var zmax = xmax;
        var precision = { w: 2, h: 2 };
        var subdivisions = this.dimensions;
        var tiledGround = BABYLON.Mesh.CreateTiledGround('Board', xmin, zmin, xmax, zmax, subdivisions, precision, this.scene);
        var whiteMaterial = new BABYLON.StandardMaterial("White", this.scene);
        whiteMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        var blackMaterial = new BABYLON.StandardMaterial("Black", this.scene);
        blackMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        var multimat = new BABYLON.MultiMaterial("multi", this.scene);
        multimat.subMaterials.push(whiteMaterial);
        multimat.subMaterials.push(blackMaterial);
        tiledGround.material = multimat;
        var verticesCount = tiledGround.getTotalVertices();
        var tileIndicesLength = tiledGround.getIndices().length / (subdivisions.w * subdivisions.h);
        tiledGround.subMeshes = [];
        var base = 0;
        for (var row = 0; row < subdivisions.h; ++row) {
            for (var col = 0; col < subdivisions.w; ++col) {
                tiledGround.subMeshes.push(new BABYLON.SubMesh(row % 2 ^ col % 2, 0, verticesCount, base, tileIndicesLength, tiledGround));
                base += tileIndicesLength;
            }
        }
        tiledGround.setPhysicsState(BABYLON.PhysicsEngine.PlaneImpostor, { mass: 0, friction: 0.5, restitution: 0.3 });
        tiledGround.checkCollisions = true;
        return tiledGround;
    };
    Chapayev.prototype.makeChecker = function (tile, colorNum) {
        var checker = BABYLON.Mesh.CreateCylinder("Checker", 0.25, 0.75, 0.75, 16, 1, this.scene);
        checker.position = new BABYLON.Vector3(-this.dimensions.w * 1 / 8 * tile.w + 3.5, 0.125, (1 - colorNum * 2) * 3.5 * 1);
        checker.setPhysicsState(BABYLON.PhysicsEngine.CylinderImpostor, { mass: 0.01, friction: 0.2, restitution: 0.3 });
        checker.checkCollisions = true;
        var mat = new BABYLON.StandardMaterial("Mat", this.scene);
        mat.diffuseColor = this.colors[colorNum];
        checker.material = mat;
        return checker;
    };
    return Chapayev;
})();
new Chapayev({ w: 8, h: 8 });
//function makeBullet(scene: BABYLON.Scene, material: BABYLON.Material, target: BABYLON.Mesh, camera: BABYLON.Camera) {
//    const bullet = BABYLON.Mesh.CreateCylinder("bullet", 0.3, 0.05, 0.005, 10, null, scene, true);
//    bullet.material = material;
//    const boxPos = target.getAbsolutePosition();
//    bullet.position = camera.position.subtract(boxPos.subtract(camera.position).scale(0.1));
//    bullet.setPhysicsState(BABYLON.PhysicsEngine.CylinderImpostor, { mass: 3, friction: 0.1, restitution: 0.001 });
//    // make it fly 
//    bullet.applyImpulse(boxPos.subtract(camera.position).scale(10), bullet.position);
//    return bullet;
//}
//function createScene(engine: BABYLON.Engine) {
//    const scene = new BABYLON.Scene(engine);
//    scene.enablePhysics(null, new BABYLON.OimoJSPlugin());
//    //scene.clearColor = new BABYLON.Color3(0, 0, 0);
//    const camera = makeCamera(engine);
//    const light = new BABYLON.PointLight("light1", camera.position, scene);
//    light.intensity = 1;
//    light.specular = new BABYLON.Color3(1, 1, 0.75);
//    const li = new BABYLON.PointLight("loo", new BABYLON.Vector3(1, 2, 1), scene);
//    li.intensity = 0.5;
//    li.diffuse = new BABYLON.Color3(1, 0, 0);
//    //setInterval(() => li.position.x -= 0.1, 100);
//    const lightAnimation = new BABYLON.Animation("bar", "intensity", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
//    lightAnimation.setKeys([{ frame: 0, value: 0 }, { frame: 50, value: 1 }, { frame: 100, value: 0 }]);
//    li.animations.push(lightAnimation);
//    scene.beginAnimation(li, 0, 100, true);
//    const mirrorMaterial = new BABYLON.StandardMaterial("mirrorMat", scene);
//    mirrorMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.25, 0.25);
//    mirrorMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirrorTex", 1024, scene, true);
//    const sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene, true);
//    sphere.material = mirrorMaterial;
//    sphere.position.y = 1;
//    sphere.setPhysicsState(BABYLON.PhysicsEngine.SphereImpostor, { "mass": 1, "friction": 0.2, "restitution": 0.3 });
//    sphere.checkCollisions = true;
//    const box = BABYLON.Mesh.CreateBox("box1", 2, scene, true);
//    box.material = mirrorMaterial;
//    box.position.y = 5;
//    box.position.x = 0.1;
//    //camera.applyGravity = true;
//    box.visibility = 2;
//    box.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, friction: 0.01, restitution: 0.5 });
//    box.checkCollisions = true;
//    const pos = camera.position.clone();
//    pos.y += 0.1;
//    const dir = camera.getTarget().subtract(camera.position);
//    //let ray = BABYLON.Mesh.CreateLines("foo", [pos.add(dir.scale(0.1)), pos.add(dir.scale(100))], scene, true);
//    //ray.parent = camera;
//    //ray.color = BABYLON.Color3.Red();
//    const ground = BABYLON.Mesh.CreateGround("ground1", 15, 15, 2, scene);
//    ground.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 0, friction: 0.1, restitution: 0.001 });
//    ground.checkCollisions = true;
//    addEventListener('keydown', e => {
//        if (e.ctrlKey) {
//            camera.setTarget(BABYLON.Vector3.Zero());
//        } else if (e.shiftKey) {
//            makeBullet(scene, mirrorMaterial, box, camera);
//        }
//    });
//    const meshes = [sphere, box];
//    scene.registerBeforeRender(() => {
//        for (let obj of meshes) {
//            // If object falls
//            if (obj.position.y < -10) {
//                obj.position = new BABYLON.Vector3(0, 50, 0);
//                //obj.updateBodyPosition();
//            }
//        }
//    });
//    return scene;
//} 
//# sourceMappingURL=app.js.map