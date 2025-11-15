import { useState, useEffect } from "react";

export const useCounter = (
  initialState = 1,
  step = 1,
  max?: number,
  min: number = 0,
) => {
  const [counter, setCounter] = useState(initialState);

  const increment = () => {
    setCounter(counter !== max ? counter + step : counter);
  };

  const decrement = () => {
    const value = counter - step;

    if (value >= min) {
      setCounter(counter > 0 && counter !== min ? value : counter);
    }
  };

  useEffect(() => {
    setCounter(initialState);
  }, [initialState]);

  return {
    counter,
    increment,
    decrement,
    setCounter,
  };
};
