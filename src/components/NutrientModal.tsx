// src/components/NutrientModal.tsx
import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
} from "@mui/material";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";
import { NutrientData, PCAFoodData } from "../pages/HomePage";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedFoods: { food: PCAFoodData; operation: "+" | "-" }[];
  closestFood: PCAFoodData | null;
  nutrientData: NutrientData[];
};

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#d884f3",
  "#f39462",
  "#41b3a3",
  "#e64980",
];

const NutrientModal: React.FC<Props> = ({
  open,
  onClose,
  selectedFoods,
  closestFood,
  nutrientData,
}) => {
  // 1. 表示対象の食品名をまとめる (重複排除)
  const uniqueFoods = useMemo(() => {
    const arr = [...selectedFoods.map((sf) => sf.food.foodName)];
    if (closestFood) {
      arr.push(closestFood.foodName);
    }
    return Array.from(new Set(arr));
  }, [selectedFoods, closestFood]);

  // 2. 各食品の栄養素データを取得し、foodName -> {nutrientName -> value} 形式に集約
  const foodNutrientMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    uniqueFoods.forEach((fName) => {
      const item = nutrientData.find((nd) => nd.foodName === fName);
      map[fName] = item ? item.nutrients : {};
    });
    return map;
  }, [uniqueFoods, nutrientData]);

  // 3. uniqueFoods についてのみ、全栄養素名を洗い出し
  //    (実際には nutrientData 全体のキーを集めてもいいが、ここでは対象食品が持つものを対象に)
  const allNutrientNames = useMemo(() => {
    const setOfKeys = new Set<string>();
    uniqueFoods.forEach((fName) => {
      const nutrientsObj = foodNutrientMap[fName] || {};
      Object.keys(nutrientsObj).forEach((k) => setOfKeys.add(k));
    });
    return Array.from(setOfKeys);
  }, [uniqueFoods, foodNutrientMap]);

  // 4. "差が大きい"順に上位10件を抽出
  //    差 = (対象食品群における最大値 - 最小値)
  const topNutrients = useMemo(() => {
    // nutrientごとに差分を計算
    const list = allNutrientNames.map((nutName) => {
      let minVal = Infinity;
      let maxVal = -Infinity;
      uniqueFoods.forEach((fName) => {
        const val = foodNutrientMap[fName][nutName] || 0;
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      });
      return {
        name: nutName,
        diff: maxVal - minVal,
      };
    });
    // diffが大きい順にソートし、上位10を抜き出す
    list.sort((a, b) => b.diff - a.diff);
    return list.slice(0, 10).map((x) => x.name);
  }, [allNutrientNames, uniqueFoods, foodNutrientMap]);

  // 5. レーダーチャート用データを作成
  //    (上記 topNutrients の各項目について、比較対象食品群内での最大値を1とする正規化)
  const radarData = useMemo(() => {
    // topNutrients の各栄養素について { nutrientName, Apple: val, Banana: val, ... }
    return topNutrients.map((nutName) => {
      // 比較対象内で最大値を求める
      let localMax = 0;
      uniqueFoods.forEach((fName) => {
        const val = foodNutrientMap[fName][nutName] || 0;
        if (val > localMax) localMax = val;
      });
      // データ行を作る
      const row: Record<string, any> = { nutrientName: nutName };
      uniqueFoods.forEach((fName) => {
        const val = foodNutrientMap[fName][nutName] || 0;
        row[fName] = localMax === 0 ? 0 : val / localMax; // 正規化
      });
      return row;
    });
  }, [topNutrients, uniqueFoods, foodNutrientMap]);

  // --------------------------------------------
  // ここでようやく hook後に "if (uniqueFoods.length === 0)" 判定
  // --------------------------------------------
  if (uniqueFoods.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle>栄養素の比較</DialogTitle>
        <DialogContent>
          <Typography>比較対象の食品がありません。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // レーダーチャートを描画
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>栄養素の比較</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <RadarChart
              cx={300}
              cy={300}
              outerRadius={180}
              width={600}
              height={600}
              data={radarData}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="nutrientName" />
              <PolarRadiusAxis angle={30} domain={[0, 1]} />
              {uniqueFoods.map((fName, idx) => (
                <Radar
                  key={fName}
                  name={fName}
                  dataKey={fName}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.4}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              比較対象の食品:
            </Typography>
            {uniqueFoods.map((fName) => (
              <Typography key={fName}>・{fName}</Typography>
            ))}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1">
                表示している栄養素(上位10種類):
              </Typography>
              {topNutrients.map((nut) => (
                <Typography key={nut}>・{nut}</Typography>
              ))}
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="body2" color="text.secondary">
                ※このレーダーチャートでは、
                <br />
                ・「上位10種類の差が大きい栄養素」を選択
                <br />
                ・「比較対象の食品群」の中で最大値を1として正規化して表示しています。
                <br />
                そのため、比較対象の食品が増減するとスケールが変化します。
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NutrientModal;
