import { useState, useEffect } from "react";

export const useCounter = (
  initialState = 1,
  step = 1,
  max?: number,
  min: number = 0,
  onChange?: (value: number) => void,
) => {
  const [counter, setCounter] = useState(initialState);

  const increment = () => {
    setCounter((value) => {
      const newValue = counter !== max ? counter + step : counter;
      onChange && onChange(newValue);
      return newValue;
    });
  };

  const decrement = () => {
    setCounter((currentValue) => {
      const value = currentValue - step;
      if (value >= min) {
        const newValue =
          currentValue > 0 && currentValue !== min ? value : currentValue;
        onChange && onChange(newValue);
        return newValue;
      }
      return currentValue;
    });
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
