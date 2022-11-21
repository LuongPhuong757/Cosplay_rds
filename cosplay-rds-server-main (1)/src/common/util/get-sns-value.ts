export const getSnsValue = (
  snsInfo: { [key: string]: string },
  sns: { [key: string]: string | undefined },
): { [key: string]: string } => {
  Object.keys(sns).forEach((key) => (sns[key] === undefined ? delete sns[key] : {}));

  return {
    ...snsInfo,
    ...(sns as { [key: string]: string }),
  };
};
