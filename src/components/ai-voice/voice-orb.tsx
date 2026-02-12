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
    idle: { c1: [99, 102, 241], c2: [139, 92, 246], c3: [79, 70, 229] },
    listening: { c1: [239, 68, 68], c2: [251, 146, 60], c3: [220, 38, 38] },
    thinking: { c1: [245, 158, 11], c2: [168, 85, 247], c3: [217, 119, 6] },
    speaking: { c1: [59, 130, 246], c2: [168, 85, 247], c3: [99, 102, 241] },
};

export default function VoiceOrb({ state, analyserNode, micAnalyser, size = 300 }: VoiceOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const phaseRef = useRef(0);
    const smoothRef = useRef<Float32Array>(new Float32Array(128).fill(0));

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = size * dpr;
        const h = (size * 0.55) * dpr;
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);

        const colors = STATE_COLORS[state];
        const [r1, g1, b1] = colors.c1;
        const [r2, g2, b2] = colors.c2;
        const [r3, g3, b3] = colors.c3;

        // Get frequency data
        const fftSize = 128;
        const freqData = new Uint8Array(fftSize);
        if (state === "speaking" && analyserNode) {
            analyserNode.getByteFrequencyData(freqData);
        } else if (state === "listening" && micAnalyser) {
            micAnalyser.getByteFrequencyData(freqData);
        }

        // Smooth
        const smooth = smoothRef.current;
        const sm = state === "idle" || state === "thinking" ? 0.93 : 0.7;
        for (let i = 0; i < fftSize; i++) {
            smooth[i] = smooth[i] * sm + (freqData[i] / 255) * (1 - sm);
        }

        phaseRef.current += state === "thinking" ? 0.04 : 0.02;
        const phase = phaseRef.current;
        const cy = h / 2;
        const waveW = w * 0.9;
        const sx = (w - waveW) / 2;
        const pts = 90;

        // Draw wave layer
        const drawWave = (
            amp: number, freq: number, pOff: number,
            wc1: number[], wc2: number[], alpha: number,
            lw: number, fill: boolean, useAudio: boolean, aMul: number
        ) => {
            ctx.beginPath();
            const g = ctx.createLinearGradient(sx, 0, sx + waveW, 0);
            g.addColorStop(0, `rgba(${wc1[0]},${wc1[1]},${wc1[2]},${alpha * 0.2})`);
            g.addColorStop(0.25, `rgba(${wc1[0]},${wc1[1]},${wc1[2]},${alpha})`);
            g.addColorStop(0.5, `rgba(${wc2[0]},${wc2[1]},${wc2[2]},${alpha})`);
            g.addColorStop(0.75, `rgba(${wc1[0]},${wc1[1]},${wc1[2]},${alpha})`);
            g.addColorStop(1, `rgba(${wc2[0]},${wc2[1]},${wc2[2]},${alpha * 0.2})`);

            const pArr: [number, number][] = [];
            for (let i = 0; i <= pts; i++) {
                const t = i / pts;
                const x = sx + t * waveW;
                let aA = 0;
                if (useAudio) {
                    const bin = Math.floor(t * fftSize * 0.6);
                    aA = smooth[Math.min(bin, fftSize - 1)] * aMul;
                }
                const edge = Math.sin(t * Math.PI);
                const y = cy + (amp * edge + aA * edge) *
                    (Math.sin(t * Math.PI * freq + phase * 2 + pOff) * 0.55 +
                     Math.sin(t * Math.PI * freq * 1.8 + phase * 3.2 + pOff * 0.6) * 0.28 +
                     Math.sin(t * Math.PI * freq * 3.5 + phase * 1.4 + pOff * 1.4) * 0.17);
                pArr.push([x, y]);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }

            if (fill) {
                for (let i = pts; i >= 0; i--) {
                    const [px, py] = pArr[i];
                    ctx.lineTo(px, cy + (cy - py));
                }
                ctx.closePath();
                const fg = ctx.createLinearGradient(0, cy - amp * 2, 0, cy + amp * 2);
                fg.addColorStop(0, `rgba(${wc1[0]},${wc1[1]},${wc1[2]},${alpha * 0.1})`);
                fg.addColorStop(0.5, `rgba(${wc2[0]},${wc2[1]},${wc2[2]},${alpha * 0.05})`);
                fg.addColorStop(1, `rgba(${wc1[0]},${wc1[1]},${wc1[2]},${alpha * 0.1})`);
                ctx.fillStyle = fg;
                ctx.fill();
            }
            ctx.strokeStyle = g;
            ctx.lineWidth = lw * dpr;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        };

        // Glow
        const gg = ctx.createRadialGradient(w / 2, cy, 0, w / 2, cy, waveW * 0.45);
        const ga = state === "idle" ? 0.04 : state === "thinking" ? 0.07 : 0.12;
        gg.addColorStop(0, `rgba(${r1},${g1},${b1},${ga})`);
        gg.addColorStop(0.6, `rgba(${r2},${g2},${b2},${ga * 0.4})`);
        gg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(0, 0, w, h);

        // Baseline
        ctx.beginPath();
        ctx.moveTo(sx, cy);
        ctx.lineTo(sx + waveW, cy);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();

        const active = state === "listening" || state === "speaking";
        const bA = h * (active ? 0.13 : 0.035);
        const aM = h * 0.3;

        drawWave(bA * 1.6, 2.5, 0, [r1, g1, b1], [r2, g2, b2], 0.25, 1, true, active, aM * 1.2);
        drawWave(bA * 1.3, 3, Math.PI * 0.4, [r2, g2, b2], [r3, g3, b3], 0.45, 1.5, true, active, aM);
        drawWave(bA, 3.5, Math.PI * 0.8, [r1, g1, b1], [r2, g2, b2], 0.85, 2.5, false, active, aM * 0.8);
        drawWave(bA * 0.8, 4.5, Math.PI * 1.3, [r3, g3, b3], [r1, g1, b1], 0.55, 1.5, false, active, aM * 0.6);
        drawWave(bA * 0.5, 5.5, Math.PI * 1.8, [r2, g2, b2], [r3, g3, b3], 0.3, 1, false, active, aM * 0.4);

        // Thinking particles
        if (state === "thinking") {
            for (let p = 0; p < 10; p++) {
                const t = ((phase * 0.5 + p * 0.1) % 1);
                const x = sx + t * waveW;
                const edge = Math.sin(t * Math.PI);
                const y = cy + bA * 1.5 * edge * Math.sin(t * Math.PI * 3 + phase * 2);
                const pa = edge * 0.7;
                const ps = (2 + Math.sin(phase + p) * 1.5) * dpr;
                ctx.beginPath();
                ctx.arc(x, y, ps, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r2},${g2},${b2},${pa})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x, y, ps * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r1},${g1},${b1},${pa * 0.12})`;
                ctx.fill();
            }
        }

        animRef.current = requestAnimationFrame(draw);
    }, [state, analyserNode, micAnalyser, size]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    return (
        <div className="relative w-full" style={{ maxWidth: size }}>
            <canvas
                ref={canvasRef}
                style={{ width: size, height: size * 0.55 }}
                className="relative z-10"
            />
        </div>
    );
}
