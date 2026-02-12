"use client";

import { useRef, useEffect, useCallback } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface VoiceOrbProps {
    state: OrbState;
    analyserNode: AnalyserNode | null;
    micAnalyser: AnalyserNode | null;
    size?: number;
}

const STATE_COLORS = {
    idle: { primary: [99, 102, 241], secondary: [139, 92, 246], glow: "rgba(99,102,241,0.3)" },
    listening: { primary: [239, 68, 68], secondary: [251, 146, 60], glow: "rgba(239,68,68,0.5)" },
    thinking: { primary: [245, 158, 11], secondary: [168, 85, 247], glow: "rgba(245,158,11,0.4)" },
    speaking: { primary: [59, 130, 246], secondary: [168, 85, 247], glow: "rgba(139,92,246,0.5)" },
};

export default function VoiceOrb({ state, analyserNode, micAnalyser, size = 200 }: VoiceOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const phaseRef = useRef(0);
    const thinkingAngleRef = useRef(0);
    const smoothBarsRef = useRef<Float32Array>(new Float32Array(64).fill(0));

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = size * dpr;
        const h = size * dpr;
        canvas.width = w;
        canvas.height = h;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        const colors = STATE_COLORS[state];
        const [r1, g1, b1] = colors.primary;
        const [r2, g2, b2] = colors.secondary;

        // Get frequency data
        const numBars = 64;
        const freqData = new Uint8Array(numBars);
        let hasAudioData = false;

        if (state === "speaking" && analyserNode) {
            analyserNode.getByteFrequencyData(freqData);
            hasAudioData = freqData.some((v) => v > 10);
        } else if (state === "listening" && micAnalyser) {
            micAnalyser.getByteFrequencyData(freqData);
            hasAudioData = freqData.some((v) => v > 10);
        }

        // Smooth bars
        const smoothBars = smoothBarsRef.current;
        for (let i = 0; i < numBars; i++) {
            const target = freqData[i] / 255;
            const smoothing = state === "idle" ? 0.92 : 0.75;
            smoothBars[i] = smoothBars[i] * smoothing + target * (1 - smoothing);
        }

        phaseRef.current += 0.015;
        if (state === "thinking") thinkingAngleRef.current += 0.03;

        const orbRadius = w * 0.2;
        const barMaxLen = w * 0.15;

        // Outer glow
        const glowRadius = orbRadius * (state === "idle" ? 1.6 : 2.0);
        const glowGrad = ctx.createRadialGradient(cx, cy, orbRadius * 0.5, cx, cy, glowRadius);
        glowGrad.addColorStop(0, `rgba(${r1},${g1},${b1},${state === "idle" ? 0.1 : 0.2})`);
        glowGrad.addColorStop(0.5, `rgba(${r2},${g2},${b2},${state === "idle" ? 0.05 : 0.1})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw radial bars
        for (let i = 0; i < numBars; i++) {
            const angle = (i / numBars) * Math.PI * 2 - Math.PI / 2;
            let barValue = smoothBars[i];

            if (state === "idle") {
                barValue = 0.05 + Math.sin(phaseRef.current * 2 + i * 0.2) * 0.04;
            } else if (state === "thinking") {
                const tAngle = thinkingAngleRef.current;
                const dist = Math.abs(((i / numBars) * Math.PI * 2 - (tAngle % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
                barValue = Math.max(0.03, 0.6 * Math.exp(-dist * 1.5));
            } else if (!hasAudioData) {
                barValue = 0.08 + Math.sin(phaseRef.current * 3 + i * 0.15) * 0.06;
            }

            const barLen = Math.max(2 * dpr, barValue * barMaxLen);
            const innerR = orbRadius + 4 * dpr;
            const outerR = innerR + barLen;

            const x1 = cx + Math.cos(angle) * innerR;
            const y1 = cy + Math.sin(angle) * innerR;
            const x2 = cx + Math.cos(angle) * outerR;
            const y2 = cy + Math.sin(angle) * outerR;

            const alpha = 0.3 + barValue * 0.7;
            const mix = i / numBars;
            const cr = Math.round(r1 + (r2 - r1) * mix);
            const cg = Math.round(g1 + (g2 - g1) * mix);
            const cb = Math.round(b1 + (b2 - b1) * mix);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
            ctx.lineWidth = Math.max(2, 3 * dpr);
            ctx.lineCap = "round";
            ctx.stroke();
        }

        // Central orb gradient
        const orbGrad = ctx.createRadialGradient(cx - orbRadius * 0.3, cy - orbRadius * 0.3, 0, cx, cy, orbRadius);
        orbGrad.addColorStop(0, `rgba(${r1},${g1},${b1},0.9)`);
        orbGrad.addColorStop(0.6, `rgba(${Math.round((r1 + r2) / 2)},${Math.round((g1 + g2) / 2)},${Math.round((b1 + b2) / 2)},0.85)`);
        orbGrad.addColorStop(1, `rgba(${r2},${g2},${b2},0.8)`);

        const breathe = state === "idle" ? 1 + Math.sin(phaseRef.current) * 0.03 : state === "speaking" ? 1 + (smoothBars.reduce((s, v) => s + v, 0) / numBars) * 0.08 : 1;

        ctx.beginPath();
        ctx.arc(cx, cy, orbRadius * breathe, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.fill();

        // Inner shine
        const shineGrad = ctx.createRadialGradient(cx - orbRadius * 0.25, cy - orbRadius * 0.25, 0, cx, cy, orbRadius * 0.8);
        shineGrad.addColorStop(0, "rgba(255,255,255,0.25)");
        shineGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, orbRadius * breathe * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = shineGrad;
        ctx.fill();

        // Thinking ring
        if (state === "thinking") {
            const ringAngle = thinkingAngleRef.current * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, orbRadius + 8 * dpr, ringAngle, ringAngle + Math.PI * 0.6);
            ctx.strokeStyle = `rgba(${r1},${g1},${b1},0.6)`;
            ctx.lineWidth = 3 * dpr;
            ctx.lineCap = "round";
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, orbRadius + 8 * dpr, ringAngle + Math.PI, ringAngle + Math.PI * 1.6);
            ctx.strokeStyle = `rgba(${r2},${g2},${b2},0.6)`;
            ctx.lineWidth = 3 * dpr;
            ctx.lineCap = "round";
            ctx.stroke();
        }

        // Center icon (mic wave for idle, sound wave lines for speaking)
        ctx.save();
        ctx.translate(cx, cy);
        const iconAlpha = state === "idle" ? 0.6 : 0.9;
        ctx.strokeStyle = `rgba(255,255,255,${iconAlpha})`;
        ctx.lineWidth = 2.5 * dpr;
        ctx.lineCap = "round";

        if (state === "idle" || state === "listening") {
            // Mic icon
            const s = orbRadius * 0.3;
            ctx.beginPath();
            ctx.arc(0, -s * 0.2, s * 0.35, Math.PI, 0);
            ctx.lineTo(s * 0.35, s * 0.3);
            ctx.arc(0, s * 0.3, s * 0.35, 0, Math.PI);
            ctx.closePath();
            ctx.fillStyle = `rgba(255,255,255,${iconAlpha})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, s * 0.3, s * 0.55, 0, Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, s * 0.3 + s * 0.55);
            ctx.lineTo(0, s * 0.3 + s * 0.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-s * 0.3, s * 0.3 + s * 0.8);
            ctx.lineTo(s * 0.3, s * 0.3 + s * 0.8);
            ctx.stroke();
        } else if (state === "speaking") {
            // Sound wave bars
            const bw = 3 * dpr;
            const gap = 6 * dpr;
            const heights = [0.3, 0.6, 1, 0.6, 0.3];
            const maxH = orbRadius * 0.45;
            for (let i = 0; i < 5; i++) {
                const x = (i - 2) * gap;
                const animH = heights[i] * (0.5 + smoothBars[i * 8] * 0.5);
                const h = maxH * animH;
                ctx.beginPath();
                ctx.moveTo(x, -h / 2);
                ctx.lineTo(x, h / 2);
                ctx.lineWidth = bw;
                ctx.stroke();
            }
        } else if (state === "thinking") {
            // Dots rotating
            for (let i = 0; i < 3; i++) {
                const a = thinkingAngleRef.current * 3 + (i * Math.PI * 2) / 3;
                const dx = Math.cos(a) * orbRadius * 0.25;
                const dy = Math.sin(a) * orbRadius * 0.25;
                ctx.beginPath();
                ctx.arc(dx, dy, 4 * dpr, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.5 + (i / 3) * 0.5})`;
                ctx.fill();
            }
        }
        ctx.restore();

        animRef.current = requestAnimationFrame(draw);
    }, [state, analyserNode, micAnalyser, size]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const glowColor = STATE_COLORS[state].glow;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <div
                className="absolute inset-0 rounded-full transition-all duration-700"
                style={{ boxShadow: `0 0 ${state === "idle" ? 30 : 60}px ${glowColor}, 0 0 ${state === "idle" ? 60 : 120}px ${glowColor}` }}
            />
            <canvas
                ref={canvasRef}
                style={{ width: size, height: size }}
                className="relative z-10"
            />
        </div>
    );
}
