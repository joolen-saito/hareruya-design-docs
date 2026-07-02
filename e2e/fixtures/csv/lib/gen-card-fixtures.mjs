#!/usr/bin/env node
/**
 * カードCSV取込(m14-05)の入力フィクスチャ生成器。
 *
 * 正典: ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php
 *   - 論理キー順   = getCsvHeader() の array_keys（35キー）
 *   - 必須列       = getRequiredCsvHeaderKeys() = [name_en, rarity, layout, image_en]
 *   - ヘッダ除外   = getNotRequiredCsvHeaderKeys() = [card_detail_id, keyword_ability]
 * ヘッダ比較は除外キーを両辺から外して行うため、ファイルは除外2キーを省略した 33 列で構成する
 * （列数チェック #5 の基準もこの 33 列）。
 *
 * 出力先: e2e/fixtures/csv/card_csv_import/*.csv|*.tsv|*.png
 * 各ファイルは m14-05 の「判定順序」#1〜#8 の1ステップに対応（README 参照）。列数を機械的に保証する。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "card_csv_import");
mkdirSync(OUT, { recursive: true });

// getCsvHeader() のキー順から除外2キー(keyword_ability, card_detail_id)を外した論理キー列（33列）。
const HEADER = [
  "name_jp", "name_en", "arena_format_name_jp", "arena_format_name_en",
  "text_jp", "text_en", "mana_cost", "cmc", "power", "toughness", "loyalty",
  "cardtype", "color", "color_identity", "subtype", "specialtype",
  "format", "restriction_format", "ban_format", "set", "rarity", "illustrator",
  "layout", "flavor_jp", "flavor_en", "card_no", "promotion_type", "foil", "frame",
  "image_jp", "image_en", "back_card_detail_id", "color_sequence",
];

// 正常系カード1行の基準値（必須4列は非空、任意はほぼ空）。
const validCard = {
  name_jp: "E2Eテストカード",
  name_en: "E2E Test Card",
  cmc: "2",
  cardtype: "Creature",
  color: "White",
  rarity: "Common",        // ← SEED-M14-05-MASTER が保証
  layout: "Normal",        // ← SEED-M14-05-MASTER が保証
  set: "E2E Test Set",     // ← SEED-M14-05-MASTER の mtb_cardset を照合（#7 マスタ存在の成功系）
  card_no: "E2E-001",
  foil: "0",
  frame: "Normal",
  image_en: "https://example.test/e2e-card.jpg",
};

const cell = (v) => (v == null ? "" : String(v));
const row = (obj, keys = HEADER) => keys.map((k) => cell(obj[k]));

function toLine(fields, sep) {
  return fields
    .map((f) => {
      const s = String(f);
      // 区切り文字・改行・二重引用符を含むセルは引用する。
      if (s.includes(sep) || s.includes("\n") || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    })
    .join(sep);
}

function writeCsv(name, dataRows, { header = HEADER, sep = "," } = {}) {
  const lines = [toLine(header, sep), ...dataRows.map((r) => toLine(r, sep))];
  writeFileSync(join(OUT, name), lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${name} (cols=${header.length}, rows=${dataRows.length})`);
}

// --- #8 成功: 全必須＋任意妥当。SEED-M14-05-MASTER のマスタ値を参照 ---
writeCsv("valid.csv", [row(validCard)]);

// --- #1 拡張子: 実装 CardCsvController は拡張子が csv 以外を拒否（admin.card.csv_tsv_not_allowed）。
//     設計docは「tsvはタブ区切りで取込可」とするが実装は拒否＝乖離（DIVERGENCES.md）。異常系として置く。
writeCsv("tsv_rejected.tsv", [row(validCard)], { sep: "\t" });

// --- 多値列: color/cardtype を「,」「/」で多値＋重複。成功系 ---
writeCsv("multivalue.csv", [
  row({ ...validCard, name_en: "E2E Test Card Multi", card_no: "E2E-041",
        color: "White/Blue/White", cardtype: "Creature,Creature" }),
]);

// --- #6 例外規則: cmc 空 → 0 扱いで取込継続（成功系） ---
writeCsv("cmc_empty.csv", [
  row({ ...validCard, name_en: "E2E Test Card CmcEmpty", card_no: "E2E-037", cmc: "" }),
]);

// --- #3 ヘッダ不一致: 必須キー name_en を別名に改名 → format.header ---
const badHeader = HEADER.map((k) => (k === "name_en" ? "name_english" : k));
writeCsv("header_mismatch.csv", [row(validCard)], { header: badHeader });

// --- #4 データ0行: ヘッダのみ → data.empty ---
writeCsv("empty_data.csv", []);

// --- #5 列数不一致: 正しい33列ヘッダに対し、データ行を1列少なく（32列） → format.body ---
{
  const short = row(validCard).slice(0, HEADER.length - 1); // 32列
  writeCsv("column_count_mismatch.csv", [short]);
}

// --- #6 必須空(name_en) → data.require ---
writeCsv("missing_required_name_en.csv", [
  row({ ...validCard, name_en: "", card_no: "E2E-033" }),
]);

// --- #6 必須空(rarity) → data.require ---
writeCsv("missing_required_rarity.csv", [
  row({ ...validCard, name_en: "E2E Test Card NoRarity", card_no: "E2E-036", rarity: "" }),
]);

// --- #7 マスタ不存在: rarity に存在しない英名 → data.not_registered ---
writeCsv("master_not_found.csv", [
  row({ ...validCard, name_en: "E2E Test Card BadRarity", card_no: "E2E-034",
        rarity: "NoSuchRarityXYZ" }),
]);

console.log("done. (oversize.csv / invalid_mime.png は gen-volatile.sh で生成)");
