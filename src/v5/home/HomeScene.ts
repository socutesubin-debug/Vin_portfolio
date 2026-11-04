import {
  ACESFilmicToneMapping, Box3, BoxGeometry, BufferGeometry, CanvasTexture, Color, DirectionalLight, DoubleSide, GridHelper,
  Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshStandardMaterial, Object3D, PCFShadowMap,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, Raycaster, RGBADepthPacking, Scene, ShadowMaterial, SpotLight, SRGBColorSpace,
  TextureLoader, Vector2, Vector3, WebGLRenderer, SphereGeometry, ShaderMaterial, Matrix4, MathUtils, type Material, type Texture,
} from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { gsap } from 'gsap'
import { coverRect, HOME_BG, HOME_LIGHT, HOME_POINTER, IMAC_FOCUS, MUG, photoCamera, PROPS, TABLE, type Placement, type PropId } from './config'

/**
 * Home 3D 장면 — 사진(V6 배경, HTML img) 위에 투명 캔버스로 겹친다.
 *
 * 'composite'(기본): 사진을 '사진을 찍은 카메라'(photoCam, 고정)에서 벽 면(z = 0)·책상 면(y = 0)에 투사한다(셰이더).
 *   화면을 그리는 카메라는 같은 자리에서 시작해 포인터를 따라 조금 움직이므로(V4 HOME과 같은 값)
 *   책상·사물·블라인드 벽 사이에 실제 시차가 생긴다. 구도(확대·자르기)는 HTML 배경과 같은 coverRect를 setViewOffset으로.
 *   책상 윗면에는 ShadowMaterial 평면을 겹쳐 소품 그림자를 떨어뜨린다.
 * 'layout'(?view=layout): 배경을 빼고 table.obj를 보이게 한 뒤 비스듬히 내려다본다.
 *
 * 좌표: 책상 윗면 y = 0, 뒤 모서리(벽 쪽) z = 0, 앞으로 +z, 가운데 x = 0. 단위 m.
 * OBJ에는 재질 파일(.mtl)이 없어 임시 재질을 쓴다(아래 MATERIALS).
 */
export type HomeMode = 'composite' | 'layout'

interface Options {
  reducedMotion: boolean
  onPick?: (p: PropId) => void
  onHover?: (p: PropId | null) => void
  onProgress?: (ratio: number) => void
}

const LAYOUT_VIEW = { pos: new Vector3(1.6, 1.3, 2.4), look: new Vector3(0, -0.15, 0.3), fov: 40 }

/** 임시 재질(원본 .mtl 없음) */
const MAT = {
  imac: new MeshStandardMaterial({ color: '#4b4d53', metalness: 0.55, roughness: 0.38 }),
  lampMetal: new MeshStandardMaterial({ color: '#cfd2d6', metalness: 0.9, roughness: 0.25 }),
  lampPlastic: new MeshStandardMaterial({ color: '#2a2b2e', metalness: 0.1, roughness: 0.45, side: DoubleSide }),
  wire: new MeshStandardMaterial({ color: '#1b1b1d', roughness: 0.6 }),
  phone: new MeshStandardMaterial({ color: '#c62e22', roughness: 0.35, metalness: 0.05 }),
  penBody: new MeshStandardMaterial({ color: '#141416', roughness: 0.22, metalness: 0.2 }),
  penTrim: new MeshStandardMaterial({ color: '#c9a45a', roughness: 0.25, metalness: 1 }),
  paper: new MeshStandardMaterial({ color: '#f6f5f1', roughness: 0.92 }),
}

