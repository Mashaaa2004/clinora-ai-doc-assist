import { describe, expect, it } from 'vitest';
import { toPcm16 } from '../lib/audio-pcm';

describe('device audio conversion', () => {
  it('converts 48 kHz device audio to 16 kHz samples', () => {
    const pcm = toPcm16(new Float32Array(4800).fill(0.5), 48000);
    expect(pcm.length).toBe(1600);
    expect(pcm[0]).toBe(16383);
  });
  it('converts 44.1 kHz device audio to 16 kHz samples', () => {
    expect(toPcm16(new Float32Array(4410), 44100).length).toBe(1600);
  });
  it('preserves 16 kHz audio and clips out-of-range values', () => {
    expect([...toPcm16(new Float32Array([-2, 0, 2]), 16000)]).toEqual([-32768, 0, 32767]);
  });
});