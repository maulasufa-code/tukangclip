"use client";

import { useEffect, useRef } from "react";

/**
 * Latar 3D dengan Three.js. Pakai WebGPURenderer, yang otomatis turun ke
 * backend WebGL 2 saat WebGPU tidak tersedia. Isinya roll film gulung yang
 * terpotong: muka potong spiral berputar pelan, ekor film bersprocket mengalir
 * keluar dan berakhir di potongan diagonal. Irisan roll di depan bergerak lebih
 * cepat saat scroll untuk parallax. Pola titik di atas gelap dan kotak merah
 * muda yang mengikuti kursor digambar di kanvas 2D terpisah.
 */
export function SceneBackground() {
  const kanvasGl = useRef<HTMLCanvasElement>(null);
  const kanvasTitik = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = kanvasGl.current;
    const dc = kanvasTitik.current;
    if (!cv || !dc) return;

    // ?gerak di URL mengabaikan preferensi OS, untuk melihat animasi di mesin yang mematikan animasi.
    const reduce =
      matchMedia("(prefers-reduced-motion: reduce)").matches && !new URLSearchParams(location.search).has("gerak");
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
      scene.add(new THREE.AmbientLight(0x6a2a66, 1.1));
      const lampu = new THREE.DirectionalLight(0xff5fae, 1.5);
      lampu.position.set(-500, 600, 700);
      scene.add(lampu);
      const titikCahaya = new THREE.PointLight(0xffb8dc, 1.2, 0);
      titikCahaya.position.set(500, 350, 600);
      scene.add(titikCahaya);
      const rim = new THREE.DirectionalLight(0x8a2cff, 0.9);
      rim.position.set(300, -200, -400);
      scene.add(rim);

      // Ukuran roll dalam satuan lokal: lebar film, tebal satu lapis, jarak antar lapis.
      const LEBAR = 200;
      const TEBAL = 10;
      const JARAK = 24;
      const R0 = 64;
      const PUTAR = 9;
      const R_CINCIN = R0 + JARAK * PUTAR + 22;

      const polar = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)];

      function spiral() {
        const o: number[][] = [];
        const i: number[][] = [];
        const n = Math.ceil((PUTAR * 2 * Math.PI) / 0.09);
        for (let k = 0; k <= n; k++) {
          const th = (k / n) * PUTAR * 2 * Math.PI;
          const r = R0 + (JARAK * th) / (2 * Math.PI);
          o.push(polar(r + TEBAL / 2, th));
          i.push(polar(r - TEBAL / 2, th));
        }
        return { o, i };
      }

      function lingkaran(r: number) {
        const o: number[][] = [];
        const i: number[][] = [];
        const n = 180;
        for (let k = 0; k <= n; k++) {
          const a = (k / n) * 2 * Math.PI;
          o.push(polar(r + TEBAL / 2, a));
          i.push(polar(r - TEBAL / 2, a));
        }
        return { o, i };
      }

      // Pita tipis dari dua polyline, jadi muka potong (caps) dan sisi (walls).
      function padat(o: number[][], i: number[][], d: number, tertutup: boolean) {
        const h = d / 2;
        const P = (p: number[], z: number) => [p[0], p[1], z];
        const caps: number[] = [];
        const walls: number[] = [];
        const quad = (out: number[], a: number[], b: number[], c: number[], e: number[]) =>
          out.push(...a, ...b, ...c, ...a, ...c, ...e);
        for (let k = 0; k < o.length - 1; k++) {
          quad(caps, P(o[k], h), P(i[k], h), P(i[k + 1], h), P(o[k + 1], h));
          quad(caps, P(o[k], -h), P(i[k], -h), P(i[k + 1], -h), P(o[k + 1], -h));
          quad(walls, P(o[k], h), P(o[k + 1], h), P(o[k + 1], -h), P(o[k], -h));
          quad(walls, P(i[k], h), P(i[k + 1], h), P(i[k + 1], -h), P(i[k], -h));
        }
        if (!tertutup) {
          const e = o.length - 1;
          quad(walls, P(o[0], h), P(i[0], h), P(i[0], -h), P(o[0], -h));
          quad(walls, P(o[e], h), P(i[e], h), P(i[e], -h), P(o[e], -h));
        }
        const buat = (arr: number[]) => {
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
          g.computeVertexNormals();
          return g;
        };
        return { caps: buat(caps), walls: buat(walls) };
      }

      const bahanPotong = new THREE.MeshPhysicalMaterial({
        color: 0x9a2a86,
        emissive: 0x3a0c36,
        roughness: 0.42,
        metalness: 0.05,
        clearcoat: 0.5,
        side: THREE.DoubleSide
      });
      const bahanSisi = new THREE.MeshPhysicalMaterial({
        color: 0x241028,
        emissive: 0x0e0410,
        roughness: 0.5,
        metalness: 0.3,
        clearcoat: 0.4,
        side: THREE.DoubleSide
      });

      function irisan(o: number[][], i: number[][], d: number, tertutup: boolean) {
        const { caps, walls } = padat(o, i, d, tertutup);
        const g = new THREE.Group();
        g.add(new THREE.Mesh(caps, bahanPotong), new THREE.Mesh(walls, bahanSisi));
        return g;
      }

      // Kain film: lubang sprocket di dua tepi, bingkai di tengah.
      const PANJANG_UBIN = 2 * LEBAR;
      function tekstur() {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 256;
        const g = c.getContext("2d")!;
        g.fillStyle = "#1c0f20";
        g.fillRect(0, 0, 512, 256);
        const gr = g.createLinearGradient(0, 0, 512, 0);
        gr.addColorStop(0, "#43163f");
        gr.addColorStop(1, "#7a2370");
        g.fillStyle = gr;
        g.fillRect(24, 48, 464, 160);
        g.fillStyle = "#1c0f20";
        g.fillRect(250, 48, 12, 160);
        for (let k = 0; k < 8; k++) {
          g.clearRect(10 + k * 64, 12, 30, 20);
          g.clearRect(10 + k * 64, 224, 30, 20);
        }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
      const ubin = tekstur();
      const bahanFilm = new THREE.MeshStandardMaterial({
        map: ubin,
        alphaTest: 0.5,
        roughness: 0.55,
        metalness: 0.1,
        emissive: 0x2a0c2a,
        side: THREE.DoubleSide
      });

      // Ekor film: keluar dari puncak cincin, melengkung ke kiri, dan putus miring.
      function ekor() {
        const lengkung = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, R_CINCIN, 0),
          new THREE.Vector3(-170, R_CINCIN + 6, 0),
          new THREE.Vector3(-340, R_CINCIN - 28, 0),
          new THREE.Vector3(-480, R_CINCIN - 100, 0),
          new THREE.Vector3(-570, R_CINCIN - 200, 0)
        ]);
        const panjang = lengkung.getLength();
        const N = 90;
        const pos: number[] = [];
        const uv: number[] = [];
        const idx: number[] = [];
        for (let k = 0; k <= N; k++) {
          const tl = k / N;
          const tr = k === N ? 1 - 0.18 : tl;
          const pl = lengkung.getPointAt(tl);
          const pr = lengkung.getPointAt(tr);
          pos.push(pl.x, pl.y, -LEBAR / 2, pr.x, pr.y, LEBAR / 2);
          uv.push((tl * panjang) / PANJANG_UBIN, 0, (tr * panjang) / PANJANG_UBIN, 1);
          if (k < N) {
            const a = 2 * k;
            idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        g.computeVertexNormals();
        return new THREE.Mesh(g, bahanFilm);
      }

      // Roll utama: cincin diam + spiral yang berputar + ekor.
      const roll = new THREE.Group();
      const putarRoll = new THREE.Group();
      const sp = spiral();
      putarRoll.add(irisan(sp.o, sp.i, LEBAR - 6, false));
      roll.add(putarRoll);
      const ring = lingkaran(R_CINCIN);
      roll.add(irisan(ring.o, ring.i, LEBAR, true));
      roll.add(ekor());
      scene.add(roll);

      // Irisan yang terpisah dari roll, lebih dekat ke kamera.
      const potong = new THREE.Group();
      const putarPotong = new THREE.Group();
      const sp2 = spiral();
      putarPotong.add(irisan(sp2.o, sp2.i, 46, false));
      potong.add(putarPotong);
      scene.add(potong);

      let mxn = 0;
      let myn = 0;
      const padaKursor = (e: PointerEvent) => {
        mxn = e.clientX / window.innerWidth - 0.5;
        myn = e.clientY / window.innerHeight - 0.5;
      };
      window.addEventListener("pointermove", padaKursor, { passive: true });

      function ukuranTiga() {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        kamera.aspect = window.innerWidth / window.innerHeight;
        kamera.position.z = window.innerHeight / 2 / Math.tan((15 * Math.PI) / 180);
        kamera.updateProjectionMatrix();
      }
      ukuranTiga();
      window.addEventListener("resize", ukuranTiga);

      let gulirHalus = window.scrollY;
      let putar = 0;
      let tAwal = 0;

      const mod = (a: number, b: number) => ((a % b) + b) % b;

      function bingkai(t: number) {
        const dt = tAwal ? Math.min((t - tAwal) / 1000, 0.05) : 0;
        tAwal = t;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const skala = Math.max(0.3, Math.min(1.3, Math.min(w * 0.24, h * 0.3) / R_CINCIN));

        const sebelum = gulirHalus;
        gulirHalus = reduce ? 0 : gulirHalus + (window.scrollY - gulirHalus) * Math.min(1, dt * 7);
        const kecepatan = dt ? Math.abs(gulirHalus - sebelum) / dt : 0;
        const laju = 0.16 + Math.min(kecepatan, 3000) * 0.0006;
        putar += dt * laju;

        // Roll jauh: naik pelan, miring mengikuti scroll.
        roll.position.set(w * 0.14, h * 0.15 + gulirHalus * 0.2, -150);
        roll.scale.setScalar(skala);
        roll.rotation.set(0.42 + myn * 0.06 + gulirHalus * 0.00012, -0.55 + mxn * 0.1 + gulirHalus * 0.0002, 0.04);
        putarRoll.rotation.z = putar;
        ubin.offset.x -= (dt * laju * R_CINCIN) / PANJANG_UBIN;

        // Irisan dekat: melintas lebih cepat dan berulang tiap beberapa layar.
        const rentang = h + skala * 700;
        const y = mod(-h * 0.2 + gulirHalus * 0.55, rentang) - rentang / 2;
        potong.position.set(w * 0.3 * Math.cos(gulirHalus * 0.0016 + 1), y, 260);
        potong.scale.setScalar(skala * 0.8);
        potong.rotation.set(0.55 + myn * 0.1, 0.5 + mxn * 0.16, -0.3 + gulirHalus * 0.0004);
        putarPotong.rotation.z = putar * 1.2 + 1;
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
        window.removeEventListener("pointermove", padaKursor);
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
