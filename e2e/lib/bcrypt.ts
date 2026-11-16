/**
 * bcrypt の保存値を作る（読み取り専用の計算だけ。外部のライブラリを足さない）。
 *
 * 使い道: 画面の入力規則（会員のパスワードは12文字以上）に合わないパスワードの会員を前提にするケース（F06-27 など）で、
 * E2E が作った印つきの会員の保存パスワードを DB で置き換えるときの「標準のパスワード生成処理で作った保存値」を作る。
 * アプリの会員のパスワードは自動選択の方式（bcrypt を照合できる）で照合するので、bcrypt の保存値ならアプリの秘密の値が要らない。
 *
 * 作り: OpenBSD の bcrypt と同じ（EksBlowfish・"OrpheanBeholderScryDoubt" を64回暗号化・独自の base64）。
 * Blowfish の初期値（P配列18語と S箱 4×256語）は円周率の小数部の16進の並びなので、表を書き写さずに円周率を計算して作る。
 * 正しさは既知の試験値（"U*U" / $2a$05$CCCCCCCCCCCCCCCCCCCCC. → …E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW）で確かめる（bcryptSelfTest）。
 */
import { randomBytes } from "node:crypto";

const WORDS = 18 + 4 * 256;
let piWords: Uint32Array | undefined;

/** 円周率の小数部を 32 ビットずつ WORDS 語（Machin の式を BigInt の固定小数点で） */
function blowfishInit(): Uint32Array {
  if (piWords) return piWords;
  const bits = BigInt(WORDS * 32 + 64);
  const one = 1n << bits;
  const arctanInv = (x: bigint): bigint => {
    let sum = 0n;
    let term = one / x;
    const x2 = x * x;
    for (let k = 0n; term !== 0n; k++) {
      const t = term / (2n * k + 1n);
      sum = k % 2n === 0n ? sum + t : sum - t;
      term /= x2;
    }
    return sum;
  };
  const pi = 16n * arctanInv(5n) - 4n * arctanInv(239n);
  const frac = (pi & (one - 1n)) >> 64n; // 整数部（3）を除き、誤差を含む下の64ビットを捨てる
  const out = new Uint32Array(WORDS);
  for (let i = 0; i < WORDS; i++) out[i] = Number((frac >> BigInt((WORDS - 1 - i) * 32)) & 0xffffffffn);
  piWords = out;
  return out;
}

class State {
  P: Uint32Array;
  S: Uint32Array; // S0..S3 を続けて 1024 語
  constructor() {
    const init = blowfishInit();
    this.P = init.slice(0, 18);
    this.S = init.slice(18);
  }
  private F(x: number): number {
    const S = this.S;
    return ((((S[x >>> 24] + S[256 + ((x >>> 16) & 0xff)]) >>> 0) ^ S[512 + ((x >>> 8) & 0xff)]) + S[768 + (x & 0xff)]) >>> 0;
  }
  encipher(lr: Uint32Array, off: number): void {
    const P = this.P;
    let l = lr[off] ^ P[0];
    let r = lr[off + 1];
    for (let i = 1; i <= 16; i += 2) {
      r ^= this.F(l >>> 0) ^ P[i];
      l ^= this.F(r >>> 0) ^ P[i + 1];
    }
    lr[off] = (r ^ P[17]) >>> 0;
    lr[off + 1] = l >>> 0;
  }
}

function streamToWord(data: Uint8Array, pos: { j: number }): number {
  let w = 0;
  for (let i = 0; i < 4; i++) {
    if (pos.j >= data.length) pos.j = 0;
    w = ((w << 8) | data[pos.j]) >>> 0;
    pos.j++;
  }
  return w;
}

