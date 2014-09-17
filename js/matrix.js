/*
  Three.js "tutorials by example"
  Author: Lee Stemkoski
  Date: July 2013 (three.js v59dev)
*/

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats, parameters;
var keyboard = new THREEx.KeyboardState();
//var keyboard = new KeyboardState();
var clock = new THREE.Clock();
// custom global variables
var cube;

var projPtrMat = new THREE.MeshBasicMaterial( { color: 0xff00ff, transparent: true, opacity: 0.8 } );

var unitRad = 1.0;
var gui;

var matrix = [];


var sphereGeom =  new THREE.IcosahedronGeometry( unitRad, 3 );
var torusGeom =  new THREE.TorusGeometry( unitRad, unitRad/100, 24, 48 );
var red   = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0.5 } );
var green = new THREE.MeshBasicMaterial( { color: 0x00ff00, transparent: true, opacity: 0.2 } );
var blue  = new THREE.MeshBasicMaterial( { color: 0x0000ff, transparent: true, opacity: 0.2 } );
var pointerName = "pointer";
var projPointerName = "projPointer";

var sLat = 0;
var sLon = 0;

var eLat = 0;
var eLon = 0;

var ration = {a: 1, minA: 1, maxA: 5,
	      b: 1, minB: 1, maxB: 7,
	      c: 1, minC: 1, maxC: 12,
	      num: 1,minNum: 1,maxNum: 0,
	      incBtn: function(){ incRation(); },
	      decBtn: function(){ decRation(); }
	     };

ration.maxNum = calcMaxNum();

init();
animate();

function calcMaxNum()
{
    var r = {a: 0, b: 0, c: 0};
    var nMin = Math.max(ration.maxA, ration.maxB, ration.maxC);
    for (n = 1;; n++){
	r.a += 1;
	r.b += 1;
	r.c += 1;
	r.a %= ration.maxA;
	r.b %= ration.maxB;
	r.c %= ration.maxC;
	if (r.a == r.b && r.b == r.c && n > nMin){
	    return n;
	}
    }
}

// FUNCTIONS 		
function init() 
{
    // SCENE
    scene = new THREE.Scene();
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    //camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    var oZoom = 40;
    camera = new THREE.OrthographicCamera( (window.innerWidth / - 2) /oZoom, (window.innerWidth / 2) /oZoom, (window.innerHeight / 2) /oZoom, (window.innerHeight / - 2) /oZoom, -50, 50 );
    //camera = new THREE.OrthographicCamera( -10, 10, -10, 10, -10, 10 );
    //camera.updateProjectionMatrix();
    scene.add(camera);
    //	camera.position.set(0,150,400);
    camera.position.set(0,1,0);
//    camera.lookAt(scene.position);	
    // RENDERER
    if ( Detector.webgl )
	renderer = new THREE.WebGLRenderer( {antialias:true} );
    else
	renderer = new THREE.CanvasRenderer(); 
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container = document.getElementById( 'ThreeJS' );
    container.appendChild( renderer.domElement );
    // EVENTS
    THREEx.WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
    // CONTROLS
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild( stats.domElement );
    // GUI
    gui = new dat.GUI();
    gui.width = 200;
    var folder1 = gui.addFolder('Params');
    var rationA = folder1.add( ration, 'a' ).min(ration.minA).max(ration.maxA).step(1).listen();
    var rationB = folder1.add( ration, 'b' ).min(ration.minB).max(ration.maxB).step(1).listen();
    var rationC = folder1.add( ration, 'c' ).min(ration.minC).max(ration.maxC).step(1).listen();
    var rationNumber = folder1.add( ration, 'num' ).min(ration.minNum).max(ration.maxNum).step(1).listen();
    var incBtn = folder1.add(ration,'incBtn');
    var decBtn = folder1.add(ration,'decBtn');
    folder1.open();

    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,250,0);
    scene.add(light);
    // FLOOR
    var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
    floorTexture.repeat.set( 10, 10 );
    var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    //scene.add(floor);
    // SKYBOX/FOG
    var skyBoxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
    var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x0d0d0d, side: THREE.BackSide } );
    var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    //scene.add(skyBox);
    //scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
    
    ////////////
    // CUSTOM //
    ////////////
    
    mkAxis(scene);
    mkLevels(scene);

    mkPointer(pointerName);

    for (i = 0; i < ration.maxNum; i++){
	var s = new THREE.Mesh(sphereGeom, green);
	//var s = new THREE.Mesh(torusGeom, green);
	s.visible = false;
	matrix.push(s);
	scene.add(s);
    }

    var ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);	

    incRation();
    decRation();
}

