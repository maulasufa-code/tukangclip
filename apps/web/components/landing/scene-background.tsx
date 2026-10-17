"use client";

import { useEffect, useRef } from "react";

/**
 * Latar 3D dengan Three.js. Pakai WebGPURenderer, yang otomatis turun ke
 * backend WebGL 2 saat WebGPU tidak tersedia. Pola titik di atas gelap dan
 * kotak merah muda yang mengikuti kursor digambar di kanvas 2D terpisah.
 */
export function SceneBackground() {
  const kanvasGl = useRef<HTMLCanvasElement>(null);
  const kanvasTitik = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = kanvasGl.current;
    const dc = kanvasTitik.current;
    if (!cv || !dc) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dx = dc.getContext("2d");
    if (!dx) return;

    let dibatalkan = false;
    let berhenti: (() => void) | undefined;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let mx = -999;
    let my = -999;
    const sq = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 }
    ];
    let sqo: number[][] = [[0, 0], [-5, -2], [4, 3]];
    let sqt = 0;

    function ukuran() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      dc!.width = W * dpr;
      dc!.height = H * dpr;
      dx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function gambarTitik(t: number) {
      dx!.clearRect(0, 0, W, H);
      const sp = 46;
      const gelap = Array.from(document.querySelectorAll<HTMLElement>(".gelap"))
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.bottom > 0 && r.top < H);

      gelap.forEach((r) => {
        dx!.save();
        dx!.beginPath();
        dx!.rect(r.left, Math.max(0, r.top), r.width, Math.min(H, r.bottom) - Math.max(0, r.top));
        dx!.clip();
        const y0 = Math.floor(Math.max(0, r.top) / sp) * sp;
        for (let y = y0; y < Math.min(H, r.bottom) + sp; y += sp) {
          for (let x = 0; x <= W; x += sp) {
            const d = Math.hypot(x - mx, y - my);
            const k = Math.max(0, 1 - d / 150);
            dx!.fillStyle = `rgba(255,255,255,${0.22 + k * 0.7})`;
            dx!.fillRect(x - 0.75 - k, y - 0.75 - k, 1.5 + k * 2, 1.5 + k * 2);
          }
        }
        dx!.restore();
      });

      if (mx > -900 && !reduce) {
        const didalam = gelap.some((r) => my > r.top && my < r.bottom);
        if (t - sqt > 2600) {
          sqt = t;
          sqo = [
            [0, 0],
            [Math.round(Math.random() * 8 - 4), Math.round(Math.random() * 6 - 3)],
            [Math.round(Math.random() * 8 - 4), Math.round(Math.random() * 6 - 3)]
          ];
        }
        sq.forEach((s, i) => {
          const tx = Math.round(mx / sp + sqo[i][0]) * sp;
          const ty = Math.round(my / sp + sqo[i][1]) * sp;
          s.x += (tx - s.x) * (0.06 - i * 0.012);
          s.y += (ty - s.y) * (0.06 - i * 0.012);
          if (didalam) {
            dx!.fillStyle = "#ff488b";
            const z = i === 0 ? 10 : 6;
            dx!.fillRect(s.x - z / 2, s.y - z / 2, z, z);
          }
        });
      }
    }

    function padaGerak(e: PointerEvent) {
      mx = e.clientX;
      my = e.clientY;
    }

    ukuran();
    window.addEventListener("resize", ukuran);
    window.addEventListener("pointermove", padaGerak, { passive: true });

    async function mulaiTiga() {
      const THREE = await import("three/webgpu");
      if (dibatalkan) return;

      const renderer = new THREE.WebGPURenderer({ canvas: cv!, alpha: true, antialias: true });
      renderer.setClearColor(0x000000, 0);
      await renderer.init();
      if (dibatalkan) {
        renderer.dispose();
        return;
      }

      const scene = new THREE.Scene();
      const kamera = new THREE.PerspectiveCamera(30, 1, 10, 6000);
      scene.add(new THREE.AmbientLight(0x3a0d36, 0.8));
      const lampu = new THREE.DirectionalLight(0xff5fae, 0.85);
      lampu.position.set(-500, 600, 700);
      scene.add(lampu);
      const titikCahaya = new THREE.PointLight(0xffb8dc, 0.6, 0);
      titikCahaya.position.set(500, 350, 600);
      scene.add(titikCahaya);
      const rim = new THREE.DirectionalLight(0x8a2cff, 0.5);
      rim.position.set(300, -200, -400);
      scene.add(rim);

      const bahan = (c: number, e?: number) =>
        new THREE.MeshPhysicalMaterial({
          color: c,
          roughness: 0.38,
          metalness: 0.12,
          clearcoat: 0.6,
          clearcoatRoughness: 0.3,
          emissive: e ?? 0x0c020b,
          side: THREE.DoubleSide
        });

      function pita(ro: number, ri: number, a0: number, a1: number, d: number, m: InstanceType<typeof THREE.MeshPhysicalMaterial> | InstanceType<typeof THREE.MeshBasicMaterial>) {
        const s = new THREE.Shape();
        s.absarc(0, 0, ro, a0, a1, false);
        s.absarc(0, 0, ri, a1, a0, true);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, {
          depth: d,
          bevelEnabled: true,
          bevelThickness: 6,
          bevelSize: 6,
          bevelSegments: 4,
          curveSegments: 120
        });
        g.translate(0, 0, -d / 2);
        return new THREE.Mesh(g, m);
      }

      const putih = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cahaya = new THREE.MeshBasicMaterial({
        color: 0xff4fa0,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      function sorotan(r: number, w: number, a: number, span: number) {
        const g = new THREE.Group();
        g.add(pita(r + w / 2, r - w / 2, a, a + span, 4, putih));
        g.add(pita(r + w * 3, r - w * 3, a, a + span, 4, cahaya));
        return g;
      }

      function riben() {
        const g = new THREE.Group();
        const A = pita(640, 500, 0.1 * Math.PI, 0.9 * Math.PI, 300, bahan(0x34102f));
        A.position.set(-380, 0, -160);
        A.rotation.z = 0.12;
        g.add(A);
        const B = pita(600, 470, 0.08 * Math.PI, 0.93 * Math.PI, 260, bahan(0x5a1853));
        B.position.set(260, -40, -60);
        B.rotation.z = -0.1;
        g.add(B);
        const C = pita(520, 390, 0.12 * Math.PI, 0.88 * Math.PI, 240, bahan(0x7a2070, 0x1a0618));
        C.position.set(30, -120, 140);
        C.rotation.z = 0.05;
        g.add(C);
        const S = sorotan(460, 5, 0.3 * Math.PI, 0.22 * Math.PI);
        S.position.set(30, -120, 268);
        g.add(S);
        g.userData.s = S;
        g.rotation.x = -0.28;
        return g;
      }

      const hero = riben();
      const kaki = riben();
      scene.add(hero, kaki);

      // Bola kaca dengan riben di dalamnya.
      const bola = new THREE.Group();
      const inti = new THREE.Group();
      bola.add(inti);
      // Material fisik, bukan ShaderMaterial GLSL, supaya tetap jalan di backend WebGPU.
      const kulit = new THREE.MeshPhysicalMaterial({
        color: 0xff4fa0,
        emissive: 0x3a0830,
        roughness: 0.15,
        metalness: 0,
        clearcoat: 1,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.BackSide
      });
      bola.add(new THREE.Mesh(new THREE.SphereGeometry(300, 64, 48), kulit));
      const cfg: [number, number, number, number, number, number, number, number, number][] = [
        [250, 170, 0.0, 1.55, 120, 0.9, 0, 0.2, 0x4a1048],
        [230, 150, 0.3, 1.9, 110, 0, 0.8, -0.4, 0x6a1860],
        [200, 120, 1.6, 2.8, 140, 0.3, 0.2, 0.9, 0x8c2380],
        [170, 100, 0.1, 1.4, 100, 1.1, -0.6, 0.1, 0x5a1553],
        [140, 80, 2.2, 3.6, 90, -0.5, 0.4, 1.3, 0x9c2a8f]
      ];
      cfg.forEach((c) => {
        const m = pita(c[0], c[1], c[2], c[3], c[4], bahan(c[8]));
        m.rotation.set(c[5], c[6], c[7]);
        inti.add(m);
      });
      const sorotanBola = sorotan(214, 4, 0, 0.8);
      sorotanBola.rotation.set(0.9, 0.2, 0.1);
      inti.add(sorotanBola);
      scene.add(bola);

      let mxn = 0;
      let myn = 0;
      window.addEventListener(
        "pointermove",
        (e) => {
          mxn = e.clientX / window.innerWidth - 0.5;
          myn = e.clientY / window.innerHeight - 0.5;
        },
        { passive: true }
      );

      function ukuranTiga() {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        kamera.aspect = window.innerWidth / window.innerHeight;
        kamera.position.z = window.innerHeight / 2 / Math.tan((15 * Math.PI) / 180);
        kamera.updateProjectionMatrix();
      }
      ukuranTiga();
      window.addEventListener("resize", ukuranTiga);

      function bingkai(t: number) {
        const skala = Math.max(0.42, Math.min(1, window.innerWidth / 1400));
        const gulir = window.scrollY * 0.0002;
        hero.position.set(-window.innerWidth * 0.3, -window.innerHeight * 0.1, 0);
        hero.scale.setScalar(skala * 0.72);
        hero.rotation.set(-0.28 + myn * 0.06, -0.5 + mxn * 0.12 + gulir, 0);
        kaki.position.set(window.innerWidth * 0.3, -window.innerHeight * 0.5, 0);
        kaki.scale.setScalar(skala * 0.72);
        kaki.rotation.set(-0.28 + myn * 0.05, -0.55 + mxn * 0.1, 0);
        bola.position.set(0, -window.innerHeight * 0.1, 0);
        bola.scale.setScalar(Math.min(window.innerWidth * 0.3, window.innerHeight * 0.42, 300) / 300);
        bola.rotation.set(myn * 0.3, t * 0.00012 + mxn * 0.4, 0);
        inti.rotation.set(0, t * 0.0001, t * 0.00018);
        sorotanBola.rotation.z = t * 0.0007;
        [hero, kaki].forEach((g, i) => {
          const p = (t * 0.00011 + i * 0.5) % 1;
          g.userData.s.rotation.z = -(0.08 + p * 0.5) * (Math.PI / 2);
        });
      }

      function gambar(t: number) {
        bingkai(t);
        renderer.render(scene, kamera);
      }

      if (reduce) {
        gambar(0);
      } else {
        renderer.setAnimationLoop(gambar);
      }

      berhenti = () => {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        window.removeEventListener("resize", ukuranTiga);
      };
    }

    function loop(t: number) {
      if (dibatalkan) return;
      gambarTitik(t);
      if (!reduce) requestAnimationFrame(loop);
    }

    mulaiTiga().catch(() => {
      // Tanpa WebGPU maupun WebGL, latar titik tetap jalan.
    });
    if (reduce) gambarTitik(0);
    else requestAnimationFrame(loop);

    return () => {
      dibatalkan = true;
      berhenti?.();
      window.removeEventListener("resize", ukuran);
      window.removeEventListener("pointermove", padaGerak);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-30"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 105%,rgba(120,20,95,.55),transparent 70%),radial-gradient(60% 50% at 85% 30%,rgba(70,10,70,.45),transparent 70%),linear-gradient(#000,#07030b)"
        }}
      />
      <canvas ref={kanvasGl} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 h-full w-full" />
      <canvas ref={kanvasTitik} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
    </>
  );
}
