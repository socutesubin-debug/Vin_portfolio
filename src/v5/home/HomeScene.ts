import {
  ACESFilmicToneMapping, Box3, CanvasTexture, Color, DirectionalLight, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, PCFShadowMap, PerspectiveCamera, PlaneGeometry, Raycaster, Scene, ShadowMaterial,
  SRGBColorSpace, Vector2, Vector3, WebGLRenderer, GridHelper,
} from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { gsap } from 'gsap'
import { coverRect, HOME_LIGHT, IMAC, photoCamera, TABLE } from './config'

/**
 * Home 3D 장면 — 사진(V6 배경, HTML img) 위에 투명 캔버스로 겹친다.
 *
 * 'composite'(Home 시안): 책상·수납장 모델은 보이지 않고, 책상 윗면만 ShadowMaterial 평면으로 남아
 *   iMac의 그림자를 사진 위에 떨어뜨린다. 카메라 화각·위치는 photoCamera()로 사진에 맞추고,
 *   화면 자르기는 HTML 배경과 같은 coverRect를 setViewOffset으로 적용한다.
 * 'layout'(3D 배치): 배경을 빼고 table.obj를 보이게 한 뒤 비스듬히 내려다본다.
 *
 * 좌표: 책상 윗면 y = 0, 뒤 모서리(벽 쪽) z = 0, 앞으로 +z, 가운데 x = 0. 단위 m.
 * OBJ에는 재질 파일(.mtl)이 없어 임시 재질을 쓴다(iMac 알루미늄·화면, 책상 흰 상판·회색 다리).
 */
export type HomeMode = 'composite' | 'layout' | 'plan'
export type HomePick = 'imac'

export interface HomeSceneHandle {
  setMode(mode: HomeMode): void
  /** iMac을 화면 앞으로 옮긴 뒤 onArrive */
  focusImac(onArrive: () => void): void
  /** 패널을 닫으면 원래 배치로 */
  reset(): void
  dispose(): void
}

interface Options {
  reducedMotion: boolean
  onPick?: (p: HomePick) => void
  onProgress?: (ratio: number) => void
}

const LAYOUT_VIEW = { pos: new Vector3(1.55, 1.25, 2.55), look: new Vector3(0.05, -0.15, 0.35), fov: 40 }

export class HomeScene implements HomeSceneHandle {
  readonly ready: Promise<void>
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera: PerspectiveCamera
  private photo = photoCamera()
  private imac = new Group()
  private table: Object3D | null = null
  private layoutExtras = new Group()
  private shadowPlane: Mesh
  private pickables: Object3D[] = []
  private anchors = new Map<string, { el: HTMLElement; point: Vector3 }>()
  private ray = new Raycaster()
  private ndc = new Vector2()
  private ro: ResizeObserver
  private tl: gsap.core.Timeline | null = null
  private mode: HomeMode = 'composite'
  private focused = false
  private container: HTMLElement
  private opts: Options
  private loader = new OBJLoader()

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
    this.placePhotoCamera()

