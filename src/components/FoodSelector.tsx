// src/components/FoodSelector.tsx
import React, { useState } from "react";
import { TextField, Autocomplete } from "@mui/material";
import { PCAFoodData } from "../pages/HomePage";

type Props = {
  foodData: PCAFoodData[];
};

const FoodSelector: React.FC<Props> = ({ foodData }) => {
  const [inputValue, setInputValue] = useState("");

  // 部分一致で絞り込み
  const filteredFoods = foodData.filter((food) =>
    food.foodName.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <Autocomplete
      options={filteredFoods}
      getOptionLabel={(option) => option.foodName}
      onInputChange={(_, value) => setInputValue(value)}
      renderInput={(params) => (
        <TextField {...params} label="食品名を検索" variant="outlined" />
      )}
    />
  );
};

export default FoodSelector;
