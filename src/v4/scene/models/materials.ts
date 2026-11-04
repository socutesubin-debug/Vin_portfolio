import {
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  type Texture,
} from 'three'

/**
 * V4 근접 사물 재질. 사물마다 반사·거칠기·표면 결을 다르게 준다.
 * 결(요철·브러시 자국·종이 섬유)은 캔버스로 만든 절차 텍스처 — 외부 이미지 없이 만든 임시 결이다.
 * 한 번만 만들어 여러 사물이 같이 쓴다.
 */

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function canvasTex(size: number, draw: (img: ImageData, r: () => number) => void, seed: number, repeat: [number, number]) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  draw(img, rng(seed))
  ctx.putImageData(img, 0, 0)
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(...repeat)
  t.colorSpace = NoColorSpace
  t.anisotropy = 8
  return t
}

/** 플라스틱 미세 요철(오렌지 껍질 같은 사출 표면): 고운 점 + 약한 얼룩 */
function grainTexture(repeat: [number, number]) {
  return canvasTex(
    256,
    (img, r) => {
      const n = img.width
      const blob = Array.from({ length: (n / 8) ** 2 }, () => r())
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const b = blob[Math.floor(y / 8) * (n / 8) + Math.floor(x / 8)]
          const v = 150 + (r() - 0.5) * 70 + (b - 0.5) * 30
          const i = (y * n + x) * 4
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v
          img.data[i + 3] = 255
        }
    },
    7,
    repeat,
  )
}

/** 브러시드 메탈: 한 방향(가로) 긴 자국. 거칠기 맵 겸 요철 */
function brushedTexture(repeat: [number, number]) {
  return canvasTex(
    512,
    (img, r) => {
      const n = img.width
      for (let y = 0; y < n; y++) {
        const row = (r() - 0.5) * 50
        let streak = 0
        for (let x = 0; x < n; x++) {
          if (r() < 0.02) streak = (r() - 0.5) * 40
          const v = 200 + row + streak + (r() - 0.5) * 16
          const i = (y * n + x) * 4
          img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v))
          img.data[i + 3] = 255
        }
      }
    },
    13,
    repeat,
  )
}

/** 종이 섬유: 고운 잡음 + 짧은 섬유 */
function paperTexture(repeat: [number, number]) {
  return canvasTex(
    256,
    (img, r) => {
      const n = img.width
      for (let i = 0; i < n * n; i++) {
        const v = 170 + (r() - 0.5) * 60
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
        img.data[i * 4 + 3] = 255
      }
      for (let k = 0; k < 900; k++) {
        let x = r() * n
        let y = r() * n
        const a = r() * Math.PI
        const d = r() > 0.5 ? 30 : -30
        for (let s = 0; s < 6; s++) {
          const i = ((Math.floor(y) & (n - 1)) * n + (Math.floor(x) & (n - 1))) * 4
          img.data[i] = img.data[i + 1] = img.data[i + 2] = img.data[i] + d
          x += Math.cos(a)
          y += Math.sin(a)
        }
      }
    },
    21,
    repeat,
  )
}

let cache: ReturnType<typeof build> | null = null

function build() {
  const grain = grainTexture([6, 6])
  const grainFine = grainTexture([14, 14])
  const brushed = brushedTexture([2, 6])
  const paper = paperTexture([3, 3])

  /** 베이지 사출 플라스틱: 무광에 가까운 반광, 미세 요철 */
  const plastic = (color: string, map: Texture = grain) =>
    new MeshPhysicalMaterial({
      color,
      roughness: 0.58,
      roughnessMap: map,
      bumpMap: map,
      bumpScale: 0.35,
      specularIntensity: 0.45,
      sheen: 0.15,
      sheenRoughness: 0.8,
      sheenColor: new Color('#fff4e0'),
    })

  /** 도장 금속(스탠드·전화기): 고른 색 + 부드럽고 넓은 클리어코트 하이라이트 */
  const paint = (color: string) =>
    new MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0.05, clearcoat: 0.85, clearcoatRoughness: 0.22 })

  return {
    textures: { grain, grainFine, brushed, paper },
    beige: plastic('#e7ddc7'),
    beigeLight: plastic('#efe7d4', grainFine),
    beigeDark: plastic('#d3c7ab'),
    beigeShade: plastic('#c3b697'),
    /** 키캡(조금 더 매끈) */
    keyLight: plastic('#efe8d6', grainFine),
    keyDark: plastic('#b9b19f', grainFine),
    /** 검은 플라스틱(드라이브 베이 등) */
    blackPlastic: new MeshPhysicalMaterial({ color: '#141516', roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    /** 브러시드 스틸 상판: 넓고 부드러운 반사, 한 방향 결(이방성) */
    brushedSteel: new MeshPhysicalMaterial({
      color: '#c9ccd0',
      metalness: 1,
      roughness: 0.34,
      roughnessMap: brushed,
      anisotropy: 0.7,
      anisotropyRotation: 0,
    }),
    /** 짙은 도장 철(다리·프레임) */
    steelDark: new MeshPhysicalMaterial({ color: '#80858b', metalness: 0.7, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    chrome: new MeshStandardMaterial({ color: '#dfe2e6', metalness: 1, roughness: 0.14 }),
    paintYellow: paint('#d9a21b'),
    paintRed: paint('#a3221f'),
    /** 유약 바른 도자기: 바탕은 약간 거칠고 유약층이 또렷한 하이라이트 */
    ceramic: new MeshPhysicalMaterial({ color: '#f2eee6', roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 0.6 }),
    /** 종이(노트·명함): 무광 + 섬유 요철 */
    paper: new MeshStandardMaterial({ color: '#f4efe3', roughness: 0.95, bumpMap: paper, bumpScale: 0.6 }),
    coffee: new MeshPhysicalMaterial({ color: '#2a190f', roughness: 0.08, clearcoat: 1 }),
  }
}

export type V4Materials = ReturnType<typeof build>

/** 공용 재질(처음 부를 때 만든다) */
export function v4Materials() {
  return (cache ??= build())
}

