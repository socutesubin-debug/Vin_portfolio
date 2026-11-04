/**
 * VIN 듀오톤 스타일 (two colors + outline + paper grain)
 * 어떤 three.js 장면에도 붙일 수 있는 후처리 모듈.
 *
 * 사용법
 *   import { createDuotone, applyWhiteMaterials } from './duotoneStyle';
 *   applyWhiteMaterials(scene);                       // 모든 사물을 흰 재질로 (밝기만 계산)
 *   const duo = createDuotone(renderer, scene, camera, { dark: THEME.dark, light: THEME.light });  // 색은 theme.ts
 *   // 렌더 루프에서 renderer.render(scene, camera) 대신:
 *   duo.render(time);
 *   // 창 크기 바뀔 때:
 *   duo.resize(innerWidth, innerHeight);
 *
 * 장면 준비 규칙
 *   - 빛: DirectionalLight 1개(그림자 켜기, 강하게) + HemisphereLight(0.6~1.0). 그림자가 진한 색이 된다.
 *   - renderer.shadowMap.enabled = true, 사물마다 castShadow / receiveShadow = true.
 *   - 배경(scene.background)은 검정 → 진한 색으로 바뀐다. 밝은 바닥/벽은 흰 면으로 두면 연한 색이 된다.
 *   - 빛 원뿔·화면처럼 외곽선에서 빼고 싶은 메시는 mesh.userData.noOutline = true.
 *   - 화면 글자처럼 색을 그대로 보여줄 요소는 이 스타일 밖(HTML 오버레이)으로 그리는 게 좋다.
 */
import * as THREE from 'three';

export interface DuotoneOptions {
  dark: string;            // 그림자·배경 색
  light: string;           // 밝은 면 색
  outline?: boolean;       // 외곽선 (기본 true)
  grain?: boolean;         // 종이 질감 (기본 true)
  steps?: number;          // 음영 단계감 (기본 5, 0이면 부드럽게)
  low?: number;            // 이 밝기 이하는 완전히 진한 색 (기본 0.12)
  high?: number;           // 이 밝기 이상은 완전히 연한 색 (기본 0.78)
  grainAmt?: number;       // 종이 질감 세기 0~1 (기본 0.35). 움직이지 않는 정적 질감
  edgeThreshold?: number;  // 외곽선이 생기는 법선 차이 기준 (기본 0.62). 작을수록 선이 많아짐
}

/** 장면의 모든 메시를 흰 Lambert 재질로 바꾼다. 원래 밝기 차이를 조금 남기려면 keepTone=true */
export function applyWhiteMaterials(scene: THREE.Object3D, keepTone = true) {
  const cache = new Map<number, THREE.MeshLambertMaterial>();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.keepMaterial) return;
    const src = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
    let v = 1;
    if (keepTone && src && (src as any).color) {
      const c = (src as any).color as THREE.Color;
      v = Math.max(0.35, Math.min(1, 0.299 * c.r + 0.587 * c.g + 0.114 * c.b + 0.25));
    }
    const key = Math.round(v * 20);
    if (!cache.has(key)) cache.set(key, new THREE.MeshLambertMaterial({ color: new THREE.Color(v, v, v), side: src?.side ?? THREE.FrontSide }));
    m.material = cache.get(key)!;
    m.castShadow = m.receiveShadow = true;
  });
}

