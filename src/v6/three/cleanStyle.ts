/**
 * "깔끔한 일러스트" 스타일 (후처리): 질감 없음 · 흰 면 + 연한 중간톤 + 새까만 그림자 · 가늘고 균일한 검은 선 · 단색 배경.
 *
 * 쓰는 순서
 *   const lights = addCleanLights(scene)                       // 햇빛 1개 + 주변광
 *   prepareModel(gltfScene)                                    // 모델마다: 법선 다시 계산 + 흰 재질
 *   applyCleanMaterials(scene)                                 // 코드로 만든 사물까지: 모든 재질을 흰 Lambert로
 *   const clean = createCleanStyle(renderer, scene, camera, palette)
 *   // 렌더 루프에서 renderer.render(scene, camera) 대신: clean.render()
 *   // 창 크기가 바뀌면: clean.resize(cssWidth, cssHeight)
 *
 * 장면 준비 규칙
 *   - userData.keepMaterial = true : 재질을 바꾸지 않는다(검은 모니터 화면, 글자 스티커, 보이지 않는 그림자 막대, 빛 원뿔).
 *   - userData.noOutline  = true : 선 계산에서 뺀다(그 메시는 법선 패스에서 잠시 숨는다).
 *   - 질감(노이즈)·종이 느낌·선 흔들림은 넣지 않는다.
 */
import {
  Color, DepthTexture, DirectionalLight, DoubleSide, FrontSide, HemisphereLight, LinearSRGBColorSpace,
  Mesh, MeshLambertMaterial, MeshNormalMaterial, NoToneMapping, OrthographicCamera, PCFShadowMap, PlaneGeometry, Scene,
  ShaderMaterial, Vector2, WebGLRenderTarget, type BufferGeometry, type Material, type Object3D, type PerspectiveCamera,
  type WebGLRenderer,
} from 'three'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { CleanPalette } from '../theme'

/** 모든 값은 여기 한 곳 */
export const CLEAN = {
  /** 2배로 그려서 줄이는 방식 — 선이 또렷하다. CSS 크기는 화면 크기(100%) */
  pixelRatio: 2,
  /** 법선 차이 기준(작을수록 선이 많아짐). 개발용 ?tune 슬라이더 범위 min~max */
  edge: { threshold: 0.62, min: 0.3, max: 1.0, step: 0.01 },
  /** 선 두께(픽셀 단위 = 렌더 해상도 기준 1.5px) · 깊이 차이 기준(거리에 비례) */
  line: { px: 1.5, depth: 0.04 },
  /** 밝기 → 3톤: smoothstep(low, high) 결과가 midAt 미만 = 그림자, lightAt 미만 = 중간톤, 그 이상 = 밝은 면 */
  tone: { low: 0.12, high: 0.78, midAt: 0.3, lightAt: 0.72 },
  /** 모델 법선을 다시 계산할 때 이 각도 이상 꺾인 곳은 모서리(π/4) */
  creaseAngle: Math.PI / 4,
  sun: { color: 0xffffff, intensity: 3, position: [-300, 250, 260] as const, mapSize: 2048, range: 150, near: 10, far: 1000, bias: -0.0005, radius: 2 },
  hemi: { sky: 0xffffff, ground: 0xaaaaaa, intensity: 1.15 },
}

// ---------------------------------------------------------------- 재질·법선·빛

const cache = new Map<number, MeshLambertMaterial>()
/** 흰 Lambert(밝기만 계산). 안쪽 면이 보여야 하는 사물(머그)만 DoubleSide 사본을 쓴다 */
function whiteFor(side: number): MeshLambertMaterial {
  let m = cache.get(side)
  if (!m) cache.set(side, (m = new MeshLambertMaterial({ color: 0xffffff, side: side as typeof FrontSide })))
  return m
}

