import {
  ACESFilmicToneMapping, BoxGeometry, CapsuleGeometry, Color, Curve, DirectionalLight, Group, HemisphereLight, Mesh,
  MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PCFShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator,
  Raycaster, Scene, SRGBColorSpace, TubeGeometry, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { gsap } from 'gsap'

/**
 * Contact · 벽걸이 전화기 (임시 형태 — 최종 에셋 필요)
 * 레퍼런스 6의 구성(본체·키패드·걸이·왼쪽 수화기·꼬인 선)을 기본 도형으로 만든다. 단위는 m에 가깝다.
 * 최종 GLB가 오면 body/handset 두 노드로 나눠 같은 자리에 끼우면 된다(수화기 피벗 = 손잡이 가운데).
 */
const HANDSET_REST = { pos: new Vector3(-0.135, 0.0, 0.055), rotZ: 0 }
/** 전화 받기: 수화기가 걸이에서 들려 본체 왼쪽 앞에 자리한다 */
const HANDSET_LIFTED = { pos: new Vector3(-0.29, 0.04, 0.16), rotZ: 0.1 }
const ANSWER = { duration: 0.6, pan: 0.3 }
const CAMERA = { fov: 30, center: new Vector3(-0.02, -0.08, 0), frameHeight: 0.95, frameWidth: 0.78 }

export type ContactPick = 'phone'
interface Options {
  reducedMotion: boolean
  /** 벨이 한 번 울릴 때마다(소리는 UI에서 켜져 있을 때만 재생) */
  onRing?: () => void
  onPick?: (p: ContactPick) => void
}

/** 꼬인 전화선: 두 끝을 잇는 처진 곡선 둘레를 나선으로 감는다 */
class CoilCurve extends Curve<Vector3> {
  // three 타입에서 Curve 생성자가 protected라 공개 생성자를 둔다
  constructor() {
    super()
  }
  a = new Vector3()
  b = new Vector3()
  sag = 0.32
  turns = 34
  radius = 0.011
  private p = new Vector3()
  private q = new Vector3()
  private c = new Vector3()
  private base(t: number, out: Vector3) {
    // 2차 베지어: 가운데 제어점을 아래로 내려 처지게
    this.c.copy(this.a).add(this.b).multiplyScalar(0.5)
    this.c.y = Math.min(this.a.y, this.b.y) - this.sag
    const u = 1 - t
    return out.set(
      u * u * this.a.x + 2 * u * t * this.c.x + t * t * this.b.x,
      u * u * this.a.y + 2 * u * t * this.c.y + t * t * this.b.y,
      u * u * this.a.z + 2 * u * t * this.c.z + t * t * this.b.z,
    )
  }
  getPoint(t: number, target = new Vector3()) {
    this.base(t, this.p)
    this.base(Math.min(1, t + 0.001), this.q)
    const tan = this.q.sub(this.p).normalize()
    const n = new Vector3(0, 0, 1).cross(tan).normalize()
    const bn = tan.clone().cross(n)
    // 양 끝은 감지 않고 곧게 나온다
    const r = this.radius * Math.min(1, t * 12, (1 - t) * 12)
    const ang = t * this.turns * Math.PI * 2
    return target.copy(this.p).addScaledVector(n, Math.cos(ang) * r).addScaledVector(bn, Math.sin(ang) * r)
  }
}

export class ContactScene {
  readonly ready: Promise<void>
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(CAMERA.fov, 1, 0.05, 30)
  private phone = new Group()
  private handset = new Group()
  private cord: Mesh
  private coil = new CoilCurve()
  private pickables: Object3D[] = []
  private ray = new Raycaster()
  private ndc = new Vector2()
  private ro: ResizeObserver
  private ring: gsap.core.Timeline | null = null
  private tl: gsap.core.Timeline | null = null
  private pan = { v: 0 }
  private aspect = 1
  private anchors = new Map<string, HTMLElement>()
  private container: HTMLElement
  private opts: Options
  answered = false

  constructor(container: HTMLElement, opts: Options) {
    this.container = container
    this.opts = opts
    const r = (this.renderer = new WebGLRenderer({ antialias: true }))
    r.setPixelRatio(Math.min(devicePixelRatio, 2))
    r.outputColorSpace = SRGBColorSpace
    r.toneMapping = ACESFilmicToneMapping
    r.toneMappingExposure = 0.9
    r.shadowMap.enabled = true
    r.shadowMap.type = PCFShadowMap
    r.domElement.className = 'v5-canvas'
    container.appendChild(r.domElement)

    const pm = new PMREMGenerator(r)
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.3
    pm.dispose()
    this.scene.background = new Color('#d9d3c8')

    this.buildLights()
    this.buildPhone()
    this.cord = new Mesh(undefined, new MeshPhysicalMaterial({ color: '#b3231b', roughness: 0.35, clearcoat: 0.5 }))
    this.cord.castShadow = true
    this.phone.add(this.cord)
    this.updateCord()
    this.scene.add(this.phone)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)
    this.resize()
    r.domElement.addEventListener('pointermove', this.onMove)
    r.domElement.addEventListener('click', this.onClick)
    r.setAnimationLoop(this.frame)
    this.ready = Promise.resolve()
    this.startRinging()
  }

  private buildLights() {
    const wall = new Mesh(new PlaneGeometry(8, 6), new MeshStandardMaterial({ color: '#e4ded3', roughness: 0.95 }))
    wall.receiveShadow = true
    this.scene.add(wall)
    this.scene.add(new HemisphereLight('#fff8ee', '#8a8172', 0.9))
    // 왼쪽 위에서 비스듬히: 벽에 전화기·선 그림자가 오른쪽 아래로 떨어진다
    const key = new DirectionalLight('#fff3e2', 2.2)
    key.position.set(-1.2, 1.6, 1.8)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    const s = key.shadow.camera
    s.left = -0.8
    s.right = 0.8
    s.top = 0.6
    s.bottom = -0.9
    key.shadow.bias = -0.0005
    key.shadow.normalBias = 0.01
    key.shadow.radius = 6
    this.scene.add(key)
  }

  private buildPhone() {
    const red = new MeshPhysicalMaterial({ color: '#c42a1f', roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3 })
    const chrome = new MeshStandardMaterial({ color: '#d5d7da', metalness: 1, roughness: 0.22 })
    const dark = new MeshStandardMaterial({ color: '#2a1512', roughness: 0.6 })
    const add = (parent: Object3D, m: Mesh) => {
      m.castShadow = m.receiveShadow = true
      parent.add(m)
      return m
    }

    // 본체
    const body = add(this.phone, new Mesh(new RoundedBoxGeometry(0.2, 0.32, 0.075, 4, 0.02), red))
    body.position.set(0, 0, 0.0375)
    // 위쪽 걸이 홈 + 크롬 고리
    const cradle = add(this.phone, new Mesh(new BoxGeometry(0.15, 0.03, 0.03), dark))
    cradle.position.set(0, 0.14, 0.078)
    for (const x of [-0.055, 0.055]) add(this.phone, new Mesh(new BoxGeometry(0.012, 0.03, 0.012), chrome)).position.set(x, 0.155, 0.09)
    // 키패드 4×3
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 3; col++) {
        const k = add(this.phone, new Mesh(new RoundedBoxGeometry(0.036, 0.03, 0.012, 2, 0.004), chrome))
        k.position.set((col - 1) * 0.046, 0.065 - row * 0.04, 0.078)
      }
    // 선이 나오는 아래 단자
    add(this.phone, new Mesh(new BoxGeometry(0.02, 0.014, 0.014), chrome)).position.set(-0.06, -0.164, 0.03)

    // 수화기: 손잡이 + 위 귀 + 아래 입
    const handle = add(this.handset, new Mesh(new CapsuleGeometry(0.019, 0.17, 6, 12), red))
    handle.position.z = 0
    const ear = add(this.handset, new Mesh(new RoundedBoxGeometry(0.062, 0.06, 0.05, 3, 0.018), red))
    ear.position.set(0, 0.1, 0.018)
    const mouth = add(this.handset, new Mesh(new RoundedBoxGeometry(0.062, 0.06, 0.05, 3, 0.018), red))
    mouth.position.set(0, -0.1, 0.018)
    for (const y of [0.1, -0.1]) add(this.handset, new Mesh(new BoxGeometry(0.03, 0.03, 0.004), dark)).position.set(0, y, 0.044)
    this.handset.position.copy(HANDSET_REST.pos)
    this.phone.add(this.handset)
    this.pickables.push(body, handle, ear, mouth)
  }

  /** 수화기 아래 끝 ↔ 본체 단자를 잇는 선을 다시 만든다(수화기가 움직일 때만) */
  private cordKey = ''
  private updateCord() {
    this.handset.updateMatrix()
    const end = new Vector3(0, -0.13, 0.005).applyMatrix4(this.handset.matrix)
    const key = end.toArray().map((v) => v.toFixed(4)).join()
    if (key === this.cordKey) return
    this.cordKey = key
    this.coil.a.copy(end)
    this.coil.b.set(-0.06, -0.17, 0.03)
    this.coil.sag = 0.2 + Math.max(0, end.distanceTo(this.coil.b) * 0.25)
    this.cord.geometry.dispose()
    this.cord.geometry = new TubeGeometry(this.coil, 520, 0.0032, 6, false)
  }

  // ---------- 벨 ----------
  private startRinging() {
    this.ring?.kill()
    if (this.opts.reducedMotion) {
      // 흔들림은 생략. 벨 소리(켜져 있을 때)는 같은 박자로
      this.ring = gsap.timeline({ repeat: -1 }).call(() => this.opts.onRing?.()).to({}, { duration: 2.4 })
      return
    }
    const h = this.handset.rotation
    this.ring = gsap
      .timeline({ repeat: -1, repeatDelay: 1.4 })
      .call(() => this.opts.onRing?.())
      .to(h, { z: 0.05, duration: 0.05, ease: 'sine.inOut', repeat: 13, yoyo: true })
      .to(this.phone.rotation, { z: 0.008, duration: 0.05, repeat: 13, yoyo: true }, 0)
      .to(h, { z: 0, duration: 0.05 })
      .set(this.phone.rotation, { z: 0 })
  }

  // ---------- 전화 받기 / 끊기 ----------
  /** 벨 정지 → 수화기 들어 왼쪽으로 + 화면에서 전화기를 왼쪽(모바일은 위)으로 옮긴 뒤 onDone */
  answer(onDone?: () => void, instant = false) {
    if (this.answered) return onDone?.()
    this.answered = true
    this.ring?.kill()
    this.handset.rotation.z = 0
    this.phone.rotation.z = 0
    this.tl?.kill()
    const L = HANDSET_LIFTED
    if (instant || this.opts.reducedMotion) {
      this.handset.position.copy(L.pos)
      this.handset.rotation.z = L.rotZ
      this.pan.v = 1
      onDone?.()
      return
    }
    const d = ANSWER.duration
    this.tl = gsap
      .timeline({ onComplete: onDone })
      .to(this.handset.position, { y: L.pos.y + 0.08, z: L.pos.z, duration: d * 0.4, ease: 'power2.out' }, 0)
      .to(this.handset.position, { x: L.pos.x, y: L.pos.y, duration: d * 0.6, ease: 'power3.inOut' }, d * 0.3)
      .to(this.handset.rotation, { z: L.rotZ, duration: d * 0.6, ease: 'power2.inOut' }, d * 0.3)
      .to(this.pan, { v: 1, duration: d, ease: 'power2.inOut' }, 0.05)
  }

  hangUp() {
    if (!this.answered) return
    this.answered = false
    this.tl?.kill()
    const R = HANDSET_REST
    const back = () => this.startRinging()
    if (this.opts.reducedMotion) {
      this.handset.position.copy(R.pos)
      this.handset.rotation.z = R.rotZ
      this.pan.v = 0
      return back()
    }
    this.tl = gsap
      .timeline({ onComplete: back })
      .to(this.handset.position, { x: R.pos.x, y: R.pos.y, z: R.pos.z, duration: 0.45, ease: 'power2.inOut' }, 0)
      .to(this.handset.rotation, { z: R.rotZ, duration: 0.45 }, 0)
      .to(this.pan, { v: 0, duration: 0.45, ease: 'power2.inOut' }, 0)
  }

  bindAnchor(id: string, el: HTMLElement | null) {
    if (el) this.anchors.set(id, el)
    else this.anchors.delete(id)
  }

  // ---------- 루프 ----------
  private look = new Vector3()
  private frame = () => {
    this.updateCord()
    const t = Math.tan((CAMERA.fov * Math.PI) / 360)
    const portrait = this.aspect < 0.8
    const dist = Math.max(CAMERA.frameHeight / 2 / t, CAMERA.frameWidth / 2 / (t * this.aspect)) * (portrait ? 1 : 1)
    const halfW = dist * t * this.aspect
    const halfH = dist * t
    // 받은 뒤: 데스크톱은 전화기를 화면 왼쪽 1/4에, 모바일은 위쪽 1/4에(양식이 오른쪽·아래에 열린다)
    const p = this.pan.v
    const zoom = portrait ? 1 + 0.35 * p : 1
    const dx = portrait ? 0 : ANSWER.pan * halfW * p
    const dy = portrait ? -0.5 * halfH * zoom * p : 0
    this.look.set(CAMERA.center.x - 0.1 * p + dx, CAMERA.center.y + 0.06 * p + dy, 0)
    this.camera.position.set(this.look.x, this.look.y, dist * zoom)
    this.camera.lookAt(this.look)
    this.renderer.render(this.scene, this.camera)
    this.placeAnchors()
  }

  private tmp = new Vector3()
  private placeAnchors() {
    const el = this.anchors.get('answer')
    if (!el) return
    this.tmp.set(0.1, 0.02, 0.08).project(this.camera)
    el.style.transform = `translate(${((this.tmp.x + 1) / 2) * this.container.clientWidth}px, ${((1 - this.tmp.y) / 2) * this.container.clientHeight}px)`
  }

  private resize() {
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.renderer.setSize(w, h, false)
    this.aspect = w / h
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
  }

  private hit(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.ray.setFromCamera(this.ndc, this.camera)
    return !this.answered && this.ray.intersectObjects(this.pickables, false).length > 0
  }
  private onMove = (e: PointerEvent) => {
    this.renderer.domElement.style.cursor = this.hit(e) ? 'pointer' : ''
  }
  private onClick = (e: MouseEvent) => {
    if (this.hit(e)) this.opts.onPick?.('phone')
  }

  dispose() {
    this.ring?.kill()
    this.tl?.kill()
    this.ro.disconnect()
    this.renderer.setAnimationLoop(null)
    this.renderer.domElement.removeEventListener('pointermove', this.onMove)
    this.renderer.domElement.removeEventListener('click', this.onClick)
    this.scene.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose()
        ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose())
      }
    })
    this.scene.environment?.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
