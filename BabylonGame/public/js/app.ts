/// <reference path="../../typings/tsd.d.ts" />
//import 'babylon';

type Pos = { w: number; h: number };

declare var io: {
    connect(url: string): SocketIO.Socket;
}

class Chapayev {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private dimensions: Pos;
    private checkers: BABYLON.Mesh[][];
    private tileSize: number;
    private colors: BABYLON.Color3[];
    private isBlack: boolean;
    private camera: BABYLON.FreeCamera;
    private turn = false;
    private gameOver = false;
    private mouseStart: number;

    private socket: SocketIO.Socket;
    constructor(dimensions = { w: 8, h: 8 }, tileSize = 1, colors = [new BABYLON.Color3(0.9, 0.9, 0.7), new BABYLON.Color3(0.4, 0.2, 0)]) {
        this.dimensions = dimensions;
        this.tileSize = tileSize;
        this.colors = colors;
        document.addEventListener("DOMContentLoaded", () => {
            if (!BABYLON.Engine.isSupported()) {
                throw new Error("babylon not supported");
            }
            this.init();
        }, false);
    }

    private init() {
        this.canvas = document.getElementsByTagName('canvas')[0];
        this.engine = new BABYLON.Engine(this.canvas, true);
        //this.engine.isPointerLock = true;
        this.initScene();
        this.engine.runRenderLoop(() => this.scene.render());
        this.socket = this.makeSocket();
        this.runGame();

        window.addEventListener("resize", e => this.engine.resize());
        this.scene.registerBeforeRender(this.beforeRender.bind(this)));
    }

    private initScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.enablePhysics(null, new BABYLON.OimoJSPlugin());
        //scene.clearColor = new BABYLON.Color3(0, 0, 0);
        this.camera = this.makeCamera();
        const canvas = this.engine.getRenderingCanvas();

        const board = this.makeBoard();
        const light = new BABYLON.PointLight("light1", this.camera.position, this.scene);
        light.intensity = 1;
        this.checkers = new Array<BABYLON.Mesh[]>();
        for (let c = 0; c < 2; ++c) {
            this.checkers.push(new Array<BABYLON.Mesh>());
            for (let i = 0; i < this.dimensions.w; ++i) {
                this.checkers[c].push(this.makeChecker({ w: i, h: c * this.dimensions.h }, c));
            }
        }
    }

    private makeSocket() {
        const socket = io.connect('localhost').on('color', data => {
            console.log(data);
            if (data === 1) {
                this.isBlack = true;
                this.camera.position.z = -this.camera.position.z;
                this.camera.setTarget(BABYLON.Vector3.Zero());
                this.turn = false;
            } else if (data === 0) {
                this.isBlack = false;
                this.turn = true;
            }
        }).on('action', data => {
            console.log(data);
            const mesh = this.scene.getMeshByUniqueID(data.mesh);
            console.log(mesh);
            const point = new BABYLON.Vector3(data.point.x, data.point.y, data.point.z);
            const force = new BABYLON.Vector3(data.force.x, data.force.y, data.force.z);
            mesh.applyImpulse(force, point);
            setTimeout(() => this.turn = true, 2000);
        });
        return socket;
    }

    private runGame() {
        window.addEventListener('mousedown', e => this.mouseStart = new Date().getTime());
        window.addEventListener('mouseup', this.mouseUp.bind(this));
        window.setInterval(this.checkWinner.bind(this), 50);
    }

    private beforeRender() {
        this.cursor();
    }

    private checkWinner() {
        if (this.gameOver) return;
        const checkersOnBoard = [0, 0];
        console.log(this.checkers);
        for (let s = 0; s < 2; ++s) {
            for (let checker of this.checkers[s]) {
                if (!checker.position) continue;
                const pos = checker.position;
                if (pos.y > -5 && Math.abs(pos.x) < 50 && Math.abs(pos.z) < 50) {
                    ++checkersOnBoard[s];
                }
            }
        }
        console.log(checkersOnBoard);
        let a = 0;
        for (let n of checkersOnBoard) {
            if (n > 0)++a;
        }
        if (a === 2) return;
        else if (a === 0) {
            alert("it's a draw!");
        } else if ((checkersOnBoard[0] + (this.isBlack ? 1 : 0)) % 2 === 1) {
            alert("you win!");
        } else {
            alert("you lose!");
        }
    }

    private cursor() {
        const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        if (!pickResult.hit) return this.canvas.style.cursor = null;
        const mesh = pickResult.pickedMesh;
        if (!this.turn) return this.canvas.style.cursor = 'not-allowed';
        const name = this.checkChecker(mesh);
        if (name === 'own') this.canvas.style.cursor = 'crosshair';
        else if (name === 'opponent') this.canvas.style.cursor = 'not-allowed';
        else this.canvas.style.cursor = null;
    }

    private checkChecker(mesh: BABYLON.AbstractMesh) {

        if (!mesh || !mesh.name || !mesh.name.includes('checker')) return null;
        const name = (this.isBlack ? 'black' : 'white') + ' checker';
        if (mesh.name.startsWith(name)) return 'own';
        return 'opponent';
    }

    private mouseUp(e: MouseEvent) {
        if (!this.turn) return;
        const strength = (new Date().getTime() - this.mouseStart) / 10;
        const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        if (!pickResult.hit) return null;
        const mesh = pickResult.pickedMesh;
        const name = this.checkChecker(mesh);
        if (name !== 'own') return;
        const point = pickResult.pickedPoint;
        const force = point.subtract(this.camera.position).normalize().scale(strength)
        mesh.applyImpulse(force, point);
        this.socket.emit('action', { mesh: mesh.uniqueId, point: point, force: force });
        this.turn = false;
    }

    private makeCamera() {
        const z = this.isBlack ? this.tileSize * this.dimensions.w : (-this.tileSize * this.dimensions.w);
        const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, z), this.scene);
        camera.keysUp.push(87);
        camera.keysDown.push(83);
        camera.keysLeft.push(65);
        camera.keysRight.push(68);
        //camera.inertia = 0;
        //camera.speed = 10;
        //camera.rotation = new BABYLON.Vector3(100, 100, 100);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(this.engine.getRenderingCanvas(), false);
        return camera;
    }

    private makeBoard() {
        const xmin = -this.dimensions.w * this.tileSize / 2;
        const zmin = xmin;
        const xmax = -xmin
        const zmax = xmax;
        const precision = { w: 2, h: 2 };
        const subdivisions = this.dimensions;
        const tiledGround = BABYLON.Mesh.CreateTiledGround('Board', xmin, zmin, xmax, zmax, subdivisions, precision, this.scene);

        const whiteMaterial = new BABYLON.StandardMaterial("White", this.scene);
        whiteMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        whiteMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirrorTex", 1024, this.scene, true);

        const blackMaterial = new BABYLON.StandardMaterial("Black", this.scene);
        blackMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        blackMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
        blackMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirrorTex", 1024, this.scene, true);

        const multimat = new BABYLON.MultiMaterial("multi", this.scene);
        multimat.subMaterials.push(whiteMaterial);
        multimat.subMaterials.push(blackMaterial);

        tiledGround.material = multimat;
        const verticesCount = tiledGround.getTotalVertices();
        const tileIndicesLength = tiledGround.getIndices().length / (subdivisions.w * subdivisions.h);

        tiledGround.subMeshes = [];
        let base = 0;
        for (let row = 0; row < subdivisions.h; ++row) {
            for (let col = 0; col < subdivisions.w; ++col) {
                tiledGround.subMeshes.push(new BABYLON.SubMesh(row % 2 ^ col % 2, 0, verticesCount, base, tileIndicesLength, tiledGround));
                base += tileIndicesLength;
            }
        }
        tiledGround.setPhysicsState(BABYLON.PhysicsEngine.PlaneImpostor, { mass: 0, friction: 0.5, restitution: 0.3 });
        tiledGround.checkCollisions = true;
        return tiledGround;
    }

    private makeChecker(tile: Pos, colorNum: number) {
        const diameter = this.tileSize * 0.75;
        const height = this.tileSize * 0.25;
        const name = `${colorNum === 0 ? 'white' : 'black'} checker ${tile.w} ${tile.h}`;
        const checker = BABYLON.Mesh.CreateCylinder(name, height, diameter, diameter, 16, 1, this.scene);
        checker.position = new BABYLON.Vector3(((this.dimensions.w - 1) / 2 - tile.w) * this.tileSize, height / 2, (colorNum * 2 - 1) * (this.dimensions.w - 1) / 2 * this.tileSize);
        checker.setPhysicsState(BABYLON.PhysicsEngine.CylinderImpostor, { mass: 0.01, friction: 0.5, restitution: 0.1 });
        checker.checkCollisions = true;
        const mat = new BABYLON.StandardMaterial("Mat", this.scene);
        mat.diffuseColor = this.colors[colorNum];
        mat.reflectionTexture = new BABYLON.MirrorTexture("mirrorTex", 1024, this.scene, true);
        checker.material = mat;
        return checker;
    }
}

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