/**
 * A14-03 カード情報1件の取得（GET /card?name=&lang=）のシード。正本: cases/A14-03_seed_data.tsv
 *
 * 作り方は、シード表の「投入方法」の文（カードセット管理の登録・カードCSV登録・カード新規登録）を読み取って、画面で再現する。
 * 全員が使うマスタ（カード・カードセット）は、シード表の決まった名前で「あれば使い、無ければ作る」（依頼者決定 2026-11-14「マスタは作ってよい」。
 * 前の実行で作ったものがあれば、そのまま使い回す。シード表の「残っていれば削除」は行わない。ほかの方のデータは消さない）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A14-03_progress_2026-11-24_dev.md にも書く）:
 * - ENV（APIベースURL・試験用データベース）は、共有の開発環境の API（config/env.ts の API_BASE_URL）をそのまま使う（何もしない）。
 * - 「画像の言語を英語から日本語へ変える」は、カードCSVの画像URL(日本語)列に初めから入れて取り込む。
 * - 画像IDは管理画面に表示されないので、控える呼び名には、DB を画像のアドレスで引いた番号を使う（読むだけ）。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { カード詳細の番号, プロモ種別の英語名, 言語の画像の番号, 英語名のカードセットの番号, 英語名のカードの番号 } from "../db/a14_03";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { buildCardCsv, CardCsvRecord, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "../pages/admin/card_csv";
import { カードセットを登録する } from "../pages/admin/m14_08_cardset";
import { 画像の言語を日本語へ変える } from "../pages/admin/a14_03_setup";
import { カードを登録する } from "../pages/admin/m14_card";

type セット = { 名日: string; 名英: string; 略称: string; 発売日: string; 特殊: boolean };
type CSV行 = { 名日: string; 名英: string; セット: string; プロモ: boolean; フォイル: string; 画像日: string; 画像英: string; 詳細ID: string };
type 登録 = { 名日: string; 名英: string; セット?: string };

const 空欄 = (v: string) => (v === "空欄" || v.startsWith("空欄") ? "" : v);

/** シード表の投入方法の文から、作るものを読み取る */
function 読む(投入方法: string): { セット: セット[]; CSV: CSV行[]; 登録: 登録[] } {
  const セット = [...投入方法.matchAll(/カードセット名（日本語）に「([^」]+)」、カードセット名（英語）に「([^」]+)」、略称に「([^」]+)」、リリース日に([\d-]+)を入れ、特殊セットフラグにチェックを入れ(て|ずに)/g)]
    .map((m) => ({ 名日: m[1], 名英: m[2], 略称: m[3], 発売日: m[4], 特殊: m[5] === "て" }));
  const CSV: CSV行[] = [];
  for (const m of 投入方法.matchAll(/カード名\(日本語\)=([^、]+)、カード名\(英語\)=([^、（]+?)(?:（[^）]*）)?、点数で見たマナコスト=0、カードセット=([^、]+)、レアリティとレイアウトに登録済みの英語名を1つずつ、プロモ種別=([^、]+)、Foil=(\d)(?:（[^）]*）)?、画像URL\(日本語\)=([^、]+)、画像URL\(英語\)=([^、（]+)(?:（[^）]*）)?、カード詳細ID=(\d+)/g)) {
    CSV.push({ 名日: m[1], 名英: m[2], セット: 空欄(m[3]), プロモ: !m[4].startsWith("空欄"), フォイル: m[5], 画像日: 空欄(m[6]), 画像英: 空欄(m[7]), 詳細ID: m[8] });
  }
  const 登録: 登録[] = [...投入方法.matchAll(/カード新規登録でカード名\(日\)に「([^」]+)」、カード名\(英\)に「([^」]+)」[^／]*?(詳細情報を追加せずに|詳細情報を追加を押して、カードセットに「([^」]+)」)/g)]
    .map((m) => ({ 名日: m[1], 名英: m[2], ...(m[4] ? { セット: m[4] } : {}) }));
  return { セット, CSV, 登録 };
}

/** 「画像の言語を英語から日本語へ変える」と書かれた行は、画像を日本語として取り込む（CSV の日本語の列へ） */
function 日本語へ変える(投入方法: string, 英URL: string): boolean {
  const i = 投入方法.indexOf(英URL);
  return i >= 0 && /必須列のためここへ入れ、あとで言語を日本語へ変える/.test(投入方法.slice(i, i + 80));
}

