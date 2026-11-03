/**
 * M12-09・M12-10 の「カード・商品・デッキを画面で作る」シードの共通の作り方。
 * 流れ: （あれば）専用フォーマットの登録 → 既存デッキの一括削除 → カード・商品 → アーキタイプ → デッキ → 呼び名の控え。
 */
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue, defineSeed } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 今日, registerFormat } from "../pages/admin/m12_09_used_card";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { カード定義, アーキタイプを登録する, カードと商品を作る, デッキを一括削除する, デッキを登録する } from "../pages/admin/m12_deck_seed";
import { デッキ内カード明細ID } from "../db/m12_deck";

export type CardSpec = { keys: string[]; subKeys?: string[]; def: カード定義 };
export type DeckSpec = {
  key: string; format: string; archetype: string; 公開?: "公開" | "非公開"; type?: "イベントデッキ" | "ユーザーデッキ";
  eventJ: string; eventE: string; date: () => string; lines: { n: number; card: number; key?: string }[];
};
/** このシード専用のフォーマット（名前は実行の印を付けて作る）。key は呼び名〔フォーマットID-M1210-{key}〕の末尾 */
export type NewFormat = { key: string; 名日: string; 名英: string; 並び順: string };
export type DataSpec = {
  /** 呼び名の接頭辞（M1209・M1210） */
  prefix: string;
  newFormats?: NewFormat[];
  clear: { formats: string[]; range?: { from: string; to: string } }[];
  cards: CardSpec[]; archetypes: { 名日: string; 名英: string; format: string }[]; decks: DeckSpec[];
};

export const fixed = (d: string) => () => d;
export const dayOffset = (n: number) => () => `${今日(n)} 00:00`;

export function defineDataSeed(seedId: string, spec: DataSpec, needs: string[]): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const labels = new Map<string, string>();
    const made = new Set((spec.newFormats ?? []).map((f) => f.名日));
    /** このシード専用のフォーマットは実行の印を付けた名前。ほかは画面の表示名のまま */
    const fmt = (raw: string) => (made.has(raw) ? rc(raw) : raw);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(90_000);
      page.setDefaultNavigationTimeout(180_000);
      for (const f of spec.newFormats ?? []) {
        labels.set(`〔フォーマットID-${spec.prefix}-${f.key}〕`, await registerFormat(page, { 名日: rc(f.名日), 名英: rc(f.名英), 並び順: f.並び順, メタ日数: "30" }, issue));
      }
      for (const c of spec.clear) {
        const n = await デッキを一括削除する(page, c.formats.map(fmt), c.range ?? null, issue);
        if (n) issue(`既存のデッキを${n}件一括削除した（${c.formats.join("・")}${c.range ? `・開催日 ${c.range.from}〜${c.range.to}` : ""}）`);
      }
      const built = await カードと商品を作る(page, spec.cards.map((c) => c.def), seedId, issue);
      spec.cards.forEach((c, i) => {
        const b = built[i];
        for (const k of c.keys) { labels.set(`〔カードID-${spec.prefix}-${k}〕`, b.カードID); labels.set(`〔カードセットID-${spec.prefix}-${k}〕`, b.カードセットID); }
        for (const k of c.subKeys ?? c.keys) {
          if (b.カード詳細ID) labels.set(`〔カード詳細ID-${spec.prefix}-${k}〕`, b.カード詳細ID);
          if (b.商品ID) { labels.set(`〔商品ID-${spec.prefix}-${k}〕`, b.商品ID); labels.set(`〔商品規格ID-${spec.prefix}-${k}〕`, b.商品規格ID!); }
        }
      });
      for (const a of spec.archetypes) await アーキタイプを登録する(page, { 名日: a.名日, 名英: a.名英, フォーマット: fmt(a.format) }, issue);
      for (const d of spec.decks) {
        const id = await デッキを登録する(page, {
          デッキタイプ: d.type ?? "イベントデッキ", フォーマット: fmt(d.format), アーキタイプ名: rc(d.archetype), 公開: d.公開 ?? "公開",
          イベント名日: d.eventJ, イベント名英: d.eventE, 開催日: d.date(),
          メイン: d.lines.map((l) => ({ 枚数: l.n, カード名: spec.cards[l.card].def.カード名 })),
        }, issue);
        labels.set(`〔デッキID-${spec.prefix}-${d.key}〕`, id);
        for (const l of d.lines) if (l.key) labels.set(`〔デッキ内カード明細ID-${spec.prefix}-${l.key}〕`, デッキ内カード明細ID(id, built[l.card].カードID));
      }
    });
    const promised = Notes.labelsIn(seed["状態・属性"] + seed.投入方法).filter((l) => !l.includes("…") && !l.includes("共有") && l.replace(/[〔〕\s]/g, "") !== "");
    for (const l of promised) {
      const v = labels.get(l);
      if (v === undefined) throw new Error(`${seedId}: 呼び名 ${l} に当たる番号を作れなかった`);
      notes.set(l, v);
    }
  });
}

/** 旧形式の名前（M1209試験セット012 X など。接尾辞なしもある） */
export function old(n: string, suf: string, o: Partial<カード定義> & { 略称: string; 商品番号?: string }): CardSpec["def"] {
  const sp = suf ? ` ${suf}` : "";
  return {
    カード名: `M1209 Card ${n}${sp}`, セット名日: `M1209試験セット${n}${sp}`, セット名英: `M1209 Set ${n}${sp}`, セット略称: o.略称,
    特殊タイプ: o.特殊タイプ ?? [], 詳細なし: o.詳細なし,
    商品: o.商品 === null ? null : { 商品コード: `M1209-${n}-${o.商品番号 ?? "P001"}`, 商品名日: `M1209試験商品${n}${sp}`, 商品名英: `M1209 Product ${n}${sp}` },
  };
}
/** CB形式の名前（M1209-CB022-CARD-X など） */
export function cb(n: string, x: string, 特殊: string[], p = "M1209"): CardSpec["def"] {
  return {
    カード名: `${p}-CB${n}-CARD-${x}`, セット名日: `${p}-CB${n}-SETJ-${x}`, セット名英: `${p}-CB${n}-SETE-${x}`, セット略称: `${p}${n}${x}`, 特殊タイプ: 特殊,
    商品: { 商品コード: `${p}-CB${n}-P${x}`, 商品名日: `${p}-CB${n}-PRODJ-${x}`, 商品名英: `${p}-CB${n}-PRODE-${x}` },
  };
}
export const arch = (n: string, x: string, format: string) => ({ 名日: `M1209-CB${n}-ARCHJ-${x}`, 名英: `M1209-CB${n}-ARCHE-${x}`, format });
export const oldArch = (n: string, suf: string, format: string) => ({ 名日: `M1209試験アーキタイプ${n}${suf ? " " + suf : ""}`, 名英: `M1209 Archetype ${n}${suf ? " " + suf : ""}`, format });

