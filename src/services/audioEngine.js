/**
 * DolbyAudioEngine — Professional Web Audio API processing chain
 * Simulates Dolby-style audio enhancement:
 *  - Multi-band parametric EQ (10 bands)
 *  - Dynamic range compressor (like Dolby loudness normalisation)
 *  - Stereo widener (M/S processing)
 *  - Convolution reverb for spatial/surround feel
 *  - Bass enhancer (harmonic exciter)
 *  - Output limiter
 */

export const PRESETS = {
    dolby: {
        label: '🎯 Dolby 3D',
        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Flat EQ for original sound
        compressor: { threshold: -18, knee: 30, ratio: 4, attack: 0.003, release: 0.25 }, // Gentle compression
        stereoWidth: 1.4, // Natural M/S width
        bassBoost: 0, // No artificial bass boost
        haasDelay: 0.012, // 12ms Haas cross-delay 
        reverbMix: 0.1, // Subtle room depth
    },
    dtsX: {
        label: '🎫 DTS:X',
        bands: [1, 1, 0, -1, 0, 0, 1, 2, 3, 3], // Crisper high-end, tight bass
        compressor: { threshold: -16, knee: 20, ratio: 5, attack: 0.002, release: 0.2 }, // Faster attack for punch
        stereoWidth: 1.5, // Wider M/S
        bassBoost: 2,
        haasDelay: 0.015,
        reverbMix: 0.15,
        spatialDepth: 2.0, // Clear object-like placement
    },
    dtsVirtualX: {
        label: '🎇 DTS Virtual:X',
        bands: [3, 2, 1, 0, 0, 1, 2, 3, 4, 4], // Smile curve for immersive feel
        compressor: { threshold: -18, knee: 25, ratio: 6, attack: 0.003, release: 0.25 },
        stereoWidth: 1.8, // Ultra wide virtual surround height/width
        bassBoost: 4, // Deep bass impact
        haasDelay: 0.025,
        reverbMix: 0.25, // More room reflection for illusion of space
        spatialDepth: 3.5, // Extends perceived soundstage significantly
    },
    flat: {
        label: '⚖️ Flat',
        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        compressor: { threshold: -50, knee: 40, ratio: 1, attack: 0.003, release: 0.25 },
        stereoWidth: 1.0,
        bassBoost: 0,
        haasDelay: 0.0,
        reverbMix: 0.0,
    },
    bassBoost: {
        label: '🔊 Bass Boost',
        bands: [7, 6, 5, 3, 1, 0, 0, 0, 0, 0],
        compressor: { threshold: -24, knee: 30, ratio: 8, attack: 0.003, release: 0.25 },
        stereoWidth: 1.2,
        bassBoost: 6,
        haasDelay: 0.005,
        reverbMix: 0.05,
    },
    vocal: {
        label: '🎤 Vocal',
        bands: [-2, -1, 0, 2, 4, 5, 4, 2, 1, 0],
        compressor: { threshold: -20, knee: 20, ratio: 6, attack: 0.003, release: 0.25 },
        stereoWidth: 1.2,
        bassBoost: 0,
        haasDelay: 0.008,
        reverbMix: 0.1,
    },
    treble: {
        label: '✨ Treble',
        bands: [0, 0, 0, -1, 0, 1, 2, 3, 4, 5],
        compressor: { threshold: -26, knee: 30, ratio: 8, attack: 0.003, release: 0.25 },
        stereoWidth: 1.4,
        bassBoost: 0,
        haasDelay: 0.012,
        reverbMix: 0.1,
    },
    surround: {
        label: '🌐 7.1 Surround',
        bands: [2, 1, 0, 0, 0, 0, 0, 1, 2, 2], // Slight U-curve for cinematic feel
        compressor: { threshold: -20, knee: 25, ratio: 6, attack: 0.005, release: 0.3 },
        stereoWidth: 1.0,
        bassBoost: 3, // Boost the LFE channel
        haasDelay: 0.020,
        reverbMix: 0.35, // High room reflections for surround depth
        spatialDepth: 4.0, // Push panners far away
    },
    lounge: {
        label: '🎷 Lounge',
        bands: [2, 2, 1, 1, -1, -1, 0, 1, 2, 2],
        compressor: { threshold: -20, knee: 25, ratio: 6, attack: 0.003, release: 0.25 },
        stereoWidth: 1.3,
        bassBoost: 1,
        haasDelay: 0.01,
        reverbMix: 0.2,
    },
};