    // 빛: 왼쪽 창 햇빛 + 밝은 실내 반사광
    const { sun, sky } = HOME_LIGHT
    this.scene.add(new HemisphereLight(sky.color, sky.ground, sky.intensity))
    const key = new DirectionalLight(sun.color, sun.intensity)
    key.position.set(...sun.position)
    key.target.position.set(0, 0, 0.4)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.2, bottom: -1.2, near: 0.5, far: 8 })
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.015
    key.shadow.radius = 5
    this.scene.add(key, key.target)

    // 책상 윗면: 그림자만 받는 투명 평면(사진 속 책상 위에 정확히 겹친다)
    this.shadowPlane = new Mesh(new PlaneGeometry(4, 3), new ShadowMaterial({ color: new Color('#4a3a28'), opacity: HOME_LIGHT.shadowOpacity }))
    this.shadowPlane.rotation.x = -Math.PI / 2
    this.shadowPlane.position.set(0, 0, 0.6)
    this.shadowPlane.receiveShadow = true
    this.scene.add(this.shadowPlane)

    this.scene.add(this.imac)
    this.buildLayoutExtras()

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)
    this.resize()
    r.domElement.addEventListener('pointermove', this.onMove)
    r.domElement.addEventListener('click', this.onClick)
    this.ready = this.loadImac().then(() => r.setAnimationLoop(this.frame))
  }

  // ---------- 모델 ----------
  private async loadImac() {
    const obj = await this.loader.loadAsync(IMAC.url, (e) => e.total && this.opts.onProgress?.(e.loaded / e.total))
    const body = new MeshStandardMaterial({ color: '#e9eaec', metalness: 0.3, roughness: 0.38 })
    obj.traverse((m) => {
      if (m instanceof Mesh) {
        m.material = body
        m.castShadow = true
        m.receiveShadow = true
        this.pickables.push(m)
        m.userData.pick = 'imac'
      }
    })
    obj.rotation.x = IMAC.rotX
    obj.scale.setScalar(IMAC.scale)
    // 바닥 가운데를 원점으로
    const inner = new Group()
    inner.add(obj)
    const b = new Box3().setFromObject(inner)
    obj.position.set(-b.getCenter(new Vector3()).x, -b.min.y, -b.getCenter(new Vector3()).z)
    this.imac.add(inner)
    this.addScreen(obj)
    this.addContactShadow(b)
    this.applyPlacement()
  }

  /**
   * 화면 판: OBJ가 한 덩어리·한 재질이라 화면을 따로 칠할 수 없어, 앞면 유리 자리에 얇은 판을 덧댄다.
   * 위치는 형상에서 찾는다(위쪽 패널 영역에서 가장 앞쪽 z = 유리 면).
   */
  private addScreen(obj: Object3D) {
    this.imac.updateMatrixWorld(true)
    const inv = this.imac.matrixWorld.clone().invert()
    const box = new Box3().setFromObject(obj).applyMatrix4(inv)
    const h = box.max.y - box.min.y
    let frontZ = -Infinity
    const v = new Vector3()
    obj.traverse((m) => {
      if (!(m instanceof Mesh)) return
      const pos = m.geometry.attributes.position
      for (let i = 0; i < pos.count; i += 3) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv)
        if (v.y > box.min.y + h * 0.35 && v.y < box.max.y - h * 0.03 && Math.abs(v.x) < 0.24) frontZ = Math.max(frontZ, v.z)
      }
    })
    // 24인치 iMac 비율: 패널 폭 0.547 중 화면 약 0.51, 패널 위쪽 약 70%가 화면
    const w = 0.505
    const sh = 0.285
    const screen = new Mesh(new PlaneGeometry(w, sh), new MeshBasicMaterial({ map: screenTexture(), toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }))
    screen.position.set(0, box.max.y - 0.018 - sh / 2, frontZ + 0.002)
    screen.userData.pick = 'imac'
    this.imac.add(screen)
    this.pickables.push(screen)
    this.anchorPoints.imac = new Vector3(0, box.max.y + 0.03, frontZ)
  }

  private anchorPoints: Record<string, Vector3> = {}

  /** 접촉 그림자: 받침·키보드 아래 부드러운 어두운 자국(실시간 그림자만으로는 닿는 느낌이 약하다) */
  private addContactShadow(b: Box3) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64)
    grad.addColorStop(0, 'rgba(40,30,20,1)')
    grad.addColorStop(1, 'rgba(40,30,20,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    const tex = new CanvasTexture(c)
    const mat = new MeshBasicMaterial({ map: tex, transparent: true, opacity: HOME_LIGHT.contactOpacity, depthWrite: false })
    const blob = new Mesh(new PlaneGeometry(1, 1), mat)
    blob.rotation.x = -Math.PI / 2
    const size = b.getSize(new Vector3())
    blob.scale.set(size.x * 0.9, size.z * 1.1, 1)
    blob.position.y = 0.0008
    this.imac.add(blob)
  }

  private async loadTable() {
    if (this.table) return
    const obj = await this.loader.loadAsync(TABLE.url)
    const top = new MeshStandardMaterial({ color: '#eeeae3', roughness: 0.6 })
    obj.traverse((m) => {
      if (m instanceof Mesh) {
        m.material = top
        m.castShadow = m.receiveShadow = true
      }
    })
    // 상판 윗면이 y = 0, 뒤 모서리가 z = 0 근처에 오도록(table.obj 깊이 0.7 — 사진 책상 깊이와 다를 수 있다)
    obj.position.set(0, -TABLE.height, 0.35)
    this.table = obj
    this.scene.add(obj)
    obj.visible = this.mode === 'layout'
  }

  private buildLayoutExtras() {
    const grid = new GridHelper(4, 40, '#9a948a', '#c9c3b8')
    grid.position.y = -TABLE.height
    const wall = new Mesh(new PlaneGeometry(4, 2.4), new MeshStandardMaterial({ color: '#ebe6dd', roughness: 0.95 }))
    wall.position.set(0, 0.45, -0.02)
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
    // 3D 배치에서는 실제 상판이 그림자를 받는다(겹치면 줄무늬가 생긴다)
    this.shadowPlane.visible = !layout
    if (layout) void this.loadTable().then(() => this.table && (this.table.visible = true))
    else if (this.table) this.table.visible = false
    this.renderer.setClearColor(layout ? 0xdcd7cf : 0x000000, layout ? 1 : 0)
    this.resize()
  }

  private wide() {
    return this.container.clientWidth / Math.max(1, this.container.clientHeight) >= 0.8
  }

  private applyPlacement() {
    const p = this.wide() ? IMAC.wide : IMAC.tall
    if (this.focused) return
    this.imac.position.set(p.x, 0, p.z)
    this.imac.rotation.set(0, p.rotY, 0)
    this.imac.scale.setScalar(p.scale)
  }

  // ---------- iMac 선택 ----------
  focusImac(onArrive: () => void) {
    if (this.focused) return onArrive()
    this.focused = true
    this.tl?.kill()
    if (this.opts.reducedMotion || this.mode !== 'composite') return onArrive()
    const f = this.wide() ? IMAC.focus.wide : IMAC.focus.tall
    // 카메라에서 화면 위치(ndc)로 뻗은 선 위 dist 지점 → 그 아래 책상 위로(공중에 뜨지 않게 y는 0 근처)
    const dir = new Vector3(f.ndcX, f.ndcY, 0.5).unproject(this.camera).sub(this.camera.position).normalize()
    const target = this.camera.position.clone().addScaledVector(dir, f.dist)
    const d = IMAC.focus.duration
    this.tl = gsap
      .timeline({ onComplete: onArrive })
      .to(this.imac.position, { x: target.x, z: Math.min(target.z, this.photo.z - 0.45), y: 0, duration: d, ease: 'power3.inOut' }, 0)
      .to(this.imac.rotation, { y: 0, duration: d * 0.8, ease: 'power2.inOut' }, 0)
  }

  reset() {
    if (!this.focused) return
    this.focused = false
    this.tl?.kill()
    const p = this.wide() ? IMAC.wide : IMAC.tall
    if (this.opts.reducedMotion) return this.applyPlacement()
    this.tl = gsap
      .timeline()
      .to(this.imac.position, { x: p.x, y: 0, z: p.z, duration: 0.6, ease: 'power2.inOut' }, 0)
      .to(this.imac.rotation, { y: p.rotY, duration: 0.6, ease: 'power2.inOut' }, 0)
  }

  bindAnchor(id: string, el: HTMLElement | null) {
    if (el && this.anchorPoints[id]) this.anchors.set(id, { el, point: this.anchorPoints[id] })
    else this.anchors.delete(id)
  }

  // ---------- 루프·배치 ----------
  private placePhotoCamera() {
    const c = this.camera
    c.fov = this.photo.fov
    c.aspect = this.photo.aspect
    c.position.set(0, this.photo.height, this.photo.z)
    c.lookAt(0, this.photo.height, 0) // 수평
  }

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
      // 사진 전체 = 카메라 프레임. HTML 배경과 같은 영역만 잘라 보여 준다
      this.placePhotoCamera()
      const r = coverRect(w, h)
      c.setViewOffset(r.width, r.height, -r.x, -r.y, w, h)
    }
    c.updateProjectionMatrix()
    this.applyPlacement()
  }

  private tmp = new Vector3()
  private frame = () => {
    this.renderer.render(this.scene, this.camera)
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.imac.updateMatrixWorld()
    for (const { el, point } of this.anchors.values()) {
      this.tmp.copy(point).applyMatrix4(this.imac.matrixWorld).project(this.camera)
      el.style.transform = `translate(${((this.tmp.x + 1) / 2) * w}px, ${((1 - this.tmp.y) / 2) * h}px)`
      el.style.visibility = this.focused ? 'hidden' : ''
    }
  }

  // ---------- 입력 ----------
  private hit(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.ray.setFromCamera(this.ndc, this.camera)
    return this.ray.intersectObjects(this.pickables, false)[0]?.object.userData.pick as HomePick | undefined
  }
  private onMove = (e: PointerEvent) => {
    this.renderer.domElement.style.cursor = !this.focused && this.hit(e) ? 'pointer' : ''
  }
  private onClick = (e: MouseEvent) => {
    const pick = !this.focused && this.hit(e)
    if (pick) this.opts.onPick?.(pick)
  }

  dispose() {
    this.tl?.kill()
    this.ro.disconnect()
    this.renderer.setAnimationLoop(null)
    this.renderer.domElement.removeEventListener('pointermove', this.onMove)
    this.renderer.domElement.removeEventListener('click', this.onClick)
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

/** 화면 그림(자리표시): 어두운 바탕에 VIN · 이력서 안내 */
function screenTexture() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 578
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 1024, 578)
  grad.addColorStop(0, '#1d2433')
  grad.addColorStop(1, '#3a3f58')
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 578)
  g.fillStyle = 'rgba(255,255,255,0.92)'
  g.font = '300 92px Inter, Arial, sans-serif'
  g.textAlign = 'center'
  g.fillText('Vision INside', 512, 270)
  g.font = '500 34px Inter, Arial, sans-serif'
  g.fillStyle = 'rgba(255,255,255,0.65)'
  g.fillText('RESUME  →', 512, 350)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}