function a2r(grad)
{
    return ((grad % 360) * Math.PI / 180);
}

function pointOnSphereG(radius, lat, lon)
{
    return (pointOnSphereR(radius, a2r(lat), a2r(lon)));
}

function pointOnSphereR(radius, lat, lon)
{
    var latCos = Math.cos(lat);
    var latSin = Math.sin(lat);
    return (new THREE.Vector3(
	radius * Math.cos(lat) * Math.sin(lon),
	radius * Math.sin(lat) * Math.sin(lon),
	radius * Math.cos(lon)));
}

function mkPointer(pName)
{
    var geometry = new THREE.Geometry();
    geometry.vertices.push( new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0) );
    var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffffff } ));
    line.name = pointerName;
    scene.add( line );

    var projGeometry = new THREE.Geometry();
    projGeometry.vertices.push( new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0) );
    var projLine = new THREE.Line( projGeometry, new THREE.LineBasicMaterial( { color: 0xff00ff } ));
    projLine.name = projPointerName;
    scene.add( projLine );
}

function updatePointer(scene, from, to, sLat, sLon, eLat, eLon)
{
    var sr = unitRad*(from);
    var er = unitRad*(to);
    var sv = pointOnSphereG(sr, sLat, sLon);
    var ev = pointOnSphereG(er, eLat, eLon);//.sub(sv); 
    var sphere =  new THREE.Sphere( new THREE.Vector3(0,0,0), sr);//(unitRad*to + 0.00001) );
    var ev1 = ev.clone().sub(sv).normalize();
    var ray = new THREE.Ray( sv, ev1);//ev.normalize());
    var iv = ray.intersectSphere(sphere);
    var ptr = scene.getObjectByName(pointerName);
    ptr.geometry.vertices[0] = sv;
    ptr.geometry.vertices[1] = ev;
    ptr.geometry.verticesNeedUpdate = true;


    var erp = unitRad*(ration.maxB+1);
//    var evp = pointOnSphereG(erp, eLat, eLon);//.sub(ev);
    var projSphere =  new THREE.Sphere( new THREE.Vector3(0,0,0), (erp + 0.00001) );
    var ivp = ray.intersectSphere(projSphere);
    var projPtr = scene.getObjectByName(projPointerName);
    projPtr.geometry.vertices[0] = ev;
    projPtr.geometry.vertices[1] = ivp;
    projPtr.geometry.verticesNeedUpdate = true;

    matrix[ration.num-1].position.x = ivp.x;
    matrix[ration.num-1].position.y = ivp.y;
    matrix[ration.num-1].position.z = ivp.z;

//    matrix[ration.num-1].position.x = iv.x;
//    matrix[ration.num-1].position.y = iv.y;
//    matrix[ration.num-1].position.z = iv.z;

    matrix.forEach(function(s, i){
	if (i < ration.num){
	    s.visible = true;
	}else{
	    s.visible = false;
	}
    });
}

function mkLevels(scene)
{
    var sphereGeom =  new THREE.SphereGeometry( unitRad*(ration.maxB+1), 24, 24 );
//    scene.add(new THREE.Mesh( sphereGeom, blue));
    for(i = 0; i < ration.maxB; i++){
	var torusGeom =  new THREE.TorusGeometry( unitRad*(i+1), unitRad/100, 5, ration.maxA );
	var lvlSphere = new THREE.Mesh( torusGeom.clone(), red );
	scene.add(lvlSphere);
    }
}

