import { LoadingManager, type Group } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/**
 * 모델 로더. 이 파일은 Work·Contact 화면에 들어갈 때 동적 import로만 불러온다(첫 로딩에 three.js가 들어가지 않는다).
 * cabinet_v3.glb는 EXT_meshopt_compression + KHR_mesh_quantization + EXT_texture_webp라 MeshoptDecoder가 필요하다.
 */
export const CABINET_URL = '/models/cabinet_v3.glb'

const cache = new Map<string, Promise<Group>>()

export function loadGLB(url: string, onProgress?: (ratio: number) => void): Promise<Group> {
  const hit = cache.get(url)
  if (hit) return hit
  const manager = new LoadingManager()
  const loader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder)
  const p = new Promise<Group>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      (e) => e.total && onProgress?.(e.loaded / e.total),
      reject,
    )
  })
  // 실패하면 다음 방문에서 다시 시도할 수 있게 캐시에서 뺀다
  p.catch(() => cache.delete(url))
  cache.set(url, p)
  return p
}
