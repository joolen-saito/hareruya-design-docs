/**
 * TOTP（RFC 6238）生成ヘルパ。外部依存を増やさず Node 標準 crypto のみで実装する。
 *
 * ec-cube-enterprise の二段階認証は `RobThree\Auth\TwoFactorAuth`（TwoFactorAuthService.php:55,114-122）を
 * 既定設定で用いる＝アルゴリズム SHA1／桁数 6／周期 30 秒／秘密鍵 base32。
 * 検証は `verifyCode($authKey, $token, 2)`（同:114-117）で許容ウィンドウ ±2 周期。
 *
 * 本ヘルパは「既知の秘密鍵」から現在時刻の有効な 6 桁トークンを算出するためのテスト用ユーティリティであり、
 * 秘密鍵原値はテスト環境変数で受け渡す（設計書・ログに原値を書かない）。
 */
import { createHmac } from "crypto";

/** RFC 4648 の base32（A-Z2-7）をデコードして Buffer を返す。 */
function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue; // 不正文字はスキップ（RobThree 既定の base32 範囲のみ）
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(out);
}

/**
 * 指定秘密鍵（base32）について、与えた時刻における 6 桁 TOTP を返す。
 * period/digits/algorithm は RobThree 既定に合わせる。
 */
export function generateTotp(
  secretBase32: string,
  forDateMs: number,
  period = 30,
  digits = 6
): string {
  const counter = Math.floor(forDateMs / 1000 / period);
  const counterBuf = Buffer.alloc(8);
  // 64bit big-endian。JS の安全整数範囲で十分（counter は 2^53 未満）。
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", base32Decode(secretBase32)).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = (binary % 10 ** digits).toString().padStart(digits, "0");
  return otp;
}

/** 現在時刻の有効な 6 桁 TOTP を返す（テスト実行時の now を使う）。 */
export function currentTotp(secretBase32: string): string {
  return generateTotp(secretBase32, Date.now());
}

/**
 * 「許容ウィンドウ内のどの有効 TOTP とも確実に異なる」6 桁を返す（不一致テスト用）。
 * verifyCode は ±2 周期（TwoFactorAuthService.php:117）を許容する。送信が30秒境界をまたいでサーバ側の
 * 許容窓が1step進む余地まで見込み、現在時刻 ±3 ステップ（=±2窓＋境界跨ぎ1step）の全有効コードを除外する。
 */
export function mismatchTotp(secretBase32: string, period = 30): string {
  const now = Date.now();
  const valid = new Set<string>();
  for (let step = -3; step <= 3; step++) {
    valid.add(generateTotp(secretBase32, now + step * period * 1000, period));
  }
  for (let candidate = 0; candidate < 1_000_000; candidate++) {
    const code = candidate.toString().padStart(6, "0");
    if (!valid.has(code)) return code;
  }
  // 100万通りすべてが有効になることはあり得ないため到達しない。
  throw new Error("有効でない6桁トークンを生成できませんでした");
}
