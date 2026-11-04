import {
  ACESFilmicToneMapping, AmbientLight, Box3, Color, DirectionalLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three'
import { CABINET_URL, loadGLB } from '../three/loaders'

/**
 * 개발용: cabinet_v3.glb의 drawer1~3가 각각 어느 칸인지 색과 이름표로 보여 준다. (?dev=drawers)
 * 빌드에는 들어가지 않는다(main.tsx에서 import.meta.env.DEV일 때만 불러온다).
 */
const TINT: Record<string, string> = { drawer1: '#e0523f', drawer2: '#3fae6a', drawer3: '#3f7be0' }

export async function mountDrawerCheck(root: HTMLElement) {
  root.innerHTML = ''
  root.style.cssText = 'position:fixed;inset:0;background:#d9d6cf;font:14px/1.4 Inter,system-ui,sans-serif'
  const renderer = new WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setSize(innerWidth, innerHeight)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  root.appendChild(renderer.domElement)

  const scene = new Scene()
  scene.background = new Color('#d9d6cf')
  scene.add(new AmbientLight('#ffffff', 1.2))
  const key = new DirectionalLight('#ffffff', 2)
  key.position.set(1.5, 3, 4)
  scene.add(key)

  const model = await loadGLB(CABINET_URL)
  scene.add(model)
  const camera = new PerspectiveCamera(32, innerWidth / innerHeight, 0.05, 50)
  camera.position.set(0, 1.0, 4.6)
  camera.lookAt(0, 0.98, 0)

  const rows: string[] = []
  model.traverse((o) => {
    if (!(o instanceof Mesh)) return
    const tint = TINT[o.name]
    if (tint) {
      const m = (o.material as MeshStandardMaterial).clone()
      m.color = new Color(tint)
      o.material = m
    }
  })
  renderer.render(scene, camera)

  for (const name of ['drawer3', 'drawer2', 'drawer1']) {
    const node = model.getObjectByName(name)!
    const box = new Box3().setFromObject(node)
    const c = box.getCenter(new Vector3())
    const p = c.clone().project(camera)
    const label = document.createElement('div')
    label.textContent = `${name} · y ${box.min.y.toFixed(2)}–${box.max.y.toFixed(2)}${name === 'drawer2' ? ' ← 가운데 서랍' : ''}`
    label.style.cssText = `position:absolute;left:${((p.x + 1) / 2) * innerWidth}px;top:${((1 - p.y) / 2) * innerHeight}px;transform:translate(-50%,-50%);background:#fff;padding:6px 10px;border-radius:4px;font-weight:600;color:${TINT[name]};box-shadow:0 2px 8px #0003`
    root.appendChild(label)
    rows.push(`${name}: y ${box.min.y.toFixed(3)}–${box.max.y.toFixed(3)}, z front ${box.max.z.toFixed(3)}`)
  }
  const body = new Box3().setFromObject(model.getObjectByName('body')!)
  rows.push(`body: ${body.min.toArray().map((v) => v.toFixed(2))} → ${body.max.toArray().map((v) => v.toFixed(2))}`)
  const info = document.createElement('pre')
  info.id = 'drawer-info'
  info.textContent = rows.join('\n')
  info.style.cssText = 'position:absolute;left:16px;bottom:16px;margin:0;background:#fffd;padding:10px 12px;border-radius:4px'
  root.appendChild(info)
}
