import Params from '../Params.mjs';
import * as THREE from 'three';
import { DragControls } from '../vendor/DragControls.js'
import { Object3D } from 'three';

const white = new THREE.Color(0xffffff);
const dockColor = new THREE.Color(0xa0a0a0);

export default {

    configured: false,
    dockRadius: 0.3,
    dockHeight: 1.8,
    /** @type {Object3D} */
    dock: null,

    startTime: null,
    lastUpdate: null,
    totalTime: null,
    domContainer: null,
    requestAnimationFrameId: null,
    started: false,

    fieldOfView: 45,
    cameraViewRadius: 1,
    cameraDistance: null,
    aspectRatio: 16/9,
    near: 0.1,
    far: 1000,

    /**
     * @type {THREE.WebGLRenderer}
     */
    renderer: null,
    scene: null,
    camera: null,
    /**
     * @type {DragControls}
     */
    controls: null,
    objects: [],

    dragstart: null,
    dragend: null,

    calculateAspectRatio() {
        this.aspectRatio = window.innerWidth / window.innerHeight;
    },

    configure() {
        this.configured = true;
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(this.fieldOfView, this.aspectRatio, this.near, this.far);
        
        this.calculateCameraDistance();
        this.camera.position.z = this.cameraDistance;

        if (!this.domContainer) this.domContainer = document.body;

        this.domContainer.appendChild(this.renderer.domElement);

        this.resize();

        window.addEventListener( 'resize', () => this.resize(), false );

        this.addDragListeners();
    },

    calculateCameraDistance() {
        this.cameraDistance = this.cameraViewRadius/Math.tan(2*Math.PI * (this.fieldOfView / 360)/2);
    },

    resize() {
        this.calculateAspectRatio();
        this.camera.aspect = this.aspectRatio;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.dock) {
            this.resetDockPosition();
        }
    },

    addLights() {
        const dirLight = new THREE.DirectionalLight(white, 0.5);
        dirLight.position.set(1, 2, 1);
        dirLight.target.position.set(0, 0, 0);
        this.scene.add(dirLight);
        this.scene.add(dirLight.target);

        const ambLight = new THREE.AmbientLight(white, 0.3);
        this.scene.add(ambLight);
    },

    addDock() {
        const geometry = new THREE.CylinderGeometry(this.dockRadius, this.dockRadius, this.dockHeight, 16);
        const material = new THREE.MeshBasicMaterial( {
            color: dockColor,
            transparent: true,
            opacity: 0.2
        } );
        this.dock = new THREE.Mesh( geometry, material );
        this.dock.name = 'dock';
        this.dock.renderOrder = 1;
        this.scene.add( this.dock );
        this.resetDockPosition();
    },

    resetDockPosition() {
        let x = this.aspectRatio - this.dockRadius;
        let angle = -Math.atan2(x, this.cameraDistance);
        
        this.dock.position.x = x;
        this.dock.rotation.y = angle;
        this.objects.filter(object => object.userData && object.userData.isOnDock)
            .forEach(object => {
                object.position.setX(x);
                object.userData.fixPosition();
            });
    },

    addDragListeners() {
        this.controls = new DragControls([], this.camera, this.renderer.domElement);

        this.controls.addEventListener( 'dragstart', e => {
            if (this.dragstart) {
                this.dragstart(e.object);
            }
        });
        
        this.controls.addEventListener( 'dragend', e => {
            if (this.dragend) {
                this.dragend(e.object);
            }
        } );
    },

    /**
     * @param {Object3D} object 
     */
    addObject(object) {
        this.objects.push(object);
        this.scene.add(object);
        this.controls.getObjects().push(object);
    },

    removeObject(object) {
        this.objects = this.objects.filter(x => x != object);
        const index = this.controls.getObjects().indexOf(object);
        if (index > -1) {
            this.controls.getObjects().splice(index, 1);
        }
        this.scene.remove(object);
    },

    start() {
        if (this.started) return;

        this.started = true;
        this.startTime = Date.now();

        this.objects.forEach(obj => this.removeObject(obj));
        this.scene.remove.apply(this.scene, this.scene.children);

        if (Params.value.lightningEnabled) {
            this.addLights();
        }
        this.addDock();

        this.loop();
    },

    resetTime() {
        this.startTime = Date.now();
    },

    stop() {
        if (!this.started) return;

        if (this.requestAnimationFrameId) {
            cancelAnimationFrame(this.requestAnimationFrameId);
        }
        this.started = false;
    },

    loop() {
        let now = Date.now();
        this.dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        this.totalTime = (this.lastUpdate - this.startTime) / 1000;

        this.requestAnimationFrameId = null;
        
        this.update();

        this.requestAnimationFrameId = requestAnimationFrame( () => this.loop() );
    },

    update() {

        this.animateObjects();
        
        this.renderer.render(this.scene, this.camera);
    },

    animateObjects() {

        this.scene.children.forEach(obj => {
            if (obj.userData && obj.userData.animate) {
                obj.userData.animate(this.dt, this.totalTime);
            }
        });
    },

    cancelDrag() {
        this.controls.deselect();
    },
}
