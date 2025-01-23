// src/components/FoodList.tsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { PCAFoodData } from "../pages/HomePage";

type Props = {
  selectedFoods: { food: PCAFoodData; operation: "+" | "-" }[];
};

const FoodList: React.FC<Props> = ({ selectedFoods }) => {
  if (selectedFoods.length === 0) {
    return (
      <Typography variant="body1">まだ食品が選択されていません。</Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6">現在の食品リスト</Typography>
      {selectedFoods.map((item, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography variant="body1">
            {item.operation} {item.food.foodName}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default FoodList;