/** Blowfish_expandstate（salt が null なら Blowfish_expand0state） */
function expand(st: State, salt: Uint8Array | null, key: Uint8Array): void {
  const kp = { j: 0 };
  for (let i = 0; i < 18; i++) st.P[i] = (st.P[i] ^ streamToWord(key, kp)) >>> 0;
  const sp = { j: 0 };
  const lr = new Uint32Array(2);
  const mix = () => {
    if (salt) {
      lr[0] ^= streamToWord(salt, sp);
      lr[1] ^= streamToWord(salt, sp);
    }
    st.encipher(lr, 0);
  };
  for (let i = 0; i < 18; i += 2) { mix(); st.P[i] = lr[0]; st.P[i + 1] = lr[1]; }
  for (let i = 0; i < 1024; i += 2) { mix(); st.S[i] = lr[0]; st.S[i + 1] = lr[1]; }
}

const B64 = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function encode64(d: Uint8Array): string {
  let s = "";
  let p = 0;
  while (p < d.length) {
    let c1 = d[p++];
    s += B64[c1 >> 2];
    c1 = (c1 & 0x03) << 4;
    if (p >= d.length) { s += B64[c1]; break; }
    let c2 = d[p++];
    c1 |= (c2 >> 4) & 0x0f;
    s += B64[c1];
    c1 = (c2 & 0x0f) << 2;
    if (p >= d.length) { s += B64[c1]; break; }
    c2 = d[p++];
    c1 |= (c2 >> 6) & 0x03;
    s += B64[c1];
    s += B64[c2 & 0x3f];
  }
  return s;
}

function decode64(s: string, len: number): Uint8Array {
  const out = new Uint8Array(len);
  const v = (c: string) => { const i = B64.indexOf(c); if (i < 0) throw new Error(`bcrypt の base64 に無い文字「${c}」`); return i; };
  let p = 0;
  let o = 0;
  while (o < len) {
    const c1 = v(s[p++]); const c2 = v(s[p++]);
    out[o++] = (c1 << 2) | ((c2 & 0x30) >> 4);
    if (o >= len) break;
    const c3 = v(s[p++]);
    out[o++] = ((c2 & 0x0f) << 4) | ((c3 & 0x3c) >> 2);
    if (o >= len) break;
    const c4 = v(s[p++]);
    out[o++] = ((c3 & 0x03) << 6) | c4;
  }
  return out;
}

function hashWith(password: string, cost: number, salt: Uint8Array, prefix: string): string {
  if (cost < 4 || cost > 31) throw new Error(`bcrypt の強さ ${cost} は 4〜31`);
  const pw = Buffer.from(password, "utf-8");
  const key = new Uint8Array(Math.min(pw.length + 1, 72));
  key.set(pw.subarray(0, key.length - (pw.length + 1 > 72 ? 0 : 1)));
  const st = new State();
  expand(st, salt, key);
  const rounds = 2 ** cost;
  for (let i = 0; i < rounds; i++) { expand(st, null, key); expand(st, null, salt); }
  const ctext = Buffer.from("OrpheanBeholderScryDoubt", "latin1");
  const cdata = new Uint32Array(6);
  for (let i = 0; i < 6; i++) cdata[i] = ctext.readUInt32BE(i * 4);
  for (let i = 0; i < 64; i++) for (let j = 0; j < 6; j += 2) st.encipher(cdata, j);
  const out = Buffer.alloc(24);
  for (let i = 0; i < 6; i++) out.writeUInt32BE(cdata[i], i * 4);
  return `${prefix}${String(cost).padStart(2, "0")}$${encode64(salt)}${encode64(out.subarray(0, 23))}`;
}

/** 平文のパスワードから bcrypt の保存値（$2y$ 形式。PHP の password_hash と同じ形）を作る */
export function bcryptHash(password: string, cost = 10): string {
  bcryptSelfTest();
  return hashWith(password, cost, new Uint8Array(randomBytes(16)), "$2y$");
}

let tested = false;
/** 既知の試験値で計算が正しいことを確かめる（違えば投げる。誤った保存値を DB に書かないため） */
export function bcryptSelfTest(): void {
  if (tested) return;
  const salt = decode64("CCCCCCCCCCCCCCCCCCCCC.", 16);
  const got = hashWith("U*U", 5, salt, "$2a$");
  const want = "$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW";
  if (got !== want) throw new Error(`bcrypt の計算が既知の試験値と合わない（${got}）`);
  tested = true;
}