// 10-band EQ frequencies (Hz)
export const EQ_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Helper to generate a generic synthetic impulse response for spatial convolution
function createImpulseResponse(ctx, duration = 1.5, decay = 2.0) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        // Simple white noise envelope with exponential decay
        const multiplier = Math.pow(1 - i / length, decay);
        left[i] = (Math.random() * 2 - 1) * multiplier;
        right[i] = (Math.random() * 2 - 1) * multiplier;
    }
    return impulse;
}

class DolbyAudioEngine {
    constructor() {
        this.ctx = null;
        this.source = null;
        this.filters = [];
        this.compressor = null;

        // 3D Spatial Audio Nodes (7.1 Simulation)
        this.splitter = null;
        this.pannerFL = null; // Front Left
        this.pannerFR = null; // Front Right
        this.pannerSL = null; // Surround/Side Left (Haas delayed)
        this.pannerSR = null; // Surround/Side Right (Haas delayed)
        this.pannerRL = null; // Rear Left (Reverb)
        this.pannerRR = null; // Rear Right (Reverb)
        this.lfeGain = null; // Low Frequency Effects (Center Subs)

        this.haasDelayL = null;
        this.haasDelayR = null;
        this.convolver = null;
        this.reverbWet = null;
        this.reverbDry = null;

        this.bassFilter = null;
        this.limiter = null;
        this.gainNode = null;
        this.analyser = null;
        this.connected = false;
        this.currentPreset = 'dolby';
        this.bands = [...PRESETS.dolby.bands];
    }

    init(audioElement) {
        if (this.ctx) return; // already initialised
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.source = this.ctx.createMediaElementSource(audioElement);

        // ── 1. 10-band parametric EQ ─────────────────────────────────────────
        this.filters = EQ_BANDS.map((freq, i) => {
            const filter = this.ctx.createBiquadFilter();
            filter.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.4;
            filter.gain.value = 0;
            return filter;
        });
        // chain filters
        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }

        // ── 2. Bass‑harmonic enhancer ────────────────────────────────────────
        this.bassFilter = this.ctx.createBiquadFilter();
        this.bassFilter.type = 'lowshelf';
        this.bassFilter.frequency.value = 120;
        this.bassFilter.gain.value = 0;

        // ── 3. Dynamic range compressor ──────────────────────────────────────
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        // ── 4. Virtual 7.1 Surround Spatializer (HRTF) ─────────────────────────
        this.splitter = this.ctx.createChannelSplitter(2);

        // Panner Helper
        const createPanner = (x, y, z) => {
            const p = this.ctx.createPanner();
            p.panningModel = 'HRTF'; // Human head simulation
            p.distanceModel = 'inverse';
            p.refDistance = 1;
            p.maxDistance = 10000;
            p.rolloffFactor = 1;
            p.coneInnerAngle = 360;
            p.coneOuterAngle = 360;
            p.coneOuterGain = 0;
            // Position in 3D space: x(left/right), y(up/down), z(front/back)
            if (p.positionX) {
                p.positionX.value = x;
                p.positionY.value = y;
                p.positionZ.value = z;
            } else {
                p.setPosition(x, y, z);
            }
            return p;
        };

        // Initialize 6 virtual speakers around the listener's head
        this.pannerFL = createPanner(-1, 0, -1);
        this.pannerFR = createPanner(1, 0, -1);
        this.pannerSL = createPanner(-2, 0, 0);
        this.pannerSR = createPanner(2, 0, 0);
        this.pannerRL = createPanner(-1.5, 0, 1.5);
        this.pannerRR = createPanner(1.5, 0, 1.5);

        // LFE (Subwoofer) bypasses 3D panning, sits dead center
        this.lfeGain = this.ctx.createGain();
        this.lfeGain.gain.value = 1.0;

        // Haas Delays for side/surround widening
        this.haasDelayL = this.ctx.createDelay();
        this.haasDelayR = this.ctx.createDelay();
        this.haasDelayL.delayTime.value = 0.015;
        this.haasDelayR.delayTime.value = 0.015;

