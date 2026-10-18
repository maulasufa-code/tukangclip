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

      if (mx > -900) {
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
            dx!.fillStyle = "#fcc501";
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
      scene.add(new THREE.AmbientLight(0x8a6020, 1.7));
      const lampu = new THREE.DirectionalLight(0xffc040, 2.4);
      lampu.position.set(-500, 600, 700);
      scene.add(lampu);
      const titikCahaya = new THREE.PointLight(0xffe0a0, 1.2, 0);
      titikCahaya.position.set(500, 350, 600);
      scene.add(titikCahaya);
      const rim = new THREE.DirectionalLight(0xff6a00, 0.9);
      rim.position.set(300, -200, -400);
      scene.add(rim);

      // Ukuran roll dalam satuan lokal: lebar film, tebal satu lapis, jarak antar lapis.
      const LEBAR = 200;
      const TEBAL = 10;
      const JARAK = 24;
      const R0 = 64;
      const PUTAR = 8;
      const R_CINCIN = R0 + JARAK * (PUTAR + 1);
      const S_LILIT = 2 * Math.PI * R_CINCIN;

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
        color: 0xffc400,
        emissive: 0x6a4400,
        roughness: 0.42,
        metalness: 0.05,
        clearcoat: 0.5,
        side: THREE.DoubleSide
      });
      const bahanSisi = new THREE.MeshPhysicalMaterial({
        color: 0x241708,
        emissive: 0x100a02,
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

      // Kain film: lubang sprocket di dua tepi, satu bingkai per ubin.
      const PANJANG_UBIN = LEBAR;
      function tekstur() {
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 256;
        const g = c.getContext("2d")!;
        g.fillStyle = "#1a1006";
        g.fillRect(0, 0, 256, 256);
        const gr = g.createLinearGradient(0, 0, 256, 0);
        gr.addColorStop(0, "#7a4e08");
        gr.addColorStop(1, "#f2b01a");
        g.fillStyle = gr;
        g.fillRect(14, 48, 228, 160);
        for (let k = 0; k < 4; k++) {
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
        emissive: 0x4a3008,
        side: THREE.DoubleSide
      });

      // Film terbentang dari puncak cincin: K potongan sepanjang satu ubin, digambar ulang tiap frame.
      // Potongan yang menempel jadi satu helai bergelombang. Saat dipotong, celahnya melebar,
      // potongan tersebar, lalu bergeser berputar di jalur yang sama (loop).
      const K = 16;
      const PL = PANJANG_UBIN;
      const L = K * PL;
      const BARIS = 14;
      const PER = (BARIS + 1) * 2;
      const posAttr = new THREE.BufferAttribute(new Float32Array(K * PER * 3), 3);
      const uvAttr = new THREE.BufferAttribute(new Float32Array(K * PER * 2), 2);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      uvAttr.setUsage(THREE.DynamicDrawUsage);
      const idx: number[] = [];
      for (let k = 0; k < K; k++) {
        for (let j = 0; j < BARIS; j++) {
          const a = k * PER + 2 * j;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      const geoFilm = new THREE.BufferGeometry();
      geoFilm.setAttribute("position", posAttr);
      geoFilm.setAttribute("uv", uvAttr);
      geoFilm.setIndex(idx);
      const filmMesh = new THREE.Mesh(geoFilm, bahanFilm);
      filmMesh.frustumCulled = false;

      const smooth = (a: number, b: number, x: number) => {
        const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return u * u * (3 - 2 * u);
      };
      const acak = Array.from({ length: K }, (_, k) => [Math.sin(k * 91.7 + 1.3), Math.sin(k * 47.3 + 2.1), Math.sin(k * 13.1 + 0.7)]);
      const pt = new THREE.Vector3();
      const pt2 = new THREE.Vector3();
      const tg = new THREE.Vector3();
      const sil = new THREE.Vector3();
      const lebarV = new THREE.Vector3();
      let wkt = 0;
      let amp = 1;
      let p = 0;
      let shift = 0;

      // Titik di jalur film pada jarak s dari ujung dalam. Satu lilitan pertama membungkus roll,
      // lalu film keluar dari puncak ke kiri, hampir lurus dan sedikit miring ke bawah.
      function titik(s: number, out: InstanceType<typeof THREE.Vector3>) {
        if (s < S_LILIT) {
          const f = s / S_LILIT;
          const r = R_CINCIN - 14 * (1 - f);
          const a = Math.PI / 2 - 2 * Math.PI * (1 - f);
          out.set(r * Math.cos(a), r * Math.sin(a), 0);
          return;
        }
        const d = s - S_LILIT;
        const env = smooth(0, 380, d);
        const x = -d;
        const y = R_CINCIN - 0.13 * d + env * amp * (24 * Math.sin(0.008 * d - 1.2 * wkt) + 8 * Math.sin(0.02 * d - 2 * wkt + 1));
        const z = env * amp * 16 * Math.sin(0.006 * d - 1 * wkt + 1);
        out.set(x, y, z);
      }

      function simpul(s: number, tanda: number, dy: number, dz: number, tw: number, half: number, arr: Float32Array, off: number) {
        titik(s, pt);
        titik(s + 3, pt2);
        pt.y += dy;
        pt.z += dz;
        pt2.y += dy;
        pt2.z += dz;
        tg.subVectors(pt2, pt).normalize();
        sil.set(0, 0, 1).addScaledVector(tg, -tg.z).normalize();
        lebarV.crossVectors(tg, sil);
        const d = Math.max(0, s - S_LILIT);
        const env = smooth(0, 380, d);
        const phi = tw + 0.95 * env + 0.25 * env * Math.sin(0.009 * d - 1.3 * wkt + 2);
        const c = Math.cos(phi) * tanda * half;
        const n = Math.sin(phi) * tanda * half;
        arr[off] = pt.x + sil.x * c + lebarV.x * n;
        arr[off + 1] = pt.y + sil.y * c + lebarV.y * n;
        arr[off + 2] = pt.z + sil.z * c + lebarV.z * n;
      }

      const mod = (a: number, b: number) => ((a % b) + b) % b;

      function susunFilm() {
        const pa = posAttr.array as Float32Array;
        const ua = uvAttr.array as Float32Array;
        for (let k = 0; k < K; k++) {
          const a0 = mod(k * PL + shift, L);
          const [r1, r2, r3] = acak[k];
          const tengah = a0 + PL / 2;
          // Sayatan menjalar dari roll ke ujung: potongan dekat roll terpotong lebih dulu.
          const dn = Math.min(1, Math.max(0, (tengah - S_LILIT) / (L - S_LILIT)));
          const ck = Math.min(1, Math.max(0, p * 1.8 - 0.8 * dn));
          const g = ck * 0.2 * PL * (0.3 + 0.7 * smooth(S_LILIT - 200, S_LILIT + 100, tengah));
          const sk = ck * 0.3 * PL;
          const panj = PL - 2 * g;
          const lepas = ck * smooth(S_LILIT, S_LILIT + 250, tengah);
          const dy = lepas * 60 * r1;
          const dz = lepas * 80 * r2;
          const tw = lepas * 0.9 * r3 * Math.sin(wkt * 1.3 + k);
          const half = (LEBAR / 2) * (1 + p * (smooth(0, 150, tengah) * smooth(0, 150, L - tengah) - 1));
          for (let j = 0; j <= BARIS; j++) {
            const f = j / BARIS;
            const sL = a0 + g + f * panj;
            const u = (g + f * panj) / PANJANG_UBIN;
            const o = k * PER + 2 * j;
            simpul(sL, -1, dy, dz, tw, half, pa, o * 3);
            simpul(sL + sk, 1, dy, dz, tw, half, pa, (o + 1) * 3);
            ua[o * 2] = u;
            ua[o * 2 + 1] = 0;
            ua[o * 2 + 2] = u + sk / PANJANG_UBIN;
            ua[o * 2 + 3] = 1;
          }
        }
        posAttr.needsUpdate = true;
        uvAttr.needsUpdate = true;
        geoFilm.computeVertexNormals();
      }
      susunFilm();

      // Roll utama: spiral yang berputar, dibungkus film yang sama dengan yang terbentang.
      const roll = new THREE.Group();
      const putarRoll = new THREE.Group();
      const sp = spiral();
      putarRoll.add(irisan(sp.o, sp.i, LEBAR - 6, false));
      roll.add(putarRoll);
      roll.add(filmMesh);
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

      // Tahan tombol mouse atau sentuh di latar hero: film ditarik keluar lebih cepat, roll bergeser ke kanan,
      // dan film disayat jadi potongan. Lepas: semuanya kembali dengan ease.
      let tahan = false;
      let tarikan = 0;
      let geser = 0;
      const padaTekan = (e: PointerEvent) => {
        // Hanya latar hero yang memicu tarikan. Teks, tautan, dan tombol tetap bisa diseleksi dan diklik.
        const el = e.target as HTMLElement;
        if (!el.closest('section[aria-labelledby="judul-utama"]') || el.closest("h1,h2,h3,p,span,a,button,input,select,textarea,label,summary,li,svg,[role=button]")) return;
        tahan = true;
        document.body.style.userSelect = "none";
      };
      const padaLepas = () => {
        tahan = false;
        document.body.style.userSelect = "";
      };
      window.addEventListener("pointerdown", padaTekan);
      window.addEventListener("pointerup", padaLepas);
      window.addEventListener("pointercancel", padaLepas);
      window.addEventListener("blur", padaLepas);

      let gulirHalus = window.scrollY;
      let putar = 0;
      let tAwal = 0;

      function bingkai(t: number) {
        const dt = tAwal ? Math.min((t - tAwal) / 1000, 0.05) : 0;
        tAwal = t;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const skala = Math.max(0.3, Math.min(1.3, Math.min(w * 0.22, h * 0.27) / R_CINCIN));

        const sebelum = gulirHalus;
        gulirHalus += (window.scrollY - gulirHalus) * Math.min(1, dt * 7);
        const kecepatan = dt ? Math.abs(gulirHalus - sebelum) / dt : 0;
        const laju = 0.16 + Math.min(kecepatan, 3000) * 0.0006 + tarikan * 3;
        putar += dt * laju;

        // Roll jauh: naik pelan, miring mengikuti scroll.
        roll.position.set(w * (0.16 + geser * 0.13), h * 0.06 + gulirHalus * 0.2, -150);
        roll.scale.setScalar(skala);
        roll.rotation.set(0.3 + myn * 0.06 + gulirHalus * 0.00012, -0.28 + mxn * 0.1 + gulirHalus * 0.0002, 0.04);
        putarRoll.rotation.z = putar;
        ubin.offset.x -= (dt * laju * R_CINCIN * (1 - p)) / PANJANG_UBIN;
        roll.updateMatrixWorld();
        wkt += dt * (1 + tarikan * 3.5);
        amp = 1 + tarikan * 1.2;

        tarikan += ((tahan ? 1 : 0) - tarikan) * Math.min(1, dt * (tahan ? 3.5 : 2.2));
        geser += (tarikan - geser) * Math.min(1, dt * 1.6);
        p += ((tahan ? 1 : 0) - p) * Math.min(1, dt * (tahan ? 1.5 : 2.2));
        if (tahan) {
          shift += dt * laju * R_CINCIN * p;
        } else {
          shift += (Math.round(shift / PL) * PL - shift) * Math.min(1, dt * 4);
        }
        susunFilm();

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

      renderer.setAnimationLoop(gambar);

      berhenti = () => {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        window.removeEventListener("resize", ukuranTiga);
        window.removeEventListener("pointermove", padaKursor);
        window.removeEventListener("pointerdown", padaTekan);
        window.removeEventListener("pointerup", padaLepas);
        window.removeEventListener("pointercancel", padaLepas);
        window.removeEventListener("blur", padaLepas);
        document.body.style.userSelect = "";
      };
    }

    function loop(t: number) {
      if (dibatalkan) return;
      gambarTitik(t);
      requestAnimationFrame(loop);
    }

    mulaiTiga().catch(() => {
      // Tanpa WebGPU maupun WebGL, latar titik tetap jalan.
    });
    requestAnimationFrame(loop);

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
            "radial-gradient(70% 55% at 50% 105%,rgba(190,100,0,.5),transparent 70%),radial-gradient(60% 50% at 85% 30%,rgba(120,70,0,.4),transparent 70%),linear-gradient(#000,#0d0803)"
        }}
      />
      <canvas ref={kanvasGl} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 h-full w-full" />
      <canvas ref={kanvasTitik} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
    </>
  );
}