function mkAxis(scene)
{
    var xTorusGeom =  new THREE.TorusGeometry( unitRad, unitRad/100, 12, ration.maxA );
    var yTorusGeom =  new THREE.TorusGeometry( unitRad, unitRad/100, 24, ration.maxB );
    var zTorusGeom =  new THREE.TorusGeometry( unitRad, unitRad/100, 24, ration.maxC );
    var xMat = new THREE.MeshBasicMaterial( { color: 0xffa0a0, transparent: true, opacity: 0.5 } );;
    var yMat = new THREE.MeshBasicMaterial( { color: 0xa0ffa0, transparent: true, opacity: 0.5 } );;
    var zMat = new THREE.MeshBasicMaterial( { color: 0xa0a0ff, transparent: true, opacity: 0.5 } );;
    var xAxis = new THREE.Mesh( xTorusGeom.clone(), xMat );
    var yAxis = new THREE.Mesh( yTorusGeom.clone(), yMat );
    var zAxis = new THREE.Mesh( zTorusGeom.clone(), zMat );

//    xAxis.rotation.z = a2r(27.5);
    yAxis.rotation.x = Math.PI / 2;
    zAxis.rotation.y = Math.PI / 2;
    scene.add( xAxis );
    scene.add( yAxis );
    scene.add( zAxis );
}

function mkMatrix(scene, geom, mat)
{
    var radStep = 1.0;
    var radStart = 1.0;
    var lvlsCount = 10;
    var objRad = unitRad;

    var outlineMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.BackSide, transparent: true, opacity: 0.7 } );

    for (l = 1; l <= lvlsCount; l++){
	var objCount = 3+l*3;
	for (i = 0; i <= objCount-1; i++){
	    var angStep = Math.PI*2/objCount;
	    var obj = new THREE.Mesh( geom.clone(), mat );
	    obj.rotation.x = Math.PI/2;
	    var x = Math.cos(angStep*i)*objRad*(l+1);
	    var y = Math.sin(angStep*i)*objRad*(l+1);
	    var z = i*(objRad/objCount) + ((l-1) * objRad);
	    obj.position.set(x, z, y);
	    scene.add( obj );
	}
    }
}

function animate() 
{
    requestAnimationFrame( animate );

    render();		
    update();
}

function setRation(num)
{
    ration.a = (num % (ration.maxA));
    ration.b = (num % (ration.maxB));
    ration.c = (num % (ration.maxC));
    if (ration.a == 0){ ration.a = ration.maxA; }
    if (ration.b == 0){ ration.b = ration.maxB; }
    if (ration.c == 0){ ration.c = ration.maxC; }
}


function incRation()
{
    if (ration.num < ration.maxNum){
	ration.num += 1;
	setRation(ration.num);
    }
}

function decRation()
{
    if (ration.num > ration.minNum){
	ration.num -= 1;
	setRation(ration.num);
    }
}

function update()
{
    if ( keyboard.pressed("x") ) 
    {
	if (ration.num < ration.maxNum){
	    incRation();
	}
    }
    if ( keyboard.pressed("z") )
    {
	if (ration.num > ration.minNum){
	    decRation();
	}
    }
    if ( keyboard.pressed("q") ){
	camera.position.set(1,0,0);
    }
    if ( keyboard.pressed("w") ){
	camera.position.set(0,1,0);
    }
    if ( keyboard.pressed("e") ){
	camera.position.set(0,0,1);
    }
    
    from = ration.maxB; //(ration.num % 2 == 0) ? ration.maxB : 5;
    to = ration.b;
    sLat = (ration.a) * (360/ration.maxA) + 90;
    sLon = 90;// + (ration.a) * (360/ration.maxA);    
    eLat = 0;//(ration.b * 360/ration.maxB) + 90;
    eLon = (ration.c - 1) * (360/ration.maxC);
    updatePointer(scene, from, to, sLat, sLon, eLat, eLon);

    controls.update();
    stats.update();
}

function render() 
{
    renderer.render( scene, camera );
}

