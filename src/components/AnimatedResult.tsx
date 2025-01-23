// src/components/AnimatedResult.tsx
import React from "react";
import { Typography } from "@mui/material";
import { motion } from "framer-motion";
import { PCAFoodData } from "../pages/HomePage";

type Props = {
  closestFood: PCAFoodData | null;
};

const AnimatedResult: React.FC<Props> = ({ closestFood }) => {
  if (!closestFood) {
    return <Typography variant="body1">結果がまだありません</Typography>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" color="primary">
        最も近い食品: {closestFood.foodName}
      </Typography>
    </motion.div>
  );
};

export default AnimatedResult;
