import {
  Box3, BoxGeometry, CanvasTexture, CatmullRomCurve3, ConeGeometry, CylinderGeometry, DoubleSide,
  FrontSide, Group, LatheGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D,
  PerspectiveCamera, PlaneGeometry, Raycaster, Scene, SpotLight, TubeGeometry, Vector2, Vector3,
  WebGLRenderer, AdditiveBlending, type BufferGeometry, type Material,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { addCleanLights, applyCleanMaterials, createCleanStyle, markFx, prepareModel } from '../three/cleanStyle'
import { THEME, type CleanPalette } from '../theme'
import { createCabinet, type Cabinet } from './cabinet'

/**
 * VIN Home 책상 — docs/refs/home/prototype/home-prototype.html 을 그대로 옮긴 장면(값이 명세와 다르면 시험판 기준).
 * 단위 cm, 테이블 윗면 TOP = 75. 모든 사물은 흰 Lambert(밝기만 계산) → cleanStyle 후처리로 "깔끔한 일러스트"(3톤 + 검은 선 + 단색 배경).
 *
 * 1단계 범위: 마우스 둘러보기, 스탠드 켜고 끄기, 사물 호버 라벨, 컵 살짝 튀기.
 * 모니터·전화기·명함·서랍으로 다가가는 카메라 이동(#screen #contact #about #work)은 2단계.
 */
export const TOP = 75

/** 카메라(시험판 HOME()): 세로 화면(비율 < 0.9)은 물러나고 화각을 넓힌다 */
export const HOME_CAMERA = {
  wide: { pos: [0, 98, 196] as const, fov: 40 },
  tall: { pos: [0, 98, 250] as const, fov: 66 },
  look: [0, 76, -4] as const,
  portraitBelow: 0.9,
  /** 마우스 둘러보기: 위치 ±(8, 4), 바라보는 곳 ±(22, 9), 따라오기 lerp */
  pointer: { pos: [8, 4] as const, look: [22, 9] as const, lerp: 0.05 },
  lerp: 0.06,
}

export type PickId = 'lamp' | 'imac' | 'phone' | 'card' | 'cabinet' | 'mug'

/** 호버 라벨(시험판 PICK.t). 클릭으로 다가가는 hash 는 2단계에서 쓴다 */
export const PICKS: Record<PickId, { label: string; hash?: string }> = {
  lamp: { label: '스탠드 · 불 켜고 끄기' },
  imac: { label: '모니터 · 소개와 프로젝트', hash: 'screen' },
  phone: { label: '전화기 · 연락하기', hash: 'contact' },
  card: { label: '명함 · 소개', hash: 'about' },
  cabinet: { label: '서랍 · 프로젝트', hash: 'work' },
  mug: { label: '컵' },
}

const MODELS = ['stand', 'imac', 'phone', 'table'] as const
const MODEL_URL = (k: string) => `/models/home/${k}.glb`

interface Options {
  reducedMotion: boolean
  onHover?: (id: PickId | null) => void
  onLamp?: (on: boolean) => void
}

export class HomeScene {
  readonly ready: Promise<void>
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(40, 1, 10, 5000)
  private style: ReturnType<typeof createCleanStyle>
  private container: HTMLElement
  private opts: Options
  private picks: { id: PickId; g: Object3D }[] = []
  private cabinet: Cabinet | null = null
  private coneMat: MeshBasicMaterial | null = null
  private spot: SpotLight | null = null
  private lampOn = true
  private lampV = 1
  private bump = new Map<Object3D, { t: number; y0: number }>()
  private cpos = new Vector3()
  private clook = new Vector3()
  private tpos = new Vector3()
  private tlook = new Vector3()
  private sm = new Vector2()
  private mouse = new Vector2()
  private ray = new Raycaster()
  private hover: PickId | null = null
  private ro: ResizeObserver
  private last = performance.now()
  private disposed = false

  constructor(container: HTMLElement, opts: Options) {
    this.container = container
    this.opts = opts
    const r = (this.renderer = new WebGLRenderer({ antialias: false }))
    r.domElement.className = 'v6-canvas'
    container.appendChild(r.domElement)
    // 렌더러 설정(Linear 출력·톤매핑 없음·pixelRatio 2·그림자)과 scene.background(검정)는 createCleanStyle 이 정한다
    this.style = createCleanStyle(r, this.scene, this.camera, THEME)

    this.ro = new ResizeObserver(() => this.fit())
    this.ro.observe(container)
    r.domElement.addEventListener('pointermove', this.onMove)
    r.domElement.addEventListener('pointerleave', this.onLeave)
    r.domElement.addEventListener('click', this.onClick)
    this.ready = this.build().then(() => {
      if (this.disposed) return
      this.fit()
      this.cpos.copy(this.tpos)
      this.clook.copy(this.tlook)
      r.setAnimationLoop(this.loop)
    })
  }

  // ---------- 장면 ----------
  private async build() {
    const W = new MeshLambertMaterial({ color: 0xffffff })
    const G = new MeshLambertMaterial({ color: 0xc8c8c8 })
    const Dk = new MeshLambertMaterial({ color: 0x555555 })
    const BLACK = new MeshBasicMaterial({ color: 0x000000 })
    const S = this.scene
    const add = (g: BufferGeometry, m: Material, p: [number, number, number], par: Object3D = S) => {
      const o = new Mesh(g, m)
      o.position.set(...p)
      o.castShadow = o.receiveShadow = true
      par.add(o)
      return o
    }

    // 모델: 법선을 지우고 꺾인 법선(π/4)으로 다시 계산 → 흰 Lambert 하나로
    const loader = new GLTFLoader()
    const [mStand, mImac, mPhone, mTable] = await Promise.all(
      MODELS.map((k) =>
        loader.loadAsync(MODEL_URL(k)).then((gltf) => {
          prepareModel(gltf.scene) // 법선 다시 계산 + 흰 재질
          return gltf.scene
        }),
      ),
    )

    // 테이블(접이식 1.5m, m → cm)
    const table = new Group()
    table.add(mTable)
    table.scale.setScalar(100)
    S.add(table)

    // 서랍 캐비닛(임시 — cabinet.ts)
    const cab = createCabinet({ white: W, gray: G, dark: Dk }, TOP)
    cab.group.position.set(40, 0, 0)
    S.add(cab.group)
    this.cabinet = cab

    // iMac(Z-up 모델 → 세워서 앞이 +z). 키보드·마우스 포함. 검은 화면 평면 = 진한 색, 2단계 HTML 오버레이 기준
    const imac = new Group()
    imac.position.set(0, TOP, -6)
    S.add(imac)
    const im = new Group()
    im.add(mImac)
    im.scale.setScalar(90)
    im.rotation.x = -Math.PI / 2
    imac.add(im)
    const scr = new Mesh(new PlaneGeometry(0.598, 0.336), BLACK)
    scr.position.set(0, 0.106, 0.335)
    scr.rotation.x = Math.atan2(1, 0.176)
    markFx(scr) // 재질·선 계산에서 제외
    scr.name = 'monitor-screen'
    mImac.add(scr)

    // 스탠드(갓이 +x 쪽으로). 빛 원뿔 + 스포트
    const lamp = new Group()
    lamp.position.set(-47, TOP + 0.949 * 26, 2)
    lamp.rotation.y = Math.PI / 2
    lamp.scale.setScalar(26)
    S.add(lamp)
    lamp.add(mStand)
    const coneMat = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false, blending: AdditiveBlending })
    const cone = new Mesh(new ConeGeometry(0.52, 1.25, 40, 1, true), coneMat)
    cone.position.set(0.01, -0.325, 0.78)
    markFx(cone)
    lamp.add(cone)
    const spot = new SpotLight(0xffffff, 0, 120, 0.55, 0.6, 1)
    spot.position.set(0.01, 0.3, 0.78)
    const spt = new Object3D()
    spt.position.set(0.01, -0.9, 0.78)
    lamp.add(spot, spt)
    spot.target = spt
    this.coneMat = coneMat
    this.spot = spot

    // 전화기(다이얼이 -z라 뒤집어 앞을 +z로)
    const phone = new Group()
    phone.position.set(52, TOP + 5.8 * 1.2, 8)
    phone.rotation.y = Math.PI - 0.3
    phone.scale.setScalar(1.2)
    S.add(phone)
    phone.add(mPhone)

    // 명함(글자는 아직 없음)
    const card = new Group()
    card.position.set(-26, TOP, 20)
    card.rotation.y = -0.6
    S.add(card)
    add(new BoxGeometry(9.4, 0.3, 5.6), W, [0, 0.15, 0], card)

    // vin 머그: 받침 있는 스택 머그 + 사각 손잡이 + 필기체 글자 스티커
    const mug = new Group()
    mug.position.set(38, TOP, -16)
    mug.rotation.y = -0.25
    S.add(mug)
    const prof = [[0, 0], [3.4, 0], [3.5, 2.3], [4.3, 2.7], [4.3, 9], [4, 9], [4, 1.2], [0, 1.2]].map(([x, y]) => new Vector2(x, y))
    add(new LatheGeometry(prof, 40), new MeshLambertMaterial({ color: 0xffffff, side: DoubleSide }), [0, 0, 0], mug)
    const hp = [[4.1, 8], [7.4, 8], [8.5, 3.6], [4.2, 3.4]].map(([x, y]) => new Vector3(x, y, 0))
    add(new TubeGeometry(new CatmullRomCurve3(hp, false, 'catmullrom', 0.02), 30, 0.75, 8), W, [0, 0, 0], mug)
    await document.fonts.load('100px Yellowtail').catch(() => {})
    const cvs = document.createElement('canvas')
    cvs.width = 512
    cvs.height = 256
    const cx = cvs.getContext('2d')!
    cx.fillStyle = '#000'
    cx.font = '170px Yellowtail, cursive'
    cx.textAlign = 'center'
    cx.textBaseline = 'middle'
    cx.fillText('vin', 256, 140)
    const tex = new CanvasTexture(cvs)
    tex.anisotropy = 4
    const decal = new Mesh(
      new CylinderGeometry(4.34, 4.34, 3.6, 32, 1, true, -0.72, 1.44),
      new MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: FrontSide }),
    )
    decal.position.y = 5.8
    markFx(decal)
    mug.add(decal)

    // 빛: 강한 햇빛 한 방향 + 주변광. 창 블라인드 그림자는 보이지 않는 막대 7개
    const bm = new MeshBasicMaterial({ colorWrite: false, depthWrite: false })
    for (let i = 0; i < 7; i++) {
      const o = new Mesh(new BoxGeometry(2, 3.2, 150), bm)
      o.position.set(-150, 85 + i * 18, 20)
      o.castShadow = true
      markFx(o)
      S.add(o)
    }
    addCleanLights(S) // 햇빛 세기 3 (-300,250,260) 그림자 2048 ±150 + 주변광 1.15
    applyCleanMaterials(S) // 코드로 만든 사물(서랍·명함·머그)까지 모든 재질을 흰 Lambert 로(keepMaterial 제외)

    const map: [PickId, Object3D][] = [['lamp', lamp], ['imac', imac], ['phone', phone], ['card', card], ['cabinet', cab.group], ['mug', mug]]
    for (const [id, g] of map) {
      g.traverse((o) => o instanceof Mesh && (o.userData.pick = id))
      this.picks.push({ id, g })
    }
  }

  // ---------- 카메라 ----------
  private portrait() {
    return this.container.clientWidth / Math.max(1, this.container.clientHeight) < HOME_CAMERA.portraitBelow
  }

  private fit() {
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.style.resize(w, h)
    this.camera.aspect = w / h
    const v = this.portrait() ? HOME_CAMERA.tall : HOME_CAMERA.wide
    this.camera.fov = v.fov
    this.camera.updateProjectionMatrix()
    this.tpos.set(v.pos[0], v.pos[1], v.pos[2])
    this.tlook.set(...HOME_CAMERA.look)
    this.cpos.copy(this.tpos)
    this.clook.copy(this.tlook)
  }

  // ---------- 동작 ----------
  toggleLamp() {
    this.lampOn = !this.lampOn
    this.opts.onLamp?.(this.lampOn)
  }

  get isLampOn() {
    return this.lampOn
  }

  /** 키보드·외부에서 사물을 고를 때(1단계: 스탠드·컵만 반응) */
  activate(id: PickId) {
    if (id === 'lamp') this.toggleLamp()
    else if (id === 'mug') this.bumpMug()
  }

  private bumpMug() {
    const g = this.picks.find((p) => p.id === 'mug')?.g
    if (!g || this.opts.reducedMotion) return
    const b = this.bump.get(g)
    this.bump.set(g, { t: 1, y0: b ? b.y0 : g.position.y })
  }

  // ---------- 루프 ----------
  private loop = () => {
    const now = performance.now()
    const dt = Math.min((now - this.last) / 1000, 0.05)
    this.last = now
    const RM = this.opts.reducedMotion
    const P = HOME_CAMERA.pointer
    this.sm.lerp(this.mouse, RM ? 0 : P.lerp)
    this.cpos.lerp(this.tpos, RM ? 1 : HOME_CAMERA.lerp)
    this.clook.lerp(this.tlook, RM ? 1 : HOME_CAMERA.lerp)
    const cam = this.camera
    cam.position.copy(this.cpos)
    cam.position.x += this.sm.x * P.pos[0]
    cam.position.y += this.sm.y * P.pos[1]
    cam.lookAt(this.clook.x + this.sm.x * P.look[0], this.clook.y + this.sm.y * P.look[1], this.clook.z)

    // 호버
    this.ray.setFromCamera(this.mouse, cam)
    const hit = this.ray.intersectObjects(this.picks.map((p) => p.g), true).find((h) => h.object.userData.pick)
    const id = (hit?.object.userData.pick as PickId | undefined) ?? null
    if (id !== this.hover) {
      this.hover = id
      this.renderer.domElement.style.cursor = id ? 'pointer' : 'default'
      this.opts.onHover?.(id)
    }

    // 스탠드 빛(원뿔 불투명도·스포트 세기 lerp .15)
    this.lampV += ((this.lampOn ? 1 : 0) - this.lampV) * 0.15
    if (this.coneMat) this.coneMat.opacity = 0.4 * this.lampV
    if (this.spot) this.spot.intensity = this.lampV * 2200
    this.cabinet?.update()
    // 컵 튀기
    for (const [g, b] of this.bump) {
      b.t = Math.max(0, b.t - dt * 2.5)
      g.position.y = b.y0 + Math.sin(b.t * Math.PI) * 3
      if (b.t === 0) this.bump.delete(g)
    }
    this.style.render()
  }

  /** 사물 중심의 화면 좌표(px). 2단계 HTML 정렬·테스트용 */
  projectPick(id: PickId) {
    const g = this.picks.find((p) => p.id === id)?.g
    if (!g) return null
    const c = new Box3().setFromObject(g).getCenter(new Vector3()).project(this.camera)
    return { x: ((c.x + 1) / 2) * this.container.clientWidth, y: ((1 - c.y) / 2) * this.container.clientHeight }
  }

  /** 개발용 ?tune: 팔레트 · 선 기준(0.3~1.0, 작을수록 선이 많아짐) */
  setPalette(p: CleanPalette) {
    this.style.setPalette(p)
  }
  setEdge(threshold: number) {
    this.style.setEdge(threshold)
  }

  // ---------- 입력 ----------
  private onMove = (e: PointerEvent) => {
    const r = this.renderer.domElement.getBoundingClientRect()
    this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }
  private onLeave = () => {
    this.mouse.set(0, 0)
  }
  private onClick = () => {
    if (this.hover) this.activate(this.hover)
  }

  dispose() {
    this.disposed = true
    this.ro.disconnect()
    this.renderer.setAnimationLoop(null)
    this.renderer.domElement.removeEventListener('pointermove', this.onMove)
    this.renderer.domElement.removeEventListener('pointerleave', this.onLeave)
    this.renderer.domElement.removeEventListener('click', this.onClick)
    this.scene.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose()
        ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m: Material) => m.dispose())
      }
    })
    this.style.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
