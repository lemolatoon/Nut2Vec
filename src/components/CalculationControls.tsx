// src/components/CalculationControls.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { PCAFoodData } from "../pages/HomePage";
import { calculateCosineSimilarity, sumVectors } from "../utils/vectorUtils";
import DeleteIcon from "@mui/icons-material/Delete";

type SelectedFoodItem = {
  food: PCAFoodData;
  operation: "+" | "-";
};

type Props = {
  foodData: PCAFoodData[];
  onSelectedFoodsChange: (newList: SelectedFoodItem[]) => void;
  onResult: (result: PCAFoodData | null) => void;
};

const CalculationControls: React.FC<Props> = ({
  foodData,
  onSelectedFoodsChange,
  onResult,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<PCAFoodData | null>(null);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFoodItem[]>([]);

  // 部分一致
  const filteredFoods = foodData.filter((food) =>
    food.foodName.toLowerCase().includes(inputValue.toLowerCase()),
  );

  // 選択した食品をリストに追加
  const handleAddFood = () => {
    if (!selectedValue) return;
    const newList = [
      ...selectedFoods,
      { food: selectedValue, operation: "+" as const },
    ];
    setSelectedFoods(newList);
    onSelectedFoodsChange(newList);
    setSelectedValue(null);
    setInputValue("");
  };

  // リストから削除
  const handleRemoveFood = (index: number) => {
    const newList = [...selectedFoods];
    newList.splice(index, 1);
    setSelectedFoods(newList);
    onSelectedFoodsChange(newList);
  };

  // 「+ / -」切り替え
  const handleOperationChange = (index: number, value: "+" | "-") => {
    const newList = [...selectedFoods];
    newList[index].operation = value;
    setSelectedFoods(newList);
    onSelectedFoodsChange(newList);
  };

  // コサイン類似度計算
  const handleCompute = () => {
    if (selectedFoods.length === 0) {
      onResult(null);
      return;
    }

    // 合計ベクトルを作る
    const dimension = selectedFoods[0].food.PCs.length;
    let resultVector = new Array(dimension).fill(0);
    selectedFoods.forEach((item) => {
      const sign = item.operation === "+" ? 1 : -1;
      resultVector = sumVectors(
        resultVector,
        item.food.PCs.map((val) => val * sign),
      );
    });

    // foodData の中で最もコサイン類似度が高い食品を探す
    let bestMatch: PCAFoodData | null = null;
    let bestSimilarity = -Infinity;
    foodData.forEach((food) => {
      const sim = calculateCosineSimilarity(resultVector, food.PCs);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = food;
      }
    });

    onResult(bestMatch);
  };

  return (
    <Box>
      {/* 食品選択 */}
      <Autocomplete
        options={filteredFoods}
        getOptionLabel={(option) => option.foodName}
        value={selectedValue}
        onChange={(_, newValue) => setSelectedValue(newValue)}
        onInputChange={(_, value) => setInputValue(value)}
        renderInput={(params) => (
          <TextField {...params} label="食品を追加" variant="outlined" />
        )}
      />
      <Button variant="contained" onClick={handleAddFood} sx={{ mt: 1 }}>
        リストに追加
      </Button>

      {/* 選択した食品リスト + 演算子 */}
      <Box sx={{ mt: 2 }}>
        {selectedFoods.map((item, index) => (
          <Box
            key={`${item.food.foodName}-${index}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <ToggleButtonGroup
              size="small"
              value={item.operation}
              exclusive
              onChange={(_, value) => {
                if (value === "+" || value === "-") {
                  handleOperationChange(index, value);
                }
              }}
            >
              <ToggleButton value="+" sx={{ fontWeight: "bold" }}>
                +
              </ToggleButton>
              <ToggleButton value="-" sx={{ fontWeight: "bold" }}>
                -
              </ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ flexGrow: 1 }}>{item.food.foodName}</Box>
            <IconButton onClick={() => handleRemoveFood(index)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* 計算ボタン */}
      <Button variant="contained" color="secondary" onClick={handleCompute}>
        計算する
      </Button>
    </Box>
  );
};

export default CalculationControls;