export class HomeScene {
  readonly ready: Promise<void>
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera: PerspectiveCamera
  private photo = photoCamera()
  private props = new Map<PropId, Group>()
  private anchorPoints = new Map<PropId, Vector3>()
  private anchors = new Map<PropId, HTMLElement>()
  private pickables: Object3D[] = []
  private table: Object3D | null = null
  private layoutExtras = new Group()
  private shadowPlane: Mesh
  private lampLight: SpotLight | null = null
  private lampOn = false
  /** 사진 위 책상은 그림자만 받으므로, 켜진 빛은 책상 위 따뜻한 빛 번짐과 전구 발광으로 보여 준다 */
  private lampGlow: Mesh[] = []
  private topSheet: Object3D | null = null
  private screenMat: MeshBasicMaterial | null = null
  private ray = new Raycaster()
  private ndc = new Vector2()
  private ro: ResizeObserver
  private tl: gsap.core.Timeline | null = null
  private mode: HomeMode = 'composite'
  private focused = false
  private hovered: PropId | null = null
  private photoCam: PerspectiveCamera
  private photoPlanes = new Group()
  /** 포인터 카메라: 기준 위치·주시점, 감쇠된 포인터 값 */
  private base = { pos: new Vector3(), look: new Vector3() }
  private offset = { x: 0, y: 0 }
  private pointer = { x: 0, y: 0, inside: false }
  private canHover = window.matchMedia('(hover: hover) and (pointer: fine)')
  private last = performance.now()
  private loader = new OBJLoader()
  private container: HTMLElement
  private opts: Options

