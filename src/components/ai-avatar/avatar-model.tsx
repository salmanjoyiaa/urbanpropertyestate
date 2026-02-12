"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

// Ready Player Me viseme morph target names (standard blendshapes)
const VISEME_NAMES = [
    "viseme_sil", // silence
    "viseme_PP",  // p, b, m
    "viseme_FF",  // f, v
    "viseme_TH",  // th
    "viseme_DD",  // t, d, n
    "viseme_kk",  // k, g
    "viseme_CH",  // ch, j, sh
    "viseme_SS",  // s, z
    "viseme_nn",  // n, l
    "viseme_RR",  // r
    "viseme_aa",  // a
    "viseme_E",   // e
    "viseme_I",   // i
    "viseme_O",   // o
    "viseme_U",   // u
];

// Map phoneme-like characters to viseme indices
function textToVisemeSequence(text: string): number[] {
    const map: Record<string, number> = {
        a: 10, e: 11, i: 12, o: 13, u: 14,
        p: 1, b: 1, m: 1,
        f: 2, v: 2,
        t: 4, d: 4, n: 8, l: 8,
        k: 5, g: 5,
        s: 7, z: 7,
        r: 9,
        " ": 0, ".": 0, ",": 0, "!": 0, "?": 0,
    };
    return text
        .toLowerCase()
        .split("")
        .map((ch) => map[ch] ?? 0);
}

interface AvatarModelProps {
    isSpeaking: boolean;
    speakingText: string;
    isListening: boolean;
    avatarUrl?: string;
}

export default function AvatarModel({
    isSpeaking,
    speakingText,
    isListening,
    avatarUrl = "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit&textureAtlas=1024",
}: AvatarModelProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(avatarUrl);
    const { actions } = useAnimations(animations, group);

    // Clone scene so multiple instances don't conflict
    const clonedScene = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((child) => {
            if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
                const mesh = child as THREE.SkinnedMesh;
                if (mesh.morphTargetInfluences) {
                    mesh.morphTargetInfluences = [...mesh.morphTargetInfluences];
                }
            }
        });
        return clone;
    }, [scene]);

    // Find the head mesh with morph targets
    const headMesh = useMemo((): THREE.SkinnedMesh | null => {
        let found: THREE.SkinnedMesh | null = null;
        clonedScene.traverse((child) => {
            if (
                (child as THREE.SkinnedMesh).isSkinnedMesh &&
                (child as THREE.SkinnedMesh).morphTargetDictionary &&
                !found
            ) {
                const mesh = child as THREE.SkinnedMesh;
                // Prefer the mesh that has viseme morph targets
                if (mesh.morphTargetDictionary?.["viseme_sil"] !== undefined) {
                    found = mesh;
                }
            }
        });
        // Fallback: any skinned mesh with morph targets
        if (!found) {
            clonedScene.traverse((child) => {
                if (
                    (child as THREE.SkinnedMesh).isSkinnedMesh &&
                    (child as THREE.SkinnedMesh).morphTargetInfluences &&
                    !found
                ) {
                    found = child as THREE.SkinnedMesh;
                }
            });
        }
        return found;
    }, [clonedScene]);

    // Idle animation
    useEffect(() => {
        if (actions) {
            const idleAction = actions["Idle"] || actions["idle"] || Object.values(actions)[0];
            if (idleAction) {
                idleAction.reset().fadeIn(0.5).play();
            }
        }
    }, [actions]);

    // Viseme sequence for lip sync
    const visemeSeqRef = useRef<number[]>([]);
    const visemeIndexRef = useRef(0);
    const visemeTimerRef = useRef(0);
    const blinkTimerRef = useRef(Math.random() * 3 + 2);
    const isBlinkingRef = useRef(false);
    const blinkProgressRef = useRef(0);

    // When speaking text changes, generate viseme sequence
    useEffect(() => {
        if (isSpeaking && speakingText) {
            visemeSeqRef.current = textToVisemeSequence(speakingText);
            visemeIndexRef.current = 0;
            visemeTimerRef.current = 0;
        }
    }, [isSpeaking, speakingText]);

    useFrame((_, delta) => {
        if (!headMesh || !headMesh.morphTargetDictionary || !headMesh.morphTargetInfluences) return;

        const dict = headMesh.morphTargetDictionary;
        const influences = headMesh.morphTargetInfluences;

        // === Lip Sync ===
        if (isSpeaking && visemeSeqRef.current.length > 0) {
            visemeTimerRef.current += delta;
            const speed = 12; // visemes per second
            const idx = Math.floor(visemeTimerRef.current * speed);

            if (idx < visemeSeqRef.current.length) {
                visemeIndexRef.current = idx;
            }

            const targetViseme = VISEME_NAMES[visemeSeqRef.current[visemeIndexRef.current] || 0];

            // Smoothly interpolate all visemes
            for (const visemeName of VISEME_NAMES) {
                const morphIdx = dict[visemeName];
                if (morphIdx !== undefined) {
                    const target = visemeName === targetViseme ? 0.7 : 0;
                    influences[morphIdx] = THREE.MathUtils.lerp(
                        influences[morphIdx],
                        target,
                        delta * 15
                    );
                }
            }
        } else {
            // Fade out all visemes when not speaking
            for (const visemeName of VISEME_NAMES) {
                const morphIdx = dict[visemeName];
                if (morphIdx !== undefined) {
                    influences[morphIdx] = THREE.MathUtils.lerp(influences[morphIdx], 0, delta * 8);
                }
            }
        }

        // === Blinking ===
        blinkTimerRef.current -= delta;
        if (blinkTimerRef.current <= 0 && !isBlinkingRef.current) {
            isBlinkingRef.current = true;
            blinkProgressRef.current = 0;
        }

        if (isBlinkingRef.current) {
            blinkProgressRef.current += delta * 8;
            const blinkValue =
                blinkProgressRef.current < 0.5
                    ? blinkProgressRef.current * 2
                    : 2 - blinkProgressRef.current * 2;

            const leftBlinkIdx = dict["eyeBlinkLeft"];
            const rightBlinkIdx = dict["eyeBlinkRight"];
            if (leftBlinkIdx !== undefined) influences[leftBlinkIdx] = Math.max(0, blinkValue);
            if (rightBlinkIdx !== undefined) influences[rightBlinkIdx] = Math.max(0, blinkValue);

            if (blinkProgressRef.current >= 1) {
                isBlinkingRef.current = false;
                blinkTimerRef.current = Math.random() * 4 + 2;
            }
        }

        // === Subtle head sway ===
        if (group.current) {
            const time = Date.now() * 0.001;
            group.current.rotation.y = Math.sin(time * 0.3) * 0.02;
            group.current.rotation.x = Math.sin(time * 0.5) * 0.01;

            // Subtle bounce when listening
            if (isListening) {
                group.current.position.y = Math.sin(time * 2) * 0.005;
            }
        }
    });

    return (
        <group ref={group} position={[0, -0.6, 0]} scale={1.3}>
            <primitive object={clonedScene} />
        </group>
    );
}