export function createDuotone(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, opts: DuotoneOptions) {
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const depthTex = new THREE.DepthTexture(1, 1);
  const rtColor = new THREE.WebGLRenderTarget(1, 1, { depthTexture: depthTex });
  const rtNormal = new THREE.WebGLRenderTarget(1, 1);
  const normalMat = new THREE.MeshNormalMaterial();

  const toLinear = (hex: string) => new THREE.Color(hex).convertLinearToSRGB();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tC: { value: rtColor.texture }, tN: { value: rtNormal.texture }, tD: { value: depthTex },
      res: { value: new THREE.Vector2() },
      cDark: { value: toLinear(opts.dark) }, cLight: { value: toLinear(opts.light) },
      near: { value: camera.near }, far: { value: camera.far },
      edge: { value: opts.outline === false ? 0 : 1 }, grain: { value: opts.grain === false ? 0 : 1 },
      steps: { value: opts.steps ?? 5 }, low: { value: opts.low ?? 0.12 }, high: { value: opts.high ?? 0.78 },
      time: { value: 0 },
      gAmt: { value: opts.grainAmt ?? 0.35 }, eThr: { value: opts.edgeThreshold ?? 0.62 },
    },
    vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `precision highp float;varying vec2 v;
      uniform sampler2D tC,tN,tD;uniform vec2 res;uniform vec3 cDark,cLight;
      uniform float near,far,edge,grain,steps,low,high,time,gAmt,eThr;
      float ld(vec2 p){float z=texture2D(tD,p).r*2.-1.;return 2.*near*far/(far+near-z*(far-near));}
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){
        vec3 c=texture2D(tC,v).rgb;float l=dot(c,vec3(.299,.587,.114));
        float t=smoothstep(low,high,l);
        if(steps>0.){t=floor(t*steps+.5)/steps*.35+t*.65;}
        vec3 col=mix(cDark,cLight,t);
        if(edge>.5){vec2 px=2./res;float d0=ld(v);vec3 n0=texture2D(tN,v).rgb;float e=0.;
          for(int i=0;i<4;i++){vec2 o=i==0?vec2(px.x,0.):i==1?vec2(-px.x,0.):i==2?vec2(0.,px.y):vec2(0.,-px.y);
            e+=step(eThr,length(texture2D(tN,v+o).rgb-n0));e+=step(.04*d0,abs(ld(v+o)-d0));}
          col=mix(col,cDark,clamp(e*.4,0.,.8));}
        if(grain>.5){col+=(h(floor(v*res/2.5))-.5)*.09*gAmt;col+=(h(floor(v*res/9.))-.5)*.05*gAmt;}
        gl_FragColor=vec4(col,1.);}`,
  });
  const quadScene = new THREE.Scene();
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const hidden: THREE.Object3D[] = [];
  function resize(w: number, h: number) {
    const pr = renderer.getPixelRatio();
    renderer.setSize(w, h, false);
    rtColor.setSize(w * pr, h * pr);
    rtNormal.setSize(w * pr, h * pr);
    material.uniforms.res.value.set(w * pr, h * pr);
  }
  function render(timeSec = 0) {
    material.uniforms.time.value = Math.floor(timeSec * 12) / 12;
    material.uniforms.near.value = camera.near;
    material.uniforms.far.value = camera.far;
    // 1) 밝기 + 깊이
    renderer.setRenderTarget(rtColor);
    renderer.render(scene, camera);
    // 2) 노멀 (외곽선용) — noOutline 메시는 잠시 숨김
    hidden.length = 0;
    scene.traverse((o) => { if (o.visible && o.userData.noOutline) { o.visible = false; hidden.push(o); } });
    scene.overrideMaterial = normalMat;
    renderer.setRenderTarget(rtNormal);
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    hidden.forEach((o) => (o.visible = true));
    // 3) 두 색으로 합성
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCam);
  }
  function setPalette(dark: string, light: string) {
    material.uniforms.cDark.value.copy(toLinear(dark));
    material.uniforms.cLight.value.copy(toLinear(light));
  }
  function setOptions(o: Partial<DuotoneOptions>) {
    if (o.outline !== undefined) material.uniforms.edge.value = o.outline ? 1 : 0;
    if (o.grain !== undefined) material.uniforms.grain.value = o.grain ? 1 : 0;
    if (o.steps !== undefined) material.uniforms.steps.value = o.steps;
    if (o.low !== undefined) material.uniforms.low.value = o.low;
    if (o.high !== undefined) material.uniforms.high.value = o.high;
    if (o.grainAmt !== undefined) material.uniforms.gAmt.value = o.grainAmt;
    if (o.edgeThreshold !== undefined) material.uniforms.eThr.value = o.edgeThreshold;
  }
  function dispose() { rtColor.dispose(); rtNormal.dispose(); depthTex.dispose(); material.dispose(); normalMat.dispose(); }

  resize(innerWidth, innerHeight);
  return { render, resize, setPalette, setOptions, dispose };
}

/** 빛 원뿔(스탠드 불빛)을 만든다. 외곽선에서 자동 제외. */
export function makeLightCone(radius = 17, height = 40, opacity = 0.42) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 40, 1, true), mat);
  cone.userData.noOutline = true;
  cone.castShadow = false;
  return cone;
}

/** 블라인드 그림자: 보이지 않고 그림자만 드리우는 막대들 */
export function makeBlinds(count = 7, gap = 16, width = 120, slat = 3) {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  for (let i = 0; i < count; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(2, slat, width), m);
    s.position.y = i * gap;
    s.castShadow = true;
    s.userData.noOutline = true;
    g.add(s);
  }
  return g;
}

// 팔레트(색 값)는 src/v6/theme.ts 한 곳에서 관리한다