  constructor(container: HTMLElement, opts: Options) {
    this.container = container
    this.opts = opts
    const r = (this.renderer = new WebGLRenderer({ antialias: true, alpha: true }))
    r.setClearColor(0x000000, 0)
    r.setPixelRatio(Math.min(devicePixelRatio, 2))
    r.outputColorSpace = SRGBColorSpace
    r.toneMapping = ACESFilmicToneMapping
    r.toneMappingExposure = 1.05
    r.shadowMap.enabled = true
    r.shadowMap.type = PCFShadowMap
    r.domElement.className = 'v5-canvas'
    container.appendChild(r.domElement)

    this.camera = new PerspectiveCamera(this.photo.fov, this.photo.aspect, 0.02, 30)
    this.photoCam = new PerspectiveCamera(this.photo.fov, this.photo.aspect, 0.02, 30)
    this.photoCam.position.set(0, this.photo.height, this.photo.z)
    this.photoCam.lookAt(0, this.photo.height, 0)
    this.photoCam.updateMatrixWorld()
    this.base.pos.copy(this.photoCam.position)
    this.base.look.set(0, this.photo.height, 0)
    // 금속(iMac·스탠드)이 비칠 밝은 실내 환경
    const pm = new PMREMGenerator(r)
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.6
    pm.dispose()

    const { sun, sky } = HOME_LIGHT
    this.scene.add(new HemisphereLight(sky.color, sky.ground, sky.intensity))
    const key = new DirectionalLight(sun.color, sun.intensity)
    key.position.set(...sun.position)
    key.target.position.set(0, 0, 0.3)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 1.2, bottom: -1.2, near: 0.5, far: 8 })
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.012
    this.scene.add(key, key.target)

    // 책상 윗면: 그림자만 받는 투명 평면
    this.shadowPlane = new Mesh(new PlaneGeometry(4, 2), new ShadowMaterial({ color: new Color('#3d3f44'), opacity: HOME_LIGHT.shadowOpacity }))
    this.shadowPlane.rotation.x = -Math.PI / 2
    this.shadowPlane.position.set(0, 0.0015, 0.5)
    this.shadowPlane.receiveShadow = true
    this.scene.add(this.shadowPlane)
    this.buildLayoutExtras()

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)
    this.resize()
    r.domElement.addEventListener('pointermove', this.onMove)
    r.domElement.addEventListener('pointerleave', this.onLeave)
    r.domElement.addEventListener('click', this.onClick)
    window.addEventListener('pointermove', this.onWindowPointer, { passive: true })
    document.documentElement.addEventListener('mouseleave', this.onWindowLeave)
    window.addEventListener('blur', this.onWindowLeave)
    r.setAnimationLoop(this.frame)
    const photo = this.buildPhotoPlanes()

    // 소품은 따로따로 불러와 준비되는 대로 놓는다(하나가 실패해도 나머지는 보인다). iMac이 핵심이라 실패하면 장면 실패
    const progress = new Map<string, number>()
    const report = (k: string) => (v: number) => {
      progress.set(k, v)
      this.opts.onProgress?.([...progress.values()].reduce((a, b) => a + b, 0) / 4)
    }
    const others = Promise.allSettled([
      this.buildPapers(),
      this.buildMug(),
      this.buildLamp(report('lamp')),
      this.buildPen(report('pen')),
      this.buildPhone(report('phone')),
    ]).then((rs) => rs.forEach((x) => x.status === 'rejected' && console.warn('[Home] 소품을 불러오지 못했습니다', x.reason)))
    this.ready = Promise.all([photo, this.buildImac(report('imac'))]).then(() => void others)
  }

  // ---------- 공통 ----------
  private async loadObj(url: string, onProgress: (v: number) => void) {
    return this.loader.loadAsync(url, (e) => e.total && onProgress(e.loaded / e.total))
  }

  /** 웹용 사본은 법선이 없어 면이 각져 보인다 → 정점을 합쳐 부드러운 법선을 만든다 */
  private smooth(o: Object3D) {
    o.traverse((m) => {
      if (m instanceof Mesh) {
        const g = m.geometry as BufferGeometry
        g.deleteAttribute('normal')
        g.deleteAttribute('uv')
        const merged = mergeVertices(g, 1e-5)
        merged.computeVertexNormals()
        m.geometry = merged
        g.dispose()
      }
    })
  }

  /** 회전·크기를 적용하고 바닥 가운데가 원점이 되게 감싼다 */
  private normalize(obj: Object3D, cfg: (typeof PROPS)[PropId]) {
    if (cfg.rot) obj.rotation.set(...cfg.rot)
    if (cfg.fit) {
      const s = new Box3().setFromObject(obj).getSize(new Vector3())
      obj.scale.setScalar(cfg.fit / Math.max(s.x, s.y, s.z))
    } else obj.scale.setScalar(cfg.scale ?? 1)
    const inner = new Group()
    inner.add(obj)
    const b = new Box3().setFromObject(inner)
    const c = b.getCenter(new Vector3())
    obj.position.set(-c.x, -b.min.y, -c.z)
    return inner
  }

  /** 소품 등록: 그림자·선택·접촉 그림자·라벨 위치 */
  private register(id: PropId, inner: Object3D, anchorY?: number) {
    const outer = new Group()
    outer.add(inner)
    inner.traverse((m) => {
      if (m instanceof Mesh) {
        m.castShadow = true
        m.receiveShadow = true
        m.userData.pick = id
        this.pickables.push(m)
      }
    })
    const b = new Box3().setFromObject(inner)
    const size = b.getSize(new Vector3())
    outer.add(contactShadow(size.x * 0.85, size.z * 0.95))
    this.anchorPoints.set(id, new Vector3(0, anchorY ?? b.max.y + 0.02, b.max.z * 0.3))
    this.props.set(id, outer)
    this.scene.add(outer)
    this.place(id)
    const el = this.anchors.get(id)
    if (el) el.dataset.ready = 'true'
  }

  private place(id: PropId) {
    const g = this.props.get(id)
    if (!g || (id === 'imac' && this.focused)) return
    const p: Placement = this.wide() ? PROPS[id].wide : PROPS[id].tall
    g.position.set(p.x, 0, p.z)
    g.rotation.set(0, p.rotY, 0)
    g.scale.setScalar(p.scale ?? 1)
    g.visible = !p.hidden
  }

  // ---------- 사진 투사 ----------
  /** 사진을 벽 면(z = 0, 세로)·책상 면(y = 0)에 투사한다. 각 픽셀을 photoCam으로 다시 찍은 위치에서 사진 색을 읽는다 */
  private async buildPhotoPlanes() {
    const load = (u: string) => new TextureLoader().loadAsync(u)
    const tex: Texture = await load(HOME_BG.webp).catch(() => load(HOME_BG.png))
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 8
    const vp = new Matrix4().multiplyMatrices(this.photoCam.projectionMatrix, this.photoCam.matrixWorldInverse)
    const mat = new ShaderMaterial({
      uniforms: { map: { value: tex }, photoVP: { value: vp } },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        uniform mat4 photoVP;
        varying vec3 vWorld;
        void main() {
          vec4 c = photoVP * vec4(vWorld, 1.0);
          vec2 uv = clamp(c.xy / c.w * 0.5 + 0.5, 0.0005, 0.9995);
          gl_FragColor = texture2D(map, uv);
          #include <colorspace_fragment>
        }`,
    })
    const wall = new Mesh(new PlaneGeometry(8, 5), mat)
    wall.position.set(0, 2.5, 0)
    const desk = new Mesh(new PlaneGeometry(8, 4), mat)
    desk.rotation.x = -Math.PI / 2
    desk.position.set(0, 0, 2)
    this.photoPlanes.add(wall, desk)
    this.scene.add(this.photoPlanes)
    this.photoPlanes.visible = this.mode === 'composite'
  }

  // ---------- 소품 ----------
  private async buildImac(onProgress: (v: number) => void) {
    const obj = await this.loadObj(PROPS.imac.url!, onProgress)
    obj.traverse((m) => m instanceof Mesh && (m.material = MAT.imac))
    const inner = this.normalize(obj, PROPS.imac)
    // 화면 판: 모델이 한 재질이라 화면을 따로 칠할 수 없어, 앞 유리 자리에 얇은 판을 덧댄다(유리 면 z는 형상에서 찾는다)
    inner.updateMatrixWorld(true)
    const box = new Box3().setFromObject(inner)
    const h = box.max.y - box.min.y
    // 패널(위쪽 영역)의 실제 좌우 범위와 앞면 z를 형상에서 찾는다 — 모델 전체 중심은 케이블·키보드 때문에 어긋난다
    let frontZ = -Infinity
    let minX = Infinity
    let maxX = -Infinity
    const v = new Vector3()
    inner.traverse((m) => {
      if (!(m instanceof Mesh)) return
      const pos = m.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld)
        if (v.y > box.min.y + h * 0.45) {
          minX = Math.min(minX, v.x)
          maxX = Math.max(maxX, v.x)
          frontZ = Math.max(frontZ, v.z)
        }
      }
    })
    // 27인치 iMac Pro: 화면은 패널 폭의 약 92%, 16:9, 위 여백은 좌우 여백과 비슷하게
    const pw = maxX - minX
    const sw = pw * 0.92
    const sh = (sw * 9) / 16
    const cx = (minX + maxX) / 2
    this.screenMat = new MeshBasicMaterial({ map: screenTexture(), toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })
    const screen = new Mesh(new PlaneGeometry(sw, sh), this.screenMat)
    screen.position.set(cx, box.max.y - (pw - sw) / 2 - sh / 2, frontZ + 0.002)
    inner.add(screen)
    this.register('imac', inner, box.max.y + 0.03)
    this.anchorPoints.get('imac')!.x = cx
  }

  private async buildLamp(onProgress: (v: number) => void) {
    const obj = await this.loadObj(PROPS.lamp.url!, onProgress)
    this.smooth(obj)
    obj.traverse((m) => {
      if (!(m instanceof Mesh)) return
      const names = ((Array.isArray(m.material) ? m.material : [m.material]) as Material[]).map((x) => x.name)
      const pick = (n: string) => (n.includes('plastic') ? MAT.lampPlastic : n.includes('wire') ? MAT.wire : MAT.lampMetal)
      m.material = Array.isArray(m.material) ? names.map(pick) : pick(names[0])
    })
    const inner = this.normalize(obj, PROPS.lamp)
    // 갓 안의 전구 자리에서 책상 가운데로 비추는 빛(처음엔 꺼짐)
    const b = new Box3().setFromObject(inner)
    const bulb = new Vector3(b.max.x - 0.09, b.max.y - 0.1, 0)
    const spot = new SpotLight('#ffd9a0', 0, 2.2, 0.75, 0.6, 1.2)
    spot.position.copy(bulb)
    spot.target.position.set(bulb.x + 0.45, 0, 0.15)
    spot.castShadow = true
    spot.shadow.mapSize.set(1024, 1024)
    spot.shadow.bias = -0.0005
    inner.add(spot, spot.target)
    this.lampLight = spot
    const bulbMesh = new Mesh(new SphereGeometry(0.022, 16, 12), new MeshBasicMaterial({ color: '#fff1d0', transparent: true, opacity: 0, toneMapped: false }))
    bulbMesh.position.copy(bulb)
    const pool = new Mesh(new PlaneGeometry(1.3, 1.0), new MeshBasicMaterial({ map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }))
    pool.rotation.x = -Math.PI / 2
    pool.position.set(bulb.x + 0.3, 0.003, 0.2)
    pool.raycast = bulbMesh.raycast = () => {}
    inner.add(bulbMesh, pool)
    this.lampGlow = [bulbMesh, pool]
    this.register('lamp', inner)
  }

  private async buildPhone(onProgress: (v: number) => void) {
    const obj = await this.loadObj(PROPS.phone.url!, onProgress)
    this.smooth(obj)
    obj.traverse((m) => m instanceof Mesh && (m.material = MAT.phone))
    this.register('phone', this.normalize(obj, PROPS.phone))
  }

  private async buildPen(onProgress: (v: number) => void) {
    const obj = await this.loadObj(PROPS.pen.url!, onProgress)
    this.smooth(obj)
    // 재질 이름별: 가장 큰 덩어리(몸통·뚜껑)는 검정 래커, 나머지(클립·띠·닙)는 금색
    obj.traverse((m) => {
      if (!(m instanceof Mesh)) return
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      const pick = (x: Material) => (['Material.005', 'Material.001', 'Material.009'].includes(x.name) ? MAT.penBody : MAT.penTrim)
      m.material = Array.isArray(m.material) ? mats.map(pick) : pick(mats[0])
    })
    this.register('pen', this.normalize(obj, PROPS.pen))
  }

  /** 서류더미(모델 없음): A4 몇 장을 살짝 어긋나게 쌓는다. 맨 위 장에는 글줄 무늬 */
  private async buildPapers() {
    const inner = new Group()
    const W = 0.21
    const D = 0.297
    const T = 0.0016
    for (let i = 0; i < 7; i++) {
      const sheet = new Mesh(new BoxGeometry(W, T, D), MAT.paper)
      sheet.position.set((Math.sin(i * 2.3) * 0.006), T / 2 + i * T, Math.cos(i * 1.7) * 0.006)
      sheet.rotation.y = Math.sin(i * 1.3) * 0.05
      inner.add(sheet)
    }
    const topMat = new MeshStandardMaterial({ map: letterTexture(), roughness: 0.9 })
    const top = new Mesh(new BoxGeometry(W, T, D), [MAT.paper, MAT.paper, topMat, MAT.paper, MAT.paper, MAT.paper])
    top.position.set(0.004, T / 2 + 7 * T, -0.004)
    top.rotation.y = -0.04
    inner.add(top)
    this.topSheet = top
    this.register('papers', inner, 0.06)
  }

  /** 머그(사진 컷아웃): 정면 고정 카메라라 세운 판으로 충분하다. 그림자는 투명 부분을 뺀 모양으로 */
  private async buildMug() {
    const tex = await new TextureLoader().loadAsync(MUG.webp).catch(() => new TextureLoader().loadAsync(MUG.png))
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 8
    const size = MUG.height / (MUG.imageBottom - MUG.imageTop)
    const plane = new Mesh(
      new PlaneGeometry(size, size),
      new MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, toneMapped: false, color: '#f2f2f0' }),
    )
    plane.customDepthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: tex, alphaTest: 0.5 })
    plane.position.y = size / 2 - (1 - MUG.imageBottom) * size
    const inner = new Group()
    inner.add(plane)
    this.register('mug', inner, MUG.height + 0.03)
    // 접촉 그림자는 판 크기가 아니라 머그 바닥 크기로
    const outer = this.props.get('mug')!
    outer.children[1].scale.set(0.08, 0.06, 1)
  }

  private async loadTable() {
    if (this.table) return
    const obj = await this.loader.loadAsync(TABLE.url)
    const top = new MeshStandardMaterial({ color: '#f1f1ef', roughness: 0.6 })
    obj.traverse((m) => {
      if (m instanceof Mesh) {
        m.material = top
        m.castShadow = m.receiveShadow = true
      }
    })
    obj.scale.set(1.6, 1, 0.9)
    obj.position.set(0, -TABLE.height, 0.32)
    this.table = obj
    this.scene.add(obj)
    obj.visible = this.mode === 'layout'
  }

  private buildLayoutExtras() {
    const grid = new GridHelper(5, 50, '#9a9a96', '#cfcfcb')
    grid.position.y = -TABLE.height
    const wall = new Mesh(new PlaneGeometry(5, 2.6), new MeshStandardMaterial({ color: '#e6e7e8', roughness: 0.95 }))
    wall.position.set(0, 0.5, -0.02)
    wall.receiveShadow = true
    this.layoutExtras.add(grid, wall)
    this.layoutExtras.visible = false
    this.scene.add(this.layoutExtras)
  }

  // ---------- 보기 ----------
  setMode(mode: HomeMode) {
    this.mode = mode
    const layout = mode === 'layout'
    this.layoutExtras.visible = layout
    this.shadowPlane.visible = !layout
    this.photoPlanes.visible = !layout
    if (layout) void this.loadTable().then(() => this.table && (this.table.visible = true))
    else if (this.table) this.table.visible = false
    this.renderer.setClearColor(layout ? 0xdedfe0 : 0x000000, layout ? 1 : 0)
    this.resize()
  }

  private wide() {
    return this.container.clientWidth / Math.max(1, this.container.clientHeight) >= 0.8
  }

  // ---------- 동작 ----------
  /** 사물 선택 → 반응. done은 페이지 이동이 필요한 사물만(iMac·서류더미·전화기) */
  activate(id: PropId, done: () => void) {
    const g = this.props.get(id)
    const rm = this.opts.reducedMotion
    if (!g) return done()
    switch (id) {
      case 'imac':
        return this.focusImac(done)
      case 'papers': {
        const s = this.topSheet
        if (!s || rm) return done()
        gsap.timeline({ onComplete: done }).to(s.position, { z: s.position.z + 0.06, x: s.position.x + 0.01, duration: 0.35, ease: 'power2.out' })
        return
      }
      case 'phone':
        if (rm) return done()
        gsap.timeline({ onComplete: done }).to(g.rotation, { z: 0.03, duration: 0.05, repeat: 5, yoyo: true }).set(g.rotation, { z: 0 })
        return
      case 'lamp':
        this.lampOn = !this.lampOn
        gsap.to(this.lampLight!, { intensity: this.lampOn ? 6 : 0, duration: rm ? 0 : 0.25 })
        this.lampGlow.forEach((m, i) => gsap.to(m.material as MeshBasicMaterial, { opacity: this.lampOn ? (i === 0 ? 1 : 0.85) : 0, duration: rm ? 0 : 0.25 }))
        return done()
      case 'mug':
        if (!rm) gsap.timeline().to(g.rotation, { z: 0.06, duration: 0.08, yoyo: true, repeat: 3, ease: 'sine.inOut' }).set(g.rotation, { z: 0 })
        return done()
      case 'pen': {
        if (rm) return done()
        const x = g.position.x
        gsap.timeline().to(g.position, { x: x + 0.025, duration: 0.25, ease: 'power2.out' }).to(g.position, { x, duration: 0.35, ease: 'power2.inOut' })
        return done()
      }
    }
  }

  get isLampOn() {
    return this.lampOn
  }

  private focusImac(onArrive: () => void) {
    const g = this.props.get('imac')!
    if (this.focused) return onArrive()
    this.focused = true
    this.tl?.kill()
    if (this.opts.reducedMotion || this.mode !== 'composite') return onArrive()
    const f = this.wide() ? IMAC_FOCUS.wide : IMAC_FOCUS.tall
    const dir = new Vector3(f.ndcX, f.ndcY, 0.5).unproject(this.camera).sub(this.camera.position).normalize()
    const target = this.camera.position.clone().addScaledVector(dir, f.dist)
    const d = IMAC_FOCUS.duration
    this.tl = gsap
      .timeline({ onComplete: onArrive })
      .to(g.position, { x: target.x, z: Math.min(target.z, this.photo.z - 0.5), duration: d, ease: 'power3.inOut' }, 0)
      .to(g.rotation, { y: 0, duration: d * 0.8, ease: 'power2.inOut' }, 0)
  }

  /** 패널을 닫으면 원래 배치로(iMac·맨 위 종이) */
  reset() {
    const s = this.topSheet
    if (s) gsap.to(s.position, { x: 0.004, z: -0.004, duration: this.opts.reducedMotion ? 0 : 0.4 })
    if (!this.focused) return
    this.focused = false
    this.tl?.kill()
    const g = this.props.get('imac')!
    const p = this.wide() ? PROPS.imac.wide : PROPS.imac.tall
    if (this.opts.reducedMotion) return this.place('imac')
    this.tl = gsap
      .timeline()
      .to(g.position, { x: p.x, z: p.z, duration: 0.6, ease: 'power2.inOut' }, 0)
      .to(g.rotation, { y: p.rotY, duration: 0.6, ease: 'power2.inOut' }, 0)
  }

  /** 사물 위에 붙는 HTML 버튼(키보드·스크린리더용). 장면이 매 프레임 위치를 옮긴다 */
  bindAnchor(id: PropId, el: HTMLElement | null) {
    if (el) {
      this.anchors.set(id, el)
      if (this.props.has(id)) el.dataset.ready = 'true'
    } else this.anchors.delete(id)
  }

  // ---------- 루프·배치 ----------
  private resize() {
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.renderer.setSize(w, h, false)
    const c = this.camera
    if (this.mode === 'layout') {
      c.clearViewOffset()
      c.fov = LAYOUT_VIEW.fov
      c.aspect = w / h
      c.position.copy(LAYOUT_VIEW.pos)
      c.lookAt(LAYOUT_VIEW.look)
    } else {
      c.fov = this.photo.fov
      c.aspect = this.photo.aspect
      this.aimCamera()
      const r = coverRect(w, h)
      c.setViewOffset(r.width, r.height, -r.x, -r.y, w, h)
    }
    c.updateProjectionMatrix()
    for (const id of this.props.keys()) this.place(id)
  }

  private tmp = new Vector3()
  /** 기준 구도 + 포인터 이동(카메라는 많이, 주시점은 조금) */
  private aimCamera() {
    const P = HOME_POINTER
    const o = this.offset
    this.camera.position.set(this.base.pos.x + o.x * P.position.x, this.base.pos.y + o.y * P.position.y, this.base.pos.z)
    this.camera.lookAt(this.base.look.x + o.x * P.target.x, this.base.look.y + o.y * P.target.y, this.base.look.z)
  }

  private frame = () => {
    const now = performance.now()
    const dt = Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    if (this.mode === 'composite') {
      const on = this.pointer.inside && this.canHover.matches && !this.opts.reducedMotion
      const lambda = on ? HOME_POINTER.damping : HOME_POINTER.returnDamping
      const o = this.offset
      o.x = MathUtils.damp(o.x, on ? this.pointer.x : 0, lambda, dt)
      o.y = MathUtils.damp(o.y, on ? this.pointer.y : 0, lambda, dt)
      this.aimCamera()
    }
    this.renderer.render(this.scene, this.camera)
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    for (const [id, el] of this.anchors) {
      const g = this.props.get(id)
      const p = this.anchorPoints.get(id)
      if (!g || !p) continue
      g.updateMatrixWorld()
      this.tmp.copy(p).applyMatrix4(g.matrixWorld).project(this.camera)
      el.style.transform = `translate(${((this.tmp.x + 1) / 2) * w}px, ${((1 - this.tmp.y) / 2) * h}px)`
      el.dataset.visible = g.visible && !(id === 'imac' && this.focused) ? 'true' : 'false'
    }
  }

  // ---------- 입력 ----------
  private onWindowPointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    this.pointer.inside = true
  }
  private onWindowLeave = () => {
    this.pointer.inside = false
  }

  private hit(e: MouseEvent): PropId | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.ray.setFromCamera(this.ndc, this.camera)
    const hit = this.ray.intersectObjects(this.pickables, false).find((h) => h.object.visible && isShown(h.object))
    return (hit?.object.userData.pick as PropId) ?? null
  }
  private onMove = (e: PointerEvent) => {
    const id = this.focused ? null : this.hit(e)
    this.renderer.domElement.style.cursor = id ? 'pointer' : ''
    if (id !== this.hovered) {
      this.hovered = id
      this.opts.onHover?.(id)
    }
  }
  private onLeave = () => {
    if (this.hovered) {
      this.hovered = null
      this.opts.onHover?.(null)
    }
  }
  private onClick = (e: MouseEvent) => {
    const id = !this.focused && this.hit(e)
    if (id) this.opts.onPick?.(id)
  }

  dispose() {
    this.tl?.kill()
    this.ro.disconnect()
    this.renderer.setAnimationLoop(null)
    this.renderer.domElement.removeEventListener('pointermove', this.onMove)
    this.renderer.domElement.removeEventListener('pointerleave', this.onLeave)
    this.renderer.domElement.removeEventListener('click', this.onClick)
    window.removeEventListener('pointermove', this.onWindowPointer)
    document.documentElement.removeEventListener('mouseleave', this.onWindowLeave)
    window.removeEventListener('blur', this.onWindowLeave)
    this.scene.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose()
        ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          ;(m as MeshBasicMaterial).map?.dispose()
          m.dispose()
        })
      }
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

function isShown(o: Object3D | null): boolean {
  for (let p = o; p; p = p.parent) if (!p.visible) return false
  return true
}

/** 바닥에 닿는 부드러운 어두운 자국 */
function contactShadow(w: number, d: number) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64)
  grad.addColorStop(0, 'rgba(30,30,34,1)')
  grad.addColorStop(1, 'rgba(30,30,34,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const m = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, opacity: HOME_LIGHT.contactOpacity, depthWrite: false }))
  m.rotation.x = -Math.PI / 2
  m.scale.set(w, d, 1)
  m.position.y = 0.0025
  m.raycast = () => {}
  return m
}

/** iMac 화면(자리표시): 어두운 바탕에 Vision INside */
function screenTexture() {
  const c = document.createElement('canvas')
  c.width = 1280
  c.height = 720
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 1280, 720)
  grad.addColorStop(0, '#1e2230')
  grad.addColorStop(1, '#3b4057')
  g.fillStyle = grad
  g.fillRect(0, 0, 1280, 720)
  g.fillStyle = 'rgba(255,255,255,0.9)'
  g.font = '300 104px Inter, Arial, sans-serif'
  g.textAlign = 'center'
  g.fillText('Vision INside', 640, 380)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** 맨 위 종이: 제목·문단 자리의 옅은 회색 줄(글자 없음) */
function letterTexture() {
  const c = document.createElement('canvas')
  c.width = 420
  c.height = 594
  const g = c.getContext('2d')!
  g.fillStyle = '#f6f5f1'
  g.fillRect(0, 0, 420, 594)
  g.fillStyle = '#c9c8c3'
  g.fillRect(40, 56, 180, 14)
  for (let i = 0; i < 16; i++) g.fillRect(40, 110 + i * 26, i % 5 === 4 ? 200 : 340, 6)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** 스탠드 빛 번짐: 가운데가 따뜻하고 가장자리로 사라지는 타원 */
function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(128, 128, 6, 128, 128, 128)
  // 흰 책상 위라 빛을 더하는 대신 따뜻한 색을 반투명하게 덮는다
  grad.addColorStop(0, 'rgba(255,190,110,0.8)')
  grad.addColorStop(0.5, 'rgba(255,186,108,0.4)')
  grad.addColorStop(1, 'rgba(255,186,110,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}