        // ── 5. Convolution Reverb (Room Spatialization) ───────────────────────
        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = createImpulseResponse(this.ctx);
        this.reverbDry = this.ctx.createGain();
        this.reverbWet = this.ctx.createGain();
        this.reverbDry.gain.value = 1.0;
        this.reverbWet.gain.value = 0.15;

        // ── 6. Analyser (for visualiser) ─────────────────────────────────────
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;

        // ── 7. Output limiter ────────────────────────────────────────────────
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -1;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.1;

        // ── Final gain ───────────────────────────────────────────────────────
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 1.0;

        // ── Connect the chain ────────────────────────────────────────────────

        // Split frequencies: Bass goes straight to LFE (Center), rest goes to spatializer
        this.source.connect(this.filters[0]);
        this.filters[this.filters.length - 1].connect(this.compressor);

        // Connect Bass Filter directly from source for the .1 LFE channel
        this.source.connect(this.bassFilter);
        this.bassFilter.connect(this.lfeGain);
        this.lfeGain.connect(this.limiter);

        // Dry signal routing to 3D room
        this.compressor.connect(this.reverbDry);
        this.reverbDry.connect(this.splitter);

        // Wet signal routing to convolver
        this.compressor.connect(this.convolver);
        this.convolver.connect(this.reverbWet);

        // ── 7.1 Virtual Speaker Routing ──

        // 1. Front Left/Right (Dry signal)
        this.splitter.connect(this.pannerFL, 0);
        this.splitter.connect(this.pannerFR, 1);

        // 2. Surround Left/Right (Haas delayed crossover for extreme width)
        this.splitter.connect(this.haasDelayR, 0); // L crosses to R delay
        this.splitter.connect(this.haasDelayL, 1); // R crosses to L delay
        this.haasDelayR.connect(this.pannerSR);
        this.haasDelayL.connect(this.pannerSL);

        // 3. Rear Left/Right (Reverberant room reflections)
        // Split the reverb tail into the rear speakers
        const reverbSplitter = this.ctx.createChannelSplitter(2);
        this.reverbWet.connect(reverbSplitter);
        reverbSplitter.connect(this.pannerRL, 0);
        reverbSplitter.connect(this.pannerRR, 1);

        // Sum all 6 spatial channels into the analyser
        this.pannerFL.connect(this.analyser);
        this.pannerFR.connect(this.analyser);
        this.pannerSL.connect(this.analyser);
        this.pannerSR.connect(this.analyser);
        this.pannerRL.connect(this.analyser);
        this.pannerRR.connect(this.analyser);

        // ────────────────────────