async function 作る({ browser, notes, seed }: SeedCtx): Promise<void> {
  const 投入 = seed.投入方法;
  const { セット, CSV, 登録 } = 読む(投入);
  const iss = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page: Page) => {
    for (const s of セット) {
      if (英語名のカードセットの番号(s.名英)) { iss(`カードセット「${s.名英}」は登録済みなので使い回した`); continue; }
      await カードセットを登録する(page, { 名日: s.名日, 名英: s.名英, 略称: s.略称, リリース日: s.発売日, 特殊: s.特殊 }, seed.シードID);
    }
    const 無いCSV = CSV.filter((c) => !英語名のカードの番号(c.名英));
    if (無いCSV.length) {
      const 既存 = await readExistingCardValues(page);
      const headers = await downloadCardCsvTemplate(page);
      const rows: CardCsvRecord[] = 無いCSV.map((c) => {
                const セット名 = c.セット ? セット.find((s) => s.名英 === c.セット)?.名英 ?? c.セット : "";
        return {
          name_jp: c.名日, name_en: c.名英, cmc: "0", set: セット名, rarity: 既存.rarity, layout: 既存.layout,
          promotion_type: c.プロモ ? プロモ種別の英語名() : "", foil: c.フォイル,
          image_jp: c.画像日, image_en: c.画像英, card_detail_id: c.詳細ID,
        };
      });
      await uploadCardCsv(page, buildCardCsv(headers, rows), `a1403_${seed.シードID.slice(-7).replace(/[^0-9A-Z]/g, "")}.csv`, `${seed.シードID}: カード登録CSV`, (w) => iss(`カードCSVの警告「${w}」`));
    }
    // 「画像の言語を英語から日本語へ変える」（カードCSVは画像URL(英語)が必須列なので、英語で取り込んだあと、カード詳細の画面で日本語へ変える）
    for (const c of CSV) {
      const カードID = 英語名のカードの番号(c.名英);
      if (カードID && c.画像日 === "" && 日本語へ変える(投入, c.画像英) && !言語の画像の番号(カードID, "日本語")) {
        await 画像の言語を日本語へ変える(page, カードID, c.詳細ID);
        iss(`カード「${c.名英}」の画像（${c.画像英}）の言語を、カード詳細の画面で英語から日本語へ変えた`);
      }
    }
    for (const r of 登録) {
      if (英語名のカードの番号(r.名英)) { iss(`カード「${r.名英}」は登録済みなので使い回した`); continue; }
      await カードを登録する(page, {
        カード名日: r.名日, カード名英: r.名英, 点数で見たマナ: "0",
        詳細: r.セット ? { カードセット: r.セット } : false,
      }, seed.シードID, iss);
    }
  });
  // 控える番号（シード表の「控える」の呼び名）。カードは最後の手順の「行に表示されたIDを控える（〔…〕）」から、カードセットは登録の手順から、画像はアドレスから読む
  const カードの呼び名 = [...投入.matchAll(/「([^」]+)」（([^）]+)）の行に表示されたIDを控える（(〔カードID-A1403-[^〕]+〕)）/g)];
  const カード: Record<string, string> = {};
  for (const m of カードの呼び名) {
    const id = 英語名のカードの番号(m[2]);
    if (!id) throw new Error(`${seed.シードID}: カード「${m[1]}」（${m[2]}）が登録後に見つからない`);
    notes.set(m[3], id);
    カード[m[3].replace(/^〔カードID-A1403-|〕$/g, "")] = id;
  }
  for (const m of 投入.matchAll(/カードセット名（英語）に「([^」]+)」[^／]*?URL末尾の番号を控える（(〔カードセットID-A1403-[^〕]+〕)）/g)) {
    const id = 英語名のカードセットの番号(m[1]);
    if (!id) throw new Error(`${seed.シードID}: カードセット「${m[1]}」が登録後に見つからない`);
    notes.set(m[2], id);
  }
  // 画像ID・カード詳細ID: 呼び名の末尾に合うカードを探し、DB を言語・カードで引いて控える（読むだけ）
  const 全文 = `${seed["状態・属性"]}${投入}`;
  const 合うカード = (末尾: string, 言語?: "日本語" | "英語"): string | undefined => {
    if (カード[末尾]) return カード[末尾];
    const 頭 = (/^\d+/.exec(末尾) ?? [""])[0];
    const 候補 = Object.entries(カード).filter(([k]) => k.startsWith(頭)).map(([, v]) => v);
    return (言語 ? 候補.find((c) => 言語の画像の番号(c, 言語)) : 候補.find((_, i, a) => a.length === 1) ?? 候補[候補.length - 1]) ?? 候補[0];
  };
  for (const m of new Set(全文.match(/〔(?:日本語|英語)画像ID-A1403-[^〕]+〕/g) ?? [])) {
    const [, 言語, 末尾] = /〔(日本語|英語)画像ID-A1403-([^〕]+)〕/.exec(m)!;
    const c = 合うカード(末尾, 言語 as "日本語" | "英語");
    const x = c ? 言語の画像の番号(c, 言語 as "日本語" | "英語") : null;
    if (!x) throw new Error(`${seed.シードID}: ${m} の画像が登録後に見つからない`);
    notes.set(m, x);
  }
  for (const m of new Set(全文.match(/〔カード詳細ID-A1403-[^〕]+〕/g) ?? [])) {
    const 末尾 = /-A1403-([^〕]+)〕/.exec(m)![1];
    const 頭 = (/^\d+/.exec(末尾) ?? [""])[0];
    const 候補 = Object.entries(カード).filter(([k]) => k.startsWith(頭));
    const c = (候補.find(([k]) => k.endsWith("C")) ?? 候補[0])?.[1];
    const d = c ? カード詳細の番号(c)[0] : undefined;
    if (!d) throw new Error(`${seed.シードID}: ${m} の詳細が見つからない`);
    notes.set(m, d);
  }
}

defineSeed("S-A14-03-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境の API（config/env.ts の API_BASE_URL）をそのまま使った（APIベースURLの設定・試験用データベースへの接続は、環境が済ませたもの）");
});

for (const id of Object.keys(Object.fromEntries(
  ["BASE-001", "SPLIT-007", "SPLIT-008", "INCOMPLETE-009", "LANG-011", "LANG-012", "LANG-013", "LANG-014", "SPECIAL-015", "RELEASE-016", "FOIL-017", "PROMOTION-018",
    "KEYLANG-019", "KEYSPECIAL-020", "KEYRELEASE-021", "KEYFOIL-022", "ENGONLY-024", "CBSTAGE-025", "CBSTAGE-026", "CBSTAGE-027", "CBSTAGE-028", "CBSTAGE-029",
    "CBMISS-033", "CBBOTH-034", "CBONE-035"].map((s) => [`S-A14-03-${s}`, 1])))) {
  getSeed(id);
  defineSeed(id, 作る);
}
