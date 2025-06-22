/** @format */

export const getPercentageComplete = (part, whole) => {
  const percentage = (part / whole) * 100;

  if (isNaN(percentage)) {
    return 0;
  }

  return Math.round(percentage);
};