/** 장면의 모든 Mesh 재질을 흰 Lambert로 바꾸고 그림자를 켠다. keepMaterial 은 그대로 둔다 */
export function applyCleanMaterials(root: Object3D) {
  root.traverse((o) => {
    const m = o as Mesh
    if (!m.isMesh || m.userData.keepMaterial) return
    const src = (Array.isArray(m.material) ? m.material[0] : m.material) as Material | undefined
    m.material = whiteFor(src?.side === DoubleSide ? DoubleSide : FrontSide)
    m.castShadow = m.receiveShadow = true
  })
}

/** 모델의 법선을 지우고 toCreasedNormals(π/4)로 다시 계산한다 */
export function creaseNormals(root: Object3D) {
  root.traverse((o) => {
    const m = o as Mesh
    if (!m.isMesh || m.userData.keepMaterial) return
    const geo = m.geometry as BufferGeometry
    geo.deleteAttribute('normal')
    m.geometry = toCreasedNormals(geo, CLEAN.creaseAngle)
  })
}

/** 불러온 모델 한 개를 스타일에 맞게 준비한다 */
export function prepareModel(root: Object3D) {
  creaseNormals(root)
  applyCleanMaterials(root)
}

/** 햇빛(그림자 켬) + 주변광 */
export function addCleanLights(scene: Scene) {
  const { sun: s, hemi: h } = CLEAN
  const sun = new DirectionalLight(s.color, s.intensity)
  sun.position.set(s.position[0], s.position[1], s.position[2])
  sun.castShadow = true
  sun.shadow.mapSize.set(s.mapSize, s.mapSize)
  Object.assign(sun.shadow.camera, { left: -s.range, right: s.range, top: s.range, bottom: -s.range, near: s.near, far: s.far })
  sun.shadow.bias = s.bias
  sun.shadow.radius = s.radius
  const hemi = new HemisphereLight(h.sky, h.ground, h.intensity)
  scene.add(sun, hemi)
  return { sun, hemi }
}

// ---------------------------------------------------------------- 후처리

