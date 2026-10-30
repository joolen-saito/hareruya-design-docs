/**
 * 決め打ちの識別の値（商品コード・商品名など）に付ける「実行ごとの印」（依頼者決定 2026-10-28「案Aで進めて」）。
 *
 * - 正本（シード表・ケース）が決め打ちにしている値で商品などを作ると、同じDBで流し直したときに前の実行の残りに当たり、
 *   シードが止まる（商品は在庫の記録が付くと画面から消せない）。E2E では、値の末尾に実行ごとの印を付けて作り、
 *   ケースの事前準備・手順・期待結果の同じ値も、同じ印を付けた値として読む。正本の文は変えない。
 * - 印は1回の実行（Playwright のプロセス）の中では同じ。共有シードの控えた番号もプロセスの中だけで持ち回すので食い違わない。
 * - ケースが値そのものの書式・文字数・重複を確かめるときは使わない（そのケースは正本の値のまま）。
 * - どの値にどの印を付けたかは、エビデンスの「控えた番号」に「実行の印: 正本の値」→ 実際の値 として残す（lib/case.ts）。
 * - 案と範囲: e2e/review/proposal_fixed_codes_2026-10-28.md
 */

/** この実行の印（E2E_RUN_MARK で与えれば、それを使う。調べるときに同じ値で流し直すため） */
export const RUN_MARK = (process.env.E2E_RUN_MARK || Date.now().toString(36).toUpperCase()).replace(/[^0-9A-Z]/gi, "");

const used = new Map<string, string>();

/** 正本の値に実行の印を付けた値（同じ正本の値には、いつも同じ値を返す） */
export function rc(value: string): string {
  const actual = `${value}-${RUN_MARK}`;
  used.set(value, actual);
  return actual;
}

/** 実際の値から印を外して正本の値に戻す（印の無い値はそのまま） */
export function unrc(value: string): string {
  return value.endsWith(`-${RUN_MARK}`) ? value.slice(0, -(RUN_MARK.length + 1)) : value;
}

/** 文の中の印つきの値を、正本の値に戻す（画面の文と、正本の文を並べて見せるため） */
export function unrcText(text: string): string {
  return text.split(`-${RUN_MARK}`).join("");
}

/** 印を付けた値のうち、文 text に正本の値が出てくるもの（エビデンスに残す対応） */
export function markedIn(text: string): [string, string][] {
  return [...used.entries()].filter(([v]) => text.includes(v));
}
