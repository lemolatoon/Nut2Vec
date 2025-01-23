// src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { Container, Typography, Box } from "@mui/material";

import FoodSelector from "../components/FoodSelector";
import CalculationControls from "../components/CalculationControls";
import FoodList from "../components/FoodList";
import AnimatedResult from "../components/AnimatedResult";

export type PCAFoodData = {
  foodName: string;
  PCs: number[];
};

const HomePage: React.FC = () => {
  const [foodData, setFoodData] = useState<PCAFoodData[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<
    { food: PCAFoodData; operation: "+" | "-" }[]
  >([]);
  const [closestFood, setClosestFood] = useState<PCAFoodData | null>(null);

  // JSONをfetchしてセットする
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/pc_values.json");
        const data: PCAFoodData[] = await response.json();
        setFoodData(data);
      } catch (error) {
        console.error("JSONファイルの読み込みに失敗しました", error);
      }
    };
    fetchData();
  }, []);

  // CalculationControlsから受け取る「+ / - と食品選択リスト」をセットする関数
  const handleSelectedFoodsChange = (
    newList: { food: PCAFoodData; operation: "+" | "-" }[],
  ) => {
    setSelectedFoods(newList);
  };

  // 計算結果をコサイン類似度で検索し、最も近い食品を確定する
  const handleResult = (result: PCAFoodData | null) => {
    setClosestFood(result);
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
          onSelectedFoodsChange={handleSelectedFoodsChange}
          onResult={handleResult}
        />
      </Box>

      {/* 選択済みのリスト表示 */}
      <Box sx={{ mb: 2 }}>
        <FoodList selectedFoods={selectedFoods} />
      </Box>

      {/* 結果表示（アニメーション含む） */}
      <Box sx={{ mb: 2 }}>
        <AnimatedResult closestFood={closestFood} />
      </Box>
    </Container>
  );
};

export default HomePage;
