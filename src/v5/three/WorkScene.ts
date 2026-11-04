import {
  ACESFilmicToneMapping, AmbientLight, BoxGeometry, CanvasTexture, Color, DirectionalLight, Group, HemisphereLight,
  Mesh, MeshStandardMaterial, Object3D, PCFShadowMap, PerspectiveCamera, PlaneGeometry,
  PMREMGenerator, Raycaster, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { gsap } from 'gsap'
import { CABINET_URL, loadGLB } from './loaders'

/**
 * Work · 철제 수납장 (cabinet_v3.glb)
 *
 * GLB 실측(?dev=drawers로 확인): 폭 1.36 · 높이 1.89 · 정면 +Z(앞판 z 0.706).
 * drawer1 = 아래(y 0.28–0.79), drawer2 = 가운데(y 0.82–1.32), drawer3 = 위(y 1.35–1.84). 서랍은 앞판만 있어
 * 안쪽 트레이와 파일은 코드로 만들어 drawer2와 한 그룹으로 묶어 움직인다. 양옆 수납장은 같은 모델의 배경 복제본.
 */
export const DRAWER = {
  node: 'drawer2',
  y: [0.82, 1.324] as const,
  /** 열렸을 때 앞으로 나오는 거리(m). 파일 탭이 보일 만큼만 */
  openZ: 0.68,
  trayWidth: 1.12,
  trayDepth: 0.95,
  frontInnerZ: 0.58,
  wall: 0.018,
  /** 서랍 열림 시간(s) — 기획 450–600ms */
  openDuration: 0.5,
}

/** 카메라: 닫힘은 가운데 서랍 정면. 열림은 아주 조금 올라가 살짝 내려다본다(0.45s) */
const CAMERA = {
  fov: 30,
  lookY: 1.1,
  /** 데스크톱에서 화면에 담을 세로 높이(m) — 수납장이 화면을 채우도록 */
  frameHeight: 1.9,
  /** 세로 화면에서 담을 가로 폭(m) — 가운데 수납장 폭 + 여유 */
  frameWidth: 1.5,
  open: { rise: 0.3, lookDrop: 0.1, push: 0.15, duration: 0.45 },
}

/** 파일 탭 꺼냄(기획 350–500ms) */
const PICK = { lift: 0.12, duration: 0.38 }

export interface FileTab {
  id: string
  label: string
  count: number
  color: string
}

export type WorkAnchor = 'drawer' | `tab:${string}`

interface Options {
  tabs: FileTab[]
  reducedMotion: boolean
  onProgress?: (ratio: number) => void
  /** 3D 사물을 클릭·탭했을 때 */
  onPick?: (target: WorkAnchor) => void
}

const CABINET_PITCH = 1.37

export class WorkScene {
  readonly ready: Promise<void>
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(CAMERA.fov, 1, 0.05, 60)
  private drawer = new Group()
  private tabs = new Map<string, Group>()
  private pickables: Object3D[] = []
  private anchors = new Map<WorkAnchor, HTMLElement>()
  private anchorPoints = new Map<WorkAnchor, Vector3>()
  private ray = new Raycaster()
  private ndc = new Vector2()
  private ro: ResizeObserver
  private base = { pos: new Vector3(), look: new Vector3() }
  private look = new Vector3()
  /** 0 = 닫힘, 1 = 열림. 카메라 보간에 쓴다 */
  private openness = { v: 0 }
  private tl: gsap.core.Timeline | null = null
  private hovered: Object3D | null = null
  private disposed = false
  isOpen = false

  private container: HTMLElement
  private opts: Options

  constructor(container: HTMLElement, opts: Options) {
    this.container = container
    this.opts = opts
    const r = (this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }))
    r.setPixelRatio(Math.min(devicePixelRatio, 2))
    r.outputColorSpace = SRGBColorSpace
    r.toneMapping = ACESFilmicToneMapping
    r.toneMappingExposure = 0.82
    r.shadowMap.enabled = true
    r.shadowMap.type = PCFShadowMap
    r.domElement.className = 'v5-canvas'
    container.appendChild(r.domElement)

    const pm = new PMREMGenerator(r)
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.4
    pm.dispose()
    this.scene.background = new Color('#5b5c50')
    this.buildRoom()

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)
    this.resize()

    r.domElement.addEventListener('pointermove', this.onMove)
    r.domElement.addEventListener('click', this.onClick)
    this.ready = this.load()
  }

  // ---------- 구성 ----------
  private buildRoom() {
    const wall = new Mesh(new PlaneGeometry(20, 8), new MeshStandardMaterial({ color: '#6a6b5d', roughness: 0.95 }))
    wall.position.set(0, 3, -0.76)
    wall.receiveShadow = true
    const floor = new Mesh(new PlaneGeometry(20, 10), new MeshStandardMaterial({ color: '#3b3a33', roughness: 0.9 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(wall, floor)

    this.scene.add(new HemisphereLight('#fff4e2', '#3a3328', 0.55))
    this.scene.add(new AmbientLight('#ffffff', 0.15))
    // 왼쪽 위 앞에서 들어오는 주광(창 쪽). 서랍이 나오면 앞판 아래로 그림자가 떨어진다
    const key = new DirectionalLight('#fff1dc', 1.9)
    key.position.set(-2.2, 3.6, 3.4)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -2.5
    key.shadow.camera.right = 2.5
    key.shadow.camera.top = 2.6
    key.shadow.camera.bottom = -0.5
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.02
    key.shadow.radius = 4
    this.scene.add(key)
    const rim = new DirectionalLight('#dfe8ff', 0.35)
    rim.position.set(3, 2, 2)
    this.scene.add(rim)
  }

  private async load() {
    const src = await loadGLB(CABINET_URL, this.opts.onProgress)
    if (this.disposed) return
    const shadowed = (o: Object3D) =>
      o.traverse((m) => {
        if (m instanceof Mesh) {
          m.castShadow = true
          m.receiveShadow = true
        }
      })

    // 가운데 = 조작하는 수납장. 양옆 2개씩은 배경(같은 형상 공유, 약간 어둡게)
    const main = src.clone(true)
    shadowed(main)
    this.scene.add(main)
    for (const i of [-2, -1, 1, 2]) {
      const side = src.clone(true)
      side.position.x = i * CABINET_PITCH
      shadowed(side)
      this.scene.add(side)
    }

    // drawer2를 움직이는 그룹으로 옮긴다(월드 위치 유지)
    const front = main.getObjectByName(DRAWER.node)
    if (!front) throw new Error(`${DRAWER.node} 노드가 없습니다`)
    main.add(this.drawer)
    this.drawer.attach(front)
    const frontMat = (front as Mesh).material as MeshStandardMaterial
    this.buildTray(frontMat)
    this.buildFiles()
    this.pickables.push(front)
    front.userData.pick = 'drawer'

    this.anchorPoints.set('drawer', new Vector3(0, 1.1, 0.72))
    this.renderer.setAnimationLoop(this.frame)
  }

  /** 서랍 안쪽 상자(GLB에는 앞판만 있다). 앞판 색을 따라 칠한다 */
  private buildTray(frontMat: MeshStandardMaterial) {
    const { trayDepth: d, trayWidth: w, frontInnerZ, wall: t, y } = DRAWER
    const tone = new Color('#1f2c8a')
    if (frontMat.color) tone.multiply(frontMat.color)
    const side = new MeshStandardMaterial({ color: tone, roughness: 0.55, metalness: 0.35 })
    const floor = new MeshStandardMaterial({ color: tone.clone().multiplyScalar(0.7), roughness: 0.8 })
    const bottom = y[0] + 0.05
    const h = y[1] - y[0] - 0.12
    const zc = frontInnerZ - d / 2
    const box = (mat: MeshStandardMaterial, sx: number, sy: number, sz: number, x: number, yy: number, z: number) => {
      const m = new Mesh(new BoxGeometry(sx, sy, sz), mat)
      m.position.set(x, yy, z)
      m.castShadow = m.receiveShadow = true
      this.drawer.add(m)
    }
    box(floor, w, t, d, 0, bottom, zc)
    box(side, t, h, d, -w / 2 + t / 2, bottom + h / 2, zc)
    box(side, t, h, d, w / 2 - t / 2, bottom + h / 2, zc)
    box(side, w, h, t, 0, bottom + h / 2, frontInnerZ - d + t / 2)
    box(side, w, h, t, 0, bottom + h / 2, frontInnerZ - t / 2 - 0.004)
  }

  /**
   * 분류 칸막이 파일(탭 = 분류 이름 + 실제 프로젝트 수) + 그 뒤에 프로젝트 수만큼 얇은 파일.
   * 탭은 앞판 위로 올라와 서랍이 조금만 열려도 보인다.
   */
  private buildFiles() {
    const kraft = new MeshStandardMaterial({ color: '#d9c59b', roughness: 0.85 })
    const kraftDark = new MeshStandardMaterial({ color: '#c7b085', roughness: 0.85 })
    const inner = DRAWER.trayWidth - 0.08
    const folderBottom = DRAWER.y[0] + 0.07
    const folderTop = 1.3
    const folderH = folderTop - folderBottom
    const tabH = 0.14
    const tabW = 0.27
    const { tabs } = this.opts
    const xs = tabs.length === 1 ? [0] : tabs.map((_, i) => -0.34 + (0.68 * i) / (tabs.length - 1))
    let z = DRAWER.frontInnerZ - 0.12
    // 칸막이 간격: 서랍이 openZ만큼 나왔을 때 맨 뒤 탭까지 몸체 밖으로 나오도록 촘촘하게
    const step = 0.15

    tabs.forEach((tab, i) => {
      const g = new Group()
      g.position.z = z
      const folder = new Mesh(new BoxGeometry(inner, folderH, 0.012), kraft)
      folder.position.y = folderBottom + folderH / 2
      folder.castShadow = folder.receiveShadow = true
      const tabMat = new MeshStandardMaterial({ map: labelTexture(tab), roughness: 0.6 })
      const tabMesh = new Mesh(new BoxGeometry(tabW, tabH, 0.014), [kraft, kraft, kraft, kraft, tabMat, tabMat])
      tabMesh.position.set(xs[i], folderTop + tabH / 2 - 0.01, 0)
      tabMesh.castShadow = true
      tabMesh.userData.pick = `tab:${tab.id}`
      folder.userData.pick = `tab:${tab.id}`
      g.add(folder, tabMesh)
      this.drawer.add(g)
      this.tabs.set(tab.id, g)
      this.pickables.push(tabMesh, folder)
      this.anchorPoints.set(`tab:${tab.id}`, new Vector3(xs[i], folderTop + tabH / 2, z))

      // 분류 안의 프로젝트 파일(수 = 실제 데이터 수)
      for (let k = 0; k < tab.count; k++) {
        const f = new Mesh(new BoxGeometry(inner - 0.02, folderH - 0.05 - (k % 2) * 0.02, 0.008), k % 2 ? kraftDark : kraft)
        f.position.set(0, folderBottom + (folderH - 0.05) / 2, z - 0.03 - k * ((step - 0.05) / Math.max(1, tab.count)))
        f.receiveShadow = true
        this.drawer.add(f)
      }
      z -= step
    })
  }

  // ---------- 동작 ----------
  /** 서랍 열기: 앞으로 미끄러짐 + 카메라 아주 조금 올라가 내려다봄(겹쳐 재생) */
  open(onDone?: () => void) {
    if (this.isOpen) return onDone?.()
    this.isOpen = true
    this.play(1, onDone)
  }

  close(onDone?: () => void) {
    if (!this.isOpen) return onDone?.()
    this.isOpen = false
    this.tabs.forEach((g) => (g.position.y = 0))
    this.play(0, onDone)
  }

  private play(to: 0 | 1, onDone?: () => void) {
    this.tl?.kill()
    if (this.opts.reducedMotion) {
      this.drawer.position.z = to * DRAWER.openZ
      this.openness.v = to
      onDone?.()
      return
    }
    const tl = (this.tl = gsap.timeline({ onComplete: onDone }))
    tl.to(this.drawer.position, { z: to * DRAWER.openZ, duration: DRAWER.openDuration, ease: to ? 'power3.out' : 'power2.inOut' }, 0)
    tl.to(this.openness, { v: to, duration: CAMERA.open.duration, ease: 'power2.out' }, to ? 0.05 : 0)
  }

  /** 파일 탭 선택: 파일이 위로 살짝 빠져나온 뒤 onDone(목록으로 전환) */
  pick(tabId: string, onDone: () => void) {
    const g = this.tabs.get(tabId)
    if (!g || !this.isOpen) return onDone()
    this.tl?.kill()
    if (this.opts.reducedMotion) return onDone()
    this.tl = gsap.timeline({ onComplete: onDone }).to(g.position, { y: PICK.lift, z: g.position.z + 0.04, duration: PICK.duration, ease: 'power2.out' })
  }

  /** 3D 위치에 HTML 버튼을 붙인다(키보드·스크린리더용 실제 버튼) */
  bindAnchor(id: WorkAnchor, el: HTMLElement | null) {
    if (el) this.anchors.set(id, el)
    else this.anchors.delete(id)
  }

  // ---------- 루프 ----------
  private frame = () => {
    const o = this.openness.v
    const c = CAMERA.open
    this.camera.position.set(this.base.pos.x, this.base.pos.y + c.rise * o, this.base.pos.z - c.push * o)
    this.look.set(this.base.look.x, this.base.look.y - c.lookDrop * o, this.base.look.z)
    this.camera.lookAt(this.look)
    this.renderer.render(this.scene, this.camera)
    this.placeAnchors()
  }

  private tmp = new Vector3()
  private placeAnchors() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.drawer.updateMatrixWorld()
    for (const [id, el] of this.anchors) {
      const p = this.anchorPoints.get(id)
      if (!p) continue
      this.tmp.copy(p)
      if (id !== 'drawer') this.tmp.applyMatrix4(this.drawer.matrixWorld)
      else this.tmp.z += this.drawer.position.z
      this.tmp.project(this.camera)
      el.style.transform = `translate(${((this.tmp.x + 1) / 2) * w}px, ${((1 - this.tmp.y) / 2) * h}px)`
    }
  }

  private resize() {
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.renderer.setSize(w, h, false)
    const aspect = w / h
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
    // 세로 높이와 가로 폭 중 더 멀리 물러나야 하는 쪽에 맞춘다
    const t = Math.tan((CAMERA.fov * Math.PI) / 360)
    const dist = Math.max(CAMERA.frameHeight / 2 / t, CAMERA.frameWidth / 2 / (t * aspect))
    // 세로 화면은 위쪽 UI(메뉴)를 피해 수납장을 조금 아래에 둔다
    const lookY = CAMERA.lookY + (aspect < 0.8 ? 0.12 : 0)
    this.base.pos.set(0, CAMERA.lookY, 0.706 + dist)
    this.base.look.set(0, lookY, 0)
  }

  // ---------- 입력 ----------
  private hit(e: PointerEvent | MouseEvent): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.ray.setFromCamera(this.ndc, this.camera)
    const hits = this.ray.intersectObjects(this.pickables, false)
    const pick = hits[0]?.object.userData.pick as string | undefined
    if (!pick) return null
    // 닫혀 있을 때는 서랍만, 열려 있을 때는 파일만 고를 수 있다
    if (!this.isOpen) return pick === 'drawer' ? pick : null
    return pick.startsWith('tab:') ? pick : null
  }

  private onMove = (e: PointerEvent) => {
    const pick = this.hit(e)
    this.renderer.domElement.style.cursor = pick ? 'pointer' : ''
    const target = pick?.startsWith('tab:') ? this.tabs.get(pick.slice(4)) ?? null : null
    if (target !== this.hovered) {
      if (this.hovered && this.isOpen) gsap.to(this.hovered.position, { y: 0, duration: 0.2 })
      if (target && !this.opts.reducedMotion) gsap.to(target.position, { y: 0.025, duration: 0.2 })
      this.hovered = target
    }
  }

  private onClick = (e: MouseEvent) => {
    const pick = this.hit(e)
    if (pick) this.opts.onPick?.(pick as WorkAnchor)
  }

  dispose() {
    this.disposed = true
    this.tl?.kill()
    this.ro.disconnect()
    this.renderer.setAnimationLoop(null)
    this.renderer.domElement.removeEventListener('pointermove', this.onMove)
    this.renderer.domElement.removeEventListener('click', this.onClick)
    // 공유 형상(GLB 캐시)은 남겨 두고, 이 장면에서 만든 것만 정리한다
    this.drawer.traverse((m) => {
      if (m instanceof Mesh && m.name !== DRAWER.node) {
        m.geometry.dispose()
        ;(Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => {
          ;(mat as MeshStandardMaterial).map?.dispose()
          mat.dispose()
        })
      }
    })
    this.scene.environment?.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

/** 탭 라벨: 분류 이름 + 수 */
function labelTexture(tab: FileTab) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 224
  const g = c.getContext('2d')!
  g.fillStyle = '#efe3c6'
  g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = tab.color
  g.fillRect(0, 0, c.width, 34)
  g.fillStyle = '#1c1d1f'
  g.font = '600 92px Inter, Arial, sans-serif'
  g.textBaseline = 'middle'
  g.fillText(tab.label, 30, 128)
  g.font = '500 50px Inter, Arial, sans-serif'
  g.textAlign = 'right'
  g.fillStyle = '#55575c'
  g.fillText(String(tab.count), c.width - 30, 132)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

