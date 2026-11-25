/**
 * M12-10 特集タグ編集CSVダウンロード(検索項目) の追加シード（栗野さん分の巻き取り・2026-11-25）。正本: cases/M12-10_seed_data.tsv
 * ONE-RESULT-001・002・005・011: 専用フォーマットに、イベントデッキを1件（開催日 2026/04/15・メインボードに商品のカード3枚）だけ登録する。
 * 正本の外の補い: 商品の在庫の入庫と承認（本店の在庫10）は行わない（001・002・005・011 は在庫数を確かめないため。014 は在庫数を確かめるので書いていない）。
 */
import { DataSpec, defineDataSeed, fixed } from "./m12-data";
import "./m12-10";

const spec = (n: string): DataSpec => {
  const fmt = `試験フォーマットA-${n}`;
  return {
    prefix: "M1210",
    newFormats: [{ key: n, 名日: fmt, 名英: `M1210 Format ${n}`, 並び順: `92${n}` }],
    clear: [],
    cards: [{
      keys: [n],
      def: {
        カード名: `M1210CARD${n}`, セット名日: `M12-10セット${n}`, セット名英: `M1210 Set ${n}`, セット略称: `M12${n}`, 特殊タイプ: [],
        商品: { 商品コード: `M1210-P-${n}`, 商品名日: `M12-10商品${n}`, 商品名英: `M1210 Product ${n}` },
      },
    }],
    archetypes: [{ 名日: `M12-10アーキタイプ${n}`, 名英: `M1210 Archetype ${n}`, format: fmt }],
    decks: [{
      key: n, format: fmt, archetype: `M12-10アーキタイプ${n}`, eventJ: `M12-10イベント${n}`, eventE: `M1210 Event ${n}`,
      date: fixed("2026/04/15 00:00"), lines: [{ n: 3, card: 0 }],
    }],
  };
};
for (const n of ["001", "002", "005", "011"]) defineDataSeed(`S-M12-10-ONE-RESULT-${n}`, spec(n), ["S-M12-10-ADM"]);
