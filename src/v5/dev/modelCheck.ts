import {
  AmbientLight, AxesHelper, Box3, Color, DirectionalLight, GridHelper, Group, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

/**
 * 개발용: public/models/home/의 OBJ 방향·크기 확인 (?dev=models[&view=front|side|top])
 * 빌드에는 들어가지 않는다.
 */
const FILES = [
  { url: '/models/home/imac.obj', rotX: -Math.PI / 2, scale: 0.547 / 6.5 },
  { url: '/models/home/table.obj', rotX: 0, scale: 1 },
  { url: '/models/home/desk_lamp.obj', rotX: 0, scale: 1 },
]

export async function mountModelCheck(root: HTMLElement) {
  root.innerHTML = ''
  root.style.cssText = 'position:fixed;inset:0;font:13px/1.4 Inter,system-ui,sans-serif'
  const r = new WebGLRenderer({ antialias: true })
  r.setPixelRatio(Math.min(devicePixelRatio, 2))
  r.setSize(innerWidth, innerHeight)
  r.outputColorSpace = SRGBColorSpace
  root.appendChild(r.domElement)
  const scene = new Scene()
  scene.background = new Color('#dcd8d0')
  scene.add(new AmbientLight('#fff', 1.1))
  const key = new DirectionalLight('#fff', 2)
  key.position.set(1, 2, 3)
  scene.add(key, new GridHelper(4, 40, '#888', '#bbb'), new AxesHelper(0.5))

  const info: string[] = []
  const loader = new OBJLoader()
  let x = -1.1
  for (const f of FILES) {
    const obj = await loader.loadAsync(f.url)
    obj.traverse((m) => {
      if (m instanceof Mesh) m.material = new MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.5, metalness: 0.2 })
    })
    const g = new Group()
    obj.rotation.x = f.rotX
    obj.scale.setScalar(f.scale)
    g.add(obj)
    const b = new Box3().setFromObject(g)
    g.position.set(x - b.getCenter(new Vector3()).x, -b.min.y, 0)
    scene.add(g)
    const s = b.getSize(new Vector3())
    info.push(`${f.url.split('/').pop()}: 크기 ${s.toArray().map((v) => v.toFixed(3)).join(' × ')} m, 중심 z ${b.getCenter(new Vector3()).z.toFixed(3)}`)
    x += 1.1
  }
  const view = new URLSearchParams(location.search).get('view') ?? 'front'
  const cam = new PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 50)
  const pos = { front: [0, 0.6, 3.6], side: [3.6, 0.6, 0], top: [0, 4, 0.01] }[view] as [number, number, number]
  cam.position.set(...pos)
  cam.lookAt(0, 0.35, 0)
  r.render(scene, cam)
  const pre = document.createElement('pre')
  pre.id = 'model-info'
  pre.textContent = `view=${view} (카메라 +Z 쪽에서 봄 = 정면)\n` + info.join('\n')
  pre.style.cssText = 'position:absolute;left:12px;bottom:12px;margin:0;background:#fffd;padding:8px 10px;border-radius:4px'
  root.appendChild(pre)
}
