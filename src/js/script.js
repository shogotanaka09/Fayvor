import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import * as THREE from 'three'

window.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(ScrollTrigger)

  function opening() {
    const openingEl = document.querySelector('.js-opening')
    const openingCatchEl = document.querySelector('.js-opening-catch')
    if (!openingEl || !openingCatchEl) return

    const tl = gsap.timeline()
    const spans = openingCatchEl.querySelectorAll('span')

    tl.to(spans, {
      yPercent: 0,
      duration: 0.1,
      ease: 'power2.out'
    })

    tl.to(
      spans,
      {
        yPercent: (index) => (index % 2 === 0 ? -105 : 105),
        duration: 1.5,
        stagger: 0
      },
      '+=0.8'
    )

    tl.to(
      spans,
      {
        yPercent: (index) => (index % 2 === 0 ? -210 : 210),
        duration: 1.5,
        stagger: 0
      },
      '+=0.8'
    )

    tl.to(
      openingEl,
      {
        yPercent: -105,
        duration: 1.2,
        ease: 'power2.inOut'
      },
      '+=0.8'
    )

    // 4. 最後にopacityを0に
    tl.to(openingEl, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        document.body.classList.remove('is-fixed')
      }
    })
  }
  opening()

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // スマートフォンでない場合のみLenisを初期化
  let lenis
  if (!isMobile) {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)
  }

  function initPagination() {
    const pagination = document.querySelector('.js-pagination')
    const paginationNum = pagination.querySelector('.js-pagination-num')
    if (!pagination || !paginationNum) return

    const imgItems = document.querySelectorAll('.js-img-item')
    if (!imgItems.length) return

    // 現在表示中の画像のインデックスを取得する関数
    const getCurrentIndex = () => {
      const viewportCenter = window.innerHeight / 2
      let currentIndex = 0
      let minDistance = Infinity

      imgItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect()
        const itemCenter = rect.top + rect.height / 2
        const distance = Math.abs(viewportCenter - itemCenter)

        if (distance < minDistance) {
          minDistance = distance
          currentIndex = index
        }
      })

      return currentIndex
    }

    // 数字を更新する関数
    const updateNumber = (index) => {
      const newNumber = `( ${String(index + 1).padStart(2, '0')} )`
      const currentNumber = paginationNum.textContent

      if (currentNumber === newNumber) return

      // フェードアウト
      gsap.to(paginationNum, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          // 数字を更新
          paginationNum.textContent = newNumber
          // フェードイン
          gsap.to(paginationNum, {
            opacity: 1,
            duration: 0.3
          })
        }
      })
    }

    let lastIndex = getCurrentIndex()
    let ticking = false

    // スクロール時に数字を更新
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentIndex = getCurrentIndex()
          if (currentIndex !== lastIndex) {
            updateNumber(currentIndex)
            lastIndex = currentIndex
          }
          ticking = false
        })
        ticking = true
      }
    })

    // 初期表示時にも数字を設定
    updateNumber(getCurrentIndex())
  }

  initPagination()

  function initWebGL() {
    const canvasEl = document.getElementById('webgl-canvas')
    const canvasSize = {
      w: window.innerWidth,
      h: window.innerHeight
    }

    const renderer = new THREE.WebGLRenderer({ canvas: canvasEl })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(canvasSize.w, canvasSize.h)

    // ウィンドウとwebGLの座標を一致させるため、描画がウィンドウぴったりになるようカメラを調整
    const fov = 60 // 視野角
    const fovRad = (fov / 2) * (Math.PI / 180)
    const dist = canvasSize.h / 2 / Math.tan(fovRad)
    const camera = new THREE.PerspectiveCamera(fov, canvasSize.w / canvasSize.h, 0.1, 2000)
    camera.position.z = dist

    const scene = new THREE.Scene()

    const loader = new THREE.TextureLoader()

    // 画像をテクスチャにしたplaneを扱うクラス
    class ImagePlane {
      constructor(mesh, img) {
        this.refImage = img
        this.mesh = mesh
      }

      setParams() {
        // 参照するimg要素から大きさ、位置を取得してセット
        const rect = this.refImage.getBoundingClientRect()

        this.mesh.scale.x = rect.width
        this.mesh.scale.y = rect.height

        const x = rect.left - canvasSize.w / 2 + rect.width / 2
        const y = -rect.top + canvasSize.h / 2 - rect.height / 2
        this.mesh.position.set(x, y, this.mesh.position.z)
      }

      update(offset) {
        this.setParams()

        this.mesh.material.uniforms.uTime.value = offset
      }
    }

    // Planeメッシュを作る関数
    const createMesh = (img) => {
      const texture = loader.load(img.src)

      const uniforms = {
        uTexture: { value: texture },
        uImageAspect: { value: img.naturalWidth / img.naturalHeight },
        uPlaneAspect: { value: img.clientWidth / img.clientHeight },
        uTime: { value: 0 }
      }
      const geo = new THREE.PlaneGeometry(1, 1, 100, 100) // 後から画像のサイズにscaleするので1にしておく
      const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: document.getElementById('v-shader').textContent,
        fragmentShader: document.getElementById('f-shader').textContent
      })

      const mesh = new THREE.Mesh(geo, mat)

      return mesh
    }

    // スクロール追従
    let targetScrollY = 0 // スクロール位置
    let currentScrollY = 0 // 線形補間を適用した現在のスクロール位置
    let scrollOffset = 0 // 上記2つの差分

    // 開始と終了をなめらかに補間する関数
    const lerp = (start, end, multiplier) => {
      return (1 - multiplier) * start + multiplier * end
    }

    const updateScroll = () => {
      // スクロール位置を取得
      targetScrollY = document.documentElement.scrollTop
      // リープ関数でスクロール位置をなめらかに追従
      currentScrollY = lerp(currentScrollY, targetScrollY, 0.1)

      scrollOffset = targetScrollY - currentScrollY
    }

    // 慣性スクロール
    const scrollArea = document.querySelector('.scrollable')
    const setupScrollHeight = () => {
      const scrollHeight = scrollArea.getBoundingClientRect().height
      const windowHeight = window.innerHeight
      // スクロール可能な高さを、コンテンツの高さからウィンドウの高さを引いた値に設定
      document.body.style.height = `${scrollHeight - windowHeight}px`
    }

    setupScrollHeight()

    const imagePlaneArray = []

    // 毎フレーム呼び出す
    const loop = () => {
      updateScroll()

      // スクロール位置を制限
      const maxScroll = document.body.style.height
      const limitedScrollY = Math.min(Math.max(-currentScrollY, -maxScroll), 0)
      scrollArea.style.transform = `translate3d(0,${limitedScrollY}px,0)`
      for (const plane of imagePlaneArray) {
        plane.update(scrollOffset)
      }
      renderer.render(scene, camera)

      requestAnimationFrame(loop)
    }

    // リサイズ処理
    let timeoutId = 0
    const resize = () => {
      // three.jsのリサイズ
      const width = window.innerWidth
      const height = window.innerHeight

      canvasSize.w = width
      canvasSize.h = height

      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(width, height)

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      // カメラの距離を計算し直す
      const fov = 60
      const fovRad = (fov / 2) * (Math.PI / 180)
      const dist = canvasSize.h / 2 / Math.tan(fovRad)
      camera.position.z = dist

      // スクロールコンテナの高さを取り直す
      setupScrollHeight()
    }

    const main = () => {
      window.addEventListener('load', () => {
        const imageArray = [...document.querySelectorAll('.js-img-item img')]
        for (const img of imageArray) {
          const mesh = createMesh(img)
          scene.add(mesh)

          const imagePlane = new ImagePlane(mesh, img)
          imagePlane.setParams()

          imagePlaneArray.push(imagePlane)
        }
        loop()
      })

      // リサイズ（負荷軽減のためリサイズが完了してから発火する）
      window.addEventListener('resize', () => {
        if (timeoutId) clearTimeout(timeoutId)

        timeoutId = setTimeout(resize, 200)
      })
    }

    main()
  }

  initWebGL()

  function initTime() {
    const timeEl = document.querySelector('.js-time')
    const updateTime = () => {
      const now = new Date()
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const weekday = weekdays[now.getDay()]

      const date = now
        .toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
        .replace(/\//g, '/')
        .split(' ')[0] // 日付部分のみ取得

      const timeStr = now.toLocaleString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })

      timeEl.textContent = `${date} ${weekday} ${timeStr}`
    }
    updateTime()
    setInterval(updateTime, 1000)
  }

  initTime()
})