export function createCleanStyle(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, palette: CleanPalette) {
  renderer.outputColorSpace = LinearSRGBColorSpace
  renderer.toneMapping = NoToneMapping
  renderer.setPixelRatio(CLEAN.pixelRatio)
  renderer.shadowMap.enabled = true
  // 설치된 three 에서는 PCFSoftShadowMap 이 PCFShadowMap 으로 합쳐졌다(쓰면 경고만 나온다)
  renderer.shadowMap.type = PCFShadowMap
  scene.background = new Color(0x000000)

  // 색 + 깊이(A) · 법선(B)
  const depth = new DepthTexture(1, 1)
  const rtA = new WebGLRenderTarget(1, 1, { depthTexture: depth })
  const rtB = new WebGLRenderTarget(1, 1)
  const normalMat = new MeshNormalMaterial()

  // 출력이 Linear 라서 셰이더에 넣는 색은 sRGB → 선형 변환 값을 쓴다
  const toShader = (hex: string) => new Color(hex).convertLinearToSRGB()
  const t = CLEAN.tone

  const material = new ShaderMaterial({
    uniforms: {
      tC: { value: rtA.texture }, tN: { value: rtB.texture }, tD: { value: depth },
      res: { value: new Vector2(1, 1) },
      cDark: { value: toShader(palette.dark) }, cMid: { value: toShader(palette.mid) },
      cLight: { value: toShader(palette.light) }, cBg: { value: toShader(palette.bg) },
      near: { value: camera.near }, far: { value: camera.far },
      eThr: { value: CLEAN.edge.threshold },
      lineW: { value: CLEAN.line.px }, depthEdge: { value: CLEAN.line.depth },
      tLow: { value: t.low }, tHigh: { value: t.high }, tMid: { value: t.midAt }, tLit: { value: t.lightAt },
    },
    vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: /* glsl */ `precision highp float;varying vec2 v;
      uniform sampler2D tC,tN,tD;uniform vec2 res;uniform vec3 cDark,cMid,cLight,cBg;
      uniform float near,far,eThr,lineW,depthEdge,tLow,tHigh,tMid,tLit;
      float ld(vec2 p){float z=texture2D(tD,p).r*2.-1.;return 2.*near*far/(far+near-z*(far-near));}
      void main(){
        vec3 c=texture2D(tC,v).rgb; float l=dot(c,vec3(.299,.587,.114));
        float t0=smoothstep(tLow,tHigh,l);
        vec3 col=t0<tMid?cDark:(t0<tLit?cMid:cLight);          // 3톤, 경계는 딱 떨어지게
        vec2 px=lineW/res; float d0=ld(v); vec3 n0=texture2D(tN,v).rgb; float e=0.;
        for(int i=0;i<4;i++){
          vec2 o=i==0?vec2(px.x,0.):i==1?vec2(-px.x,0.):i==2?vec2(0.,px.y):vec2(0.,-px.y);
          e+=step(eThr,length(texture2D(tN,v+o).rgb-n0));       // 법선 차이 → 모서리 선
          e+=step(depthEdge*d0,abs(ld(v+o)-d0));                // 깊이 차이 → 윤곽선
        }
        col=mix(col,cDark,step(.5,e));                          // 선은 단색
        if(texture2D(tD,v).r>.9999) col=cBg;                    // 아무것도 없는 곳은 배경색
        gl_FragColor=vec4(col,1.);
      }`,
  })
  const quadScene = new Scene()
  quadScene.add(new Mesh(new PlaneGeometry(2, 2), material))
  const quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const hidden: Object3D[] = []

  /** css 크기를 넘기면 렌더 해상도는 × pixelRatio */
  function resize(w: number, h: number) {
    const pr = renderer.getPixelRatio()
    renderer.setSize(w, h, false)
    rtA.setSize(w * pr, h * pr)
    rtB.setSize(w * pr, h * pr)
    material.uniforms.res.value.set(w * pr, h * pr)
  }

  function render() {
    material.uniforms.near.value = camera.near
    material.uniforms.far.value = camera.far
    // 1) 색 + 깊이
    renderer.setRenderTarget(rtA)
    renderer.render(scene, camera)
    // 2) 법선(선 계산용) — noOutline 객체는 잠시 숨긴다
    hidden.length = 0
    scene.traverse((o) => {
      if (o.visible && o.userData.noOutline) {
        o.visible = false
        hidden.push(o)
      }
    })
    scene.overrideMaterial = normalMat
    renderer.setRenderTarget(rtB)
    renderer.render(scene, camera)
    scene.overrideMaterial = null
    hidden.forEach((o) => (o.visible = true))
    // 3) 세 톤 + 선 + 배경을 한 장으로
    renderer.setRenderTarget(null)
    renderer.render(quadScene, quadCam)
  }

  function setPalette(p: CleanPalette) {
    material.uniforms.cDark.value.copy(toShader(p.dark))
    material.uniforms.cMid.value.copy(toShader(p.mid))
    material.uniforms.cLight.value.copy(toShader(p.light))
    material.uniforms.cBg.value.copy(toShader(p.bg))
  }

  /** 법선 차이 기준(0.3 ~ 1.0, 작을수록 선이 많아짐) */
  function setEdge(threshold: number) {
    material.uniforms.eThr.value = threshold
  }

  function dispose() {
    rtA.dispose()
    rtB.dispose()
    depth.dispose()
    material.dispose()
    normalMat.dispose()
  }

  return { render, resize, setPalette, setEdge, dispose }
}

/** 빛 원뿔·그림자 막대·모니터 검은 평면·글자 스티커처럼 선 계산과 재질 교체에서 빠져야 하는 메시에 붙인다 */
export const markFx = (o: Object3D) => {
  o.userData.noOutline = true
  o.userData.keepMaterial = true
}
