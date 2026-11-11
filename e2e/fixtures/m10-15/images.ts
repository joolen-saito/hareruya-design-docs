/**
 * M10-15 店舗登録で選ぶ画像ファイル。シード表が形式・大きさ（バイト数）・色・寸法だけを定め、絵の中身は定めないので、
 * 単色の画像を作り、形式ごとの注釈の区画（PNG の tEXt・JPEG の COM・GIF のコメント）で定めのバイト数ちょうどに埋める。
 * JPEG はブラウザの描画の部品で作る（ここには JPEG の符号化の部品が無い）。
 */
import { deflateSync } from "node:zlib";
import { Page } from "@playwright/test";

export type 画像 = { name: string; mimeType: string; buffer: Buffer };

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer): Buffer => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** 単色の PNG。bytes を与えると、注釈の区画でそのバイト数ちょうどにする */
export function 単色PNG(name: string, w: number, h: number, rgb: [number, number, number], bytes?: number): 画像 {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const head = Buffer.concat([sig, chunk("IHDR", ihdr)]);
  const tail = Buffer.concat([chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
  let buffer = Buffer.concat([head, tail]);
  if (bytes !== undefined) {
    const pad = bytes - buffer.length - 12; // 区画の長さ・種類・CRC の12バイト
    if (pad < 8) throw new Error(`${name}: ${bytes} バイトに埋められない（画像だけで ${buffer.length} バイト）`);
    const text = Buffer.concat([Buffer.from("Comment\0", "latin1"), Buffer.alloc(pad - 8, 0x20)]);
    buffer = Buffer.concat([head, chunk("tEXt", text), tail]);
  }
  if (bytes !== undefined && buffer.length !== bytes) throw new Error(`${name}: ${buffer.length} バイトになった（${bytes} バイトのはず）`);
  return { name, mimeType: "image/png", buffer };
}

/** 1×1 の GIF（よく知られた最小の画像）を、コメントの区画で bytes ちょうどにする */
export function GIF(name: string, bytes: number): 画像 {
  const base = Buffer.from("R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");
  const body = base.subarray(0, base.length - 1); // 末尾の終わりの印（0x3B）の前にコメントを入れる
  let need = bytes - base.length - 3; // コメントの始まり2バイト・終わり1バイト
  const blocks: Buffer[] = [];
  while (need > 0) {
    const n = Math.min(255, need - 1);
    if (n <= 0) throw new Error(`${name}: ${bytes} バイトに埋められない`);
    blocks.push(Buffer.concat([Buffer.from([n]), Buffer.alloc(n, 0x20)]));
    need -= n + 1;
  }
  const buffer = Buffer.concat([body, Buffer.from([0x21, 0xfe]), ...blocks, Buffer.from([0x00, 0x3b])]);
  if (buffer.length !== bytes) throw new Error(`${name}: ${buffer.length} バイトになった（${bytes} バイトのはず）`);
  return { name, mimeType: "image/gif", buffer };
}

/** 単色の JPEG をブラウザの描画の部品で作り、注釈の区画（COM）で bytes ちょうどにする */
export async function JPEG(page: Page, name: string, bytes: number): Promise<画像> {
  const url = await page.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 64;
    const g = c.getContext("2d")!; g.fillStyle = "#3366cc"; g.fillRect(0, 0, 64, 64);
    return c.toDataURL("image/jpeg", 0.9);
  });
  const base = Buffer.from(url.split(",")[1], "base64");
  let need = bytes - base.length;
  const segs: Buffer[] = [];
  while (need > 0) {
    // 区画は印2バイト＋長さ2バイト（長さは自分の2バイトを含み65535まで）
    let total = Math.min(65537, need);
    if (need - total > 0 && need - total < 4) total -= 4;
    if (total < 4) throw new Error(`${name}: ${bytes} バイトに埋められない`);
    const len = total - 2;
    const seg = Buffer.alloc(total, 0x20);
    seg[0] = 0xff; seg[1] = 0xfe; seg.writeUInt16BE(len, 2);
    segs.push(seg);
    need -= total;
  }
  const buffer = Buffer.concat([base.subarray(0, 2), ...segs, base.subarray(2)]);
  if (buffer.length !== bytes) throw new Error(`${name}: ${buffer.length} バイトになった（${bytes} バイトのはず）`);
  return { name, mimeType: "image/jpeg", buffer };
}

/** シード表の画像（S-M10-15-PNG・GIF・QJ-IMG と、BASE 系の更新前のショップアイコン old-icon.png） */
export const 画像ファイル = {
  "old-icon.png": () => 単色PNG("old-icon.png", 32, 32, [0, 128, 0], 2000),
  "shop-icon.png": () => 単色PNG("shop-icon.png", 64, 64, [200, 120, 0], 10000),
  "shop-icon.gif": () => GIF("shop-icon.gif", 10000),
  "qj001-before.png": () => 単色PNG("qj001-before.png", 200, 200, [255, 0, 0]),
  "qj001-after.png": () => 単色PNG("qj001-after.png", 200, 200, [0, 0, 255]),
};
