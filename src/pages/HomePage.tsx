// src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Button } from "@mui/material";

import FoodSelector from "../components/FoodSelector";
import CalculationControls from "../components/CalculationControls";
import FoodList from "../components/FoodList";
import AnimatedResult from "../components/AnimatedResult";
import NutrientModal from "../components/NutrientModal";

export type PCAFoodData = {
  foodName: string;
  PCs: number[];
};

export type NutrientData = {
  foodName: string;
  nutrients: {
    [key: string]: number;
  };
};

const HomePage: React.FC = () => {
  const [foodData, setFoodData] = useState<PCAFoodData[]>([]);
  const [nutrientData, setNutrientData] = useState<NutrientData[]>([]);

  const [selectedFoods, setSelectedFoods] = useState<
    { food: PCAFoodData; operation: "+" | "-" }[] | null
  >(null);
  const [closestFood, setClosestFood] = useState<PCAFoodData | null>(null);

  // アニメーション再生用キー
  const [animationKey, setAnimationKey] = useState(0);

  // モーダルの開閉
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---------------------------
  // 1. JSONファイルを読み込み
  // ---------------------------
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 食品(PCA)データ
        const pcaResp = await fetch("/pc_values.json");
        const pcaData: PCAFoodData[] = await pcaResp.json();
        setFoodData(pcaData);

        // 栄養素データ
        const nutResp = await fetch("/nutrient_values.json");
        const nutData: NutrientData[] = await nutResp.json();
        setNutrientData(nutData);
      } catch (error) {
        console.error("JSONファイルの読み込みに失敗しました", error);
      }
    };
    fetchAllData();
  }, []);

  // ---------------------------
  // 2. 初回マウント時にクエリパラメータを解析し、selectedFoods をセット
  // ---------------------------
  useEffect(() => {
    if (foodData.length === 0) return; // foodDataがまだ空ならパースできない

    const params = new URLSearchParams(window.location.search);
    const expr = params.get("expr");
    if (!expr) {
      setSelectedFoods([]);
      return;
    }

    const parsed = parseExpression(expr, foodData);
    if (parsed.length > 0) {
      setSelectedFoods(parsed);
    }
  }, [foodData]);

  // ---------------------------
  // 3. selectedFoods の変更時にクエリパラメータを更新
  //    (リストが空でもparamを削除せず、expr= として置く)
  // ---------------------------
  useEffect(() => {
    if (selectedFoods === null) return;
    const exprStr = buildExpression(selectedFoods);
    const newUrl = `${window.location.pathname}?expr=${encodeURIComponent(exprStr)}`;
    window.history.replaceState(null, "", newUrl);
  }, [selectedFoods]);

  // CalculationControls から新しいリストを受け取る
  const handleSelectedFoodsChange = (
    newList: { food: PCAFoodData; operation: "+" | "-" }[],
  ) => {
    // merge with existing list
    setSelectedFoods([...(selectedFoods ?? []), ...newList]);
  };

  // 計算結果を受け取り、アニメーションキーを更新
  const handleResult = (result: PCAFoodData | null) => {
    setClosestFood(result);
    // 結果が同じでもアニメーションが再生されるようにキーをインクリメント
    setAnimationKey((prev) => prev + 1);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Nutrition2Vec
      </Typography>

      {/* 食品の検索・選択欄 */}
      <Box sx={{ mb: 2 }}>
        <FoodSelector foodData={foodData} />
      </Box>

      {/* 足し算・引き算リスト */}
      <Box sx={{ mb: 2 }}>
        <CalculationControls
          foodData={foodData}
          selectedFoods={selectedFoods ?? []}
          setSelectedFoods={setSelectedFoods}
          onResult={handleResult}
        />
      </Box>

      {/* 選択済みのリスト表示 */}
      <Box sx={{ mb: 2 }}>
        <FoodList selectedFoods={selectedFoods ?? []} />
      </Box>

      {/* 結果表示（アニメーション含む） */}
      <Box sx={{ mb: 2 }}>
        <AnimatedResult closestFood={closestFood} animationKey={animationKey} />
      </Box>

      {/* 栄養素比較用モーダルを開くボタン */}
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={handleOpenModal}>
          栄養素の比較を見る
        </Button>
      </Box>

      {/* 栄養素比較モーダル */}
      <NutrientModal
        open={isModalOpen}
        onClose={handleCloseModal}
        selectedFoods={selectedFoods ?? []}
        closestFood={closestFood}
        nutrientData={nutrientData}
      />
    </Container>
  );
};

export default HomePage;

// ---------------------------
// 計算式をURLクエリ用に構築
// ---------------------------
function buildExpression(
  list: { food: PCAFoodData; operation: "+" | "-" }[],
): string {
  // 例: [ {food: Apple, operation:'+'}, {food:Banana, operation:'+'}, {food:Milk, operation:'-'} ]
  // -> "Apple+Banana-Milk"
  // 先頭アイテムが '+' でも明示せずに "Apple" と書くが、内部処理的には同義とする
  if (list.length === 0) return ""; // 空リストなら空文字

  let expr = (list[0].operation === "+" ? "" : "-") + list[0].food.foodName;
  for (let i = 1; i < list.length; i++) {
    const item = list[i];
    if (item.operation === "+") {
      expr += "+" + item.food.foodName;
    } else {
      expr += "-" + item.food.foodName;
    }
  }
  return expr;
}

// ---------------------------
// expr文字列を解析し、foodDataを参照して {food, operation}[] を返す
// ---------------------------
function parseExpression(
  expr: string,
  foodData: PCAFoodData[],
): { food: PCAFoodData; operation: "+" | "-" }[] {
  // 想定フォーマット: "Apple+Banana-Milk" など
  // approach: 正規表現で + と - をトークンとして取り出す
  // "Apple+Banana-Milk" -> ["Apple", "+", "Banana", "-", "Milk"]
  const tokens = expr.match(/[+-]|[^+-]+/g);
  if (!tokens) return [];

  const result: { food: PCAFoodData; operation: "+" | "-" }[] = [];
  let currentOp: "+" | "-" = "+";

  tokens.forEach((token) => {
    if (token === "+" || token === "-") {
      currentOp = token as "+" | "-";
    } else {
      // foodName
      const fd = foodData.find((f) => f.foodName === token);
      if (fd) {
        result.push({
          food: fd,
          operation: currentOp,
        });
      }
      // 次のトークンのために '+' に戻しておく
      currentOp = "+";
    }
  });

  return result;
}
