"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { PracticeType } from "@/lib/types";

const palette: Record<PracticeType, { primary: number; secondary: number; accent: number; count: number; label: string }> = {
  "Job Interview": { primary: 0x7c3aed, secondary: 0x0ea5e9, accent: 0xf59e0b, count: 2, label: "Hiring manager" },
  "Presentation / Public Speaking": { primary: 0x0ea5e9, secondary: 0x14b8a6, accent: 0xa78bfa, count: 4, label: "Audience" },
  "Panel Discussion": { primary: 0x8b5cf6, secondary: 0xec4899, accent: 0x38bdf8, count: 3, label: "Panel" },
  "Thesis Defense": { primary: 0x2563eb, secondary: 0x7c3aed, accent: 0xf97316, count: 3, label: "Examiners" },
  "Salary Negotiation": { primary: 0x059669, secondary: 0x7c3aed, accent: 0xfbbf24, count: 2, label: "Manager" },
  "Difficult Conversation": { primary: 0xf43f5e, secondary: 0x8b5cf6, accent: 0x38bdf8, count: 2, label: "Counterpart" },
  "Teaching Session": { primary: 0x0d9488, secondary: 0x6366f1, accent: 0xf97316, count: 4, label: "Students" },
  "Sales Pitch": { primary: 0xf97316, secondary: 0x7c3aed, accent: 0x0ea5e9, count: 2, label: "Buyer" }
};

function makePerson(color: number, accent: number) {
  const person = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xf2c6a0, roughness: 0.68 });
  const suit = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
  const glow = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.35, emissive: accent, emissiveIntensity: 0.08 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.82, 8, 18), suit);
  body.position.y = 0.58;
  person.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), skin);
  head.position.y = 1.33;
  person.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.29, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x23172e, roughness: 0.8 }));
  hair.position.y = 1.43;
  person.add(hair);

  const badge = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 12, 32), glow);
  badge.position.set(0, 0.88, 0.33);
  badge.rotation.x = Math.PI / 2;
  person.add(badge);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.55, 8, 12), suit);
  leftArm.position.set(-0.42, 0.72, 0.02);
  leftArm.rotation.z = 0.28;
  person.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.42;
  rightArm.rotation.z = -0.28;
  person.add(rightArm);

  return person;
}

export function ScenarioAvatar({ practiceType, speaking = false }: { practiceType?: PracticeType; speaking?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const config = palette[practiceType || "Job Interview"];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 5.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(2, 4, 4);
    scene.add(key);
    const rim = new THREE.PointLight(config.secondary, 5, 7);
    rim.position.set(-2.4, 2.2, 2);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(2.25, 2.25, 0.08, 64),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, transparent: true, opacity: 0.55 })
    );
    floor.position.y = -0.08;
    root.add(floor);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.65, 0.025, 12, 96),
      new THREE.MeshStandardMaterial({ color: config.accent, emissive: config.accent, emissiveIntensity: 0.35 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    root.add(ring);

    const people: THREE.Group[] = [];
    for (let index = 0; index < config.count; index += 1) {
      const person = makePerson(index % 2 ? config.secondary : config.primary, config.accent);
      const spread = config.count === 2 ? 1.15 : 1.55;
      const x = config.count === 1 ? 0 : (index - (config.count - 1) / 2) * (spread / Math.max(config.count - 1, 1));
      person.position.set(x, 0, index % 2 ? -0.24 : 0.12);
      person.rotation.y = -x * 0.28;
      root.add(person);
      people.push(person);
    }

    const waveform = new THREE.Group();
    for (let index = 0; index < 12; index += 1) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.24 + (index % 4) * 0.08, 0.045),
        new THREE.MeshStandardMaterial({ color: config.accent, emissive: config.accent, emissiveIntensity: 0.28 })
      );
      bar.position.set((index - 5.5) * 0.12, 1.92, -0.15);
      waveform.add(bar);
    }
    root.add(waveform);

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      root.rotation.y = Math.sin(t * 0.42) * 0.18;
      ring.rotation.z = t * 0.45;
      waveform.children.forEach((bar, index) => {
        bar.scale.y = 0.75 + Math.sin(t * 4 + index) * (speaking ? 0.75 : 0.22);
      });
      people.forEach((person, index) => {
        person.position.y = Math.sin(t * 1.8 + index) * 0.035;
        person.rotation.z = Math.sin(t * 1.2 + index) * 0.02;
      });
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [practiceType, speaking]);

  const config = palette[practiceType || "Job Interview"];

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-white via-[#f4f8fc] to-[#eef3ff] p-4 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:from-white/10 dark:via-white/[0.06] dark:to-white/10 dark:ring-white/10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6200a8] dark:text-violet-200">{config.label}</div>
          <div className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{practiceType || "Rehearsal"}</div>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${speaking ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100" : "bg-white/80 text-slate-600 dark:bg-white/10 dark:text-white/70"}`}>
          {speaking ? "Speaking" : "Listening"}
        </div>
      </div>
      <div ref={containerRef} className="h-[240px] w-full sm:h-[300px]" />
    </div>
  );
}
