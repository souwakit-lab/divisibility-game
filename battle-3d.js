import * as THREE from './three.module.min.js';
import { GLTFLoader } from './threejs/GLTFLoader.js';

const stage = document.querySelector('.battle-scene');
const canvas = document.getElementById('battle-3d-canvas');
if (stage && canvas && location.protocol !== 'file:') {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4,4,1.45,-1.45,.1,50);
  camera.position.set(0,1.35,9);camera.lookAt(0,1.35,0);
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  scene.add(new THREE.HemisphereLight(0xc8e6ff,0x182237,2.1));
  const key=new THREE.DirectionalLight(0xffedcf,3.1);key.position.set(-3,6,5);scene.add(key);
  const rim=new THREE.PointLight(0x41aaff,7,9);rim.position.set(2,2,-2);scene.add(rim);
  const fill=new THREE.PointLight(0xffa765,2.2,7);fill.position.set(2,1,3);scene.add(fill);
  let model;
  function resize(){
    const r=stage.getBoundingClientRect(),aspect=Math.max(.8,r.width/Math.max(r.height,1)),halfH=1.58;
    renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);
    camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();
  }
  new GLTFLoader().load('./outputs/blender/battle-characters.glb',gltf=>{
    model=gltf.scene;model.scale.setScalar(.75);
    const hero=model.getObjectByName('HERO | Seac Pai Van academy mage');
    const boss=model.getObjectByName('BOSS | Ember wyrm');
    model.updateMatrixWorld(true);
    for(const [root,targetX] of [[hero,-2.15],[boss,2.1]]) if(root){
      const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3());
      root.position.x+=(targetX-center.x)/model.scale.x;
    }
    scene.add(model);
    stage.classList.add('three-ready');
    document.querySelector('.hero-3d-wrap')?.style.setProperty('display','none','important');
    document.getElementById('battle-monster')?.style.setProperty('display','none','important');
  },undefined,error=>console.error('Blender character model failed to load',error));
  const clock=new THREE.Clock();
  function tick(){
    const t=clock.getElapsedTime();
    if(model){
      const hero=model.getObjectByName('HERO | Seac Pai Van academy mage');
      const boss=model.getObjectByName('BOSS | Ember wyrm');
      if(hero){hero.position.y=Math.sin(t*1.5)*.025;hero.rotation.z=Math.sin(t*.9)*.012;}
      if(boss){boss.position.y=Math.sin(t*1.25+1)*.022;boss.rotation.z=Math.sin(t*.8+1)*.009;}
    }
    renderer.render(scene,camera);requestAnimationFrame(tick);
  }
  new ResizeObserver(resize).observe(stage);resize();tick();
}