        this.analyser.connect(this.limiter);
        this.limiter.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);

        this.connected = true;
        this.applyPreset('dolby');
    }

    async resume() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }
            // Ensure audio keeps playing in background
            if (this.source && this.source.mediaElement) {
                this.source.mediaElement.play().catch(e => console.log('Background play prevented:', e));
            }
        }
    }

    applyPreset(presetKey) {
        const preset = PRESETS[presetKey];
        if (!preset || !this.connected) return;
        this.currentPreset = presetKey;
        this.bands = [...preset.bands];

        // Apply EQ bands
        preset.bands.forEach((gain, i) => {
            if (this.filters[i]) this.filters[i].gain.setTargetAtTime(gain, this.ctx.currentTime, 0.05);
        });

        // Apply compressor
        const c = preset.compressor;
        this.compressor.threshold.setTargetAtTime(c.threshold, this.ctx.currentTime, 0.1);
        this.compressor.knee.setTargetAtTime(c.knee, this.ctx.currentTime, 0.1);
        this.compressor.ratio.setTargetAtTime(c.ratio, this.ctx.currentTime, 0.1);

        // Apply bass boost
        this.bassFilter.gain.setTargetAtTime(preset.bassBoost, this.ctx.currentTime, 0.05);

        // Apply 3D / Surround spatial wideners
        const depth = preset.spatialDepth || 1.0;
        const widthMultiplier = preset.stereoWidth || 1.0;

        // Dynamically move speakers based on spatial depth preset
        const updatePanner = (p, x, y, z) => {
            if (!p) return;
            if (p.positionX) {
                p.positionX.setTargetAtTime(x, this.ctx.currentTime, 0.1);
                p.positionY.setTargetAtTime(y, this.ctx.currentTime, 0.1);
                p.positionZ.setTargetAtTime(z, this.ctx.currentTime, 0.1);
            } else {
                p.setPosition(x, y, z); // Fallback for old Safari
            }
        };

        // Fronts: Push forward and wide based on depth
        updatePanner(this.pannerFL, -1 * widthMultiplier, 0, -1 * depth);
        updatePanner(this.pannerFR, 1 * widthMultiplier, 0, -1 * depth);

        // Surrounds: Push way out to the sides
        updatePanner(this.pannerSL, -2 * widthMultiplier * depth, 0, 0);
        updatePanner(this.pannerSR, 2 * widthMultiplier * depth, 0, 0);

        // Rears: Push far behind
        updatePanner(this.pannerRL, -1.5 * widthMultiplier, 0, 1.5 * depth);
        updatePanner(this.pannerRR, 1.5 * widthMultiplier, 0, 1.5 * depth);

        if (this.haasDelayL) this.haasDelayL.delayTime.setTargetAtTime(preset.haasDelay, this.ctx.currentTime, 0.1);
        if (this.haasDelayR) this.haasDelayR.delayTime.setTargetAtTime(preset.haasDelay, this.ctx.currentTime, 0.1);

        // Apply Convolver Room Reverb
        if (this.reverbWet) this.reverbWet.gain.setTargetAtTime(preset.reverbMix, this.ctx.currentTime, 0.1);
        if (this.reverbDry) this.reverbDry.gain.setTargetAtTime(1.0 - (preset.reverbMix * 0.5), this.ctx.currentTime, 0.1); // Keep dry high, duck slightly
    }

    setBand(index, gainDb) {
        this.bands[index] = gainDb;
        if (this.filters[index]) {
            this.filters[index].gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.01);
        }
    }

    setVolume(v) {
        if (this.gainNode) this.gainNode.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: 3D Spatial Audio / Head Tracking Controller
    // ─────────────────────────────────────────────────────────────────────────
    setListenerOrientation(yawDeg, pitchDeg) {
        if (!this.ctx) return;

        // Convert degrees to radians
        const yawRad = yawDeg * (Math.PI / 180);
        const pitchRad = pitchDeg * (Math.PI / 180);

        // Calculate where the listener is looking (forward vector)
        const fx = Math.sin(yawRad) * Math.cos(pitchRad);
        const fy = Math.sin(pitchRad);
        const fz = -Math.cos(yawRad) * Math.cos(pitchRad);

        // Calculate the tilt of the listener's head (up vector)
        const ux = -Math.sin(yawRad) * Math.sin(pitchRad);
        const uy = Math.cos(pitchRad);
        const uz = Math.cos(yawRad) * Math.sin(pitchRad);

        const listener = this.ctx.listener;

        if (listener.forwardX) {
            listener.forwardX.setTargetAtTime(fx, this.ctx.currentTime, 0.1);
            listener.forwardY.setTargetAtTime(fy, this.ctx.currentTime, 0.1);
            listener.forwardZ.setTargetAtTime(fz, this.ctx.currentTime, 0.1);
            listener.upX.setTargetAtTime(Math.abs(ux) < 1e-6 ? 0 : ux, this.ctx.currentTime, 0.1);
            listener.upY.setTargetAtTime(uy, this.ctx.currentTime, 0.1);
            listener.upZ.setTargetAtTime(Math.abs(uz) < 1e-6 ? 0 : uz, this.ctx.currentTime, 0.1);
        } else if (listener.setOrientation) {
            listener.setOrientation(fx, fy, fz, Math.abs(ux) < 1e-6 ? 0 : ux, uy, Math.abs(uz) < 1e-6 ? 0 : uz);
        }
    }

    getAnalyserData() {
        if (!this.analyser) return new Uint8Array(0);
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        return data;
    }

    destroy() {
        if (this.ctx) { this.ctx.close(); this.ctx = null; }
        this.connected = false;
    }
}

// Singleton
export const dolbyEngine = new DolbyAudioEngine();
