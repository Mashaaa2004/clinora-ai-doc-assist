/** Convert device-rate mono audio to the 16 kHz PCM required by STT. */
export function toPcm16(input: Float32Array, sampleRate: number): Int16Array {
  const ratio = sampleRate / 16000;
  const output = new Int16Array(Math.floor(input.length / ratio));
  for (let i = 0; i < output.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.max(start + 1, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    const value = Math.max(-1, Math.min(1, sum / (end - start)));
    output[i] = value < 0 ? value * 32768 : value * 32767;
  }
  return output;
}