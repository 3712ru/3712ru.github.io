// standard global variables
var container, scene, camera, renderer, controls, stats, parameters, levels;
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

var ration = {
    a: 1, minA: 1, maxA: 10,
    b: 1, minB: 1, maxB: 7,
    c: 1, minC: 1, maxC: 24,
    num: 1,minNum: 1,maxNum: 0
};

var guiFuncs = {
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
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0,-20,10);
    camera.lookAt(scene.position);	
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
    var incBtn = folder1.add(guiFuncs,'incBtn');
    var decBtn = folder1.add(guiFuncs,'decBtn');
    folder1.open();
    
    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,250,0);
    scene.add(light);
    // SKYBOX/FOG
    var skyBoxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
    var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x0d0d0d, side: THREE.BackSide } );
    var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    scene.add(skyBox);
    // AMBIENT LIGHT
    var ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);	
    // FOG
    //scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
    
    ////////////
    // CUSTOM //
    ////////////
    initLevels();
    mkAxis(scene);
    mkPointer(pointerName);

    for (i = 0; i < ration.maxNum; i++){
	var s = new THREE.Mesh(sphereGeom, green);
	s.visible = false;
	matrix.push(s);
	scene.add(s);
    }
    incRation();
    decRation();
}

function initLevels()
{
    levels = [];
    for (i = ration.minB; i <= ration.maxB; i++){
	levels.push(i);
    }
}

function mkAxis(scene)
{
    var xMat = new THREE.LineBasicMaterial( { color: 0xffa0a0, transparent: true, opacity: 0.5 } );;
    var yMat = new THREE.LineBasicMaterial( { color: 0xa0ffa0, transparent: true, opacity: 0.5 } );;

    var l7g = new THREE.Geometry();
    l7g.vertices.push( new THREE.Vector3(0,0,0));

    levels.forEach(function(n){
	var l5 = new THREE.CircleGeometry(n, ration.maxA/2);
	l5.vertices.shift();
	var l5v = l5.vertices.slice(0);
	ii = 0;

	var phi = (Math.sqrt(5) - 1) / 2;
	var r = (1 - phi) * n;
	var l5i = new THREE.CircleGeometry(r, ration.maxA/2);
	l5i.vertices.shift();
	l5i.vertices.forEach(function(v){
	    var ang = ((2*Math.PI) / 10) * 11;
	    var axis = new THREE.Vector3(0, 0, 1);
	    v.applyAxisAngle(axis, ang);
	});
//	var obj1 = new THREE.Line(l5i, yMat, THREE.LineStrip);
//	scene.add(obj1);
/*
	for (i = 0; i < ration.maxA; i++){
	    l5.vertices[i] = l5v[ii % ration.maxA];
	    ii += 2;
	}
*/	
	var l5g = new THREE.Geometry();
	var ii = 0;
	var iii = 0;
	for (i = 0; i < ration.maxA; i++){
	    var v;
	    if ((i % 2) == 0){
		v = l5.vertices[iii];
		iii++;
	    }else{
		v = l5i.vertices[ii];
		ii++;
	    }
	    l5g.vertices.push(v);
	}

	var obj = new THREE.Line(l5g, xMat, THREE.LineStrip);
	obj.name = "l5_" + n;
	scene.add(obj);

	// 7th
	l7g.vertices.push(new THREE.Vector3(0,0,n));
    });
    // 7th
    var obj = new THREE.Line(l7g, xMat, THREE.LineStrip);
    obj.name = "l7";
    scene.add(obj);
    // 5th internal

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

function updateAxis(scene)
{
    var l7 = scene.getObjectByName("l7");
    var axis = new THREE.Vector3( 0, 1, 0 );
    var angle = (2*Math.PI)/ration.maxC*(ration.c-1);
    var ng = new THREE.Geometry();
    
    ng.vertices.push(new THREE.Vector3(0,0,0));
    levels.forEach(function(n){
	var v = new THREE.Vector3(0,0,n);
	v.applyAxisAngle(axis, angle);
	ng.vertices.push(v);
    });
    l7.geometry.vertices = ng.vertices;
    l7.geometry.verticesNeedUpdate = true;    
}

function updatePointer(scene, from, to, sLat, sLon, eLat, eLon)
{
    var sr = unitRad*(from);
    var er = unitRad*(to);
    var ptr = scene.getObjectByName(pointerName);
    var sv = scene.getObjectByName("l5_" + ration.maxB).geometry.vertices[ration.a - 1];
    var tv = scene.getObjectByName("l7").geometry.vertices[ration.b];
    ptr.geometry.vertices[0] = sv;
    ptr.geometry.vertices[1] = tv;
    ptr.geometry.verticesNeedUpdate = true;


    var erp = ration.maxB+1;
    var projSphere =  new THREE.Sphere( new THREE.Vector3(0,0,0), (erp + 0.00001) );
    var ray = new THREE.Ray( sv, tv.clone().sub(sv).normalize());  
    var ivp = ray.intersectSphere(projSphere);
    var projPtr = scene.getObjectByName(projPointerName);
    projPtr.geometry.vertices[0] = tv;
    projPtr.geometry.vertices[1] = ivp;
    projPtr.geometry.verticesNeedUpdate = true;


    matrix[ration.num-1].position.x = ivp.x;
    matrix[ration.num-1].position.y = ivp.y;
    matrix[ration.num-1].position.z = ivp.z;

//    matrix[ration.num-1].position.x = tv.x;
//    matrix[ration.num-1].position.y = tv.y;
//    matrix[ration.num-1].position.z = tv.z;

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
	incRation();
    }
    if ( keyboard.pressed("z") ) 
    {
	decRation();
    }

    if ( keyboard.pressed("q") ) 
    {
	camera.position.set(-20,0,0);
    }
    if ( keyboard.pressed("w") ) 
    {
	camera.position.set(0,-20,0);
    }
    if ( keyboard.pressed("e") ) 
    {
	camera.position.set(0,0,20);
    }
   
    updateAxis(scene);
    
    updatePointer(scene, ration.b, ration.b, 0,0,0,0);
    controls.update();
    stats.update();
}

function render() 
{
    renderer.render( scene, camera );
}

