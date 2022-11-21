export const jsonParseSqsBody = <T extends Record<string, string | number | null>>(
  jsonString: string,
  requireKeys: string[],
): T => {
  const parsed = JSON.parse(jsonString) as T;

  requireKeys.map((key: string) => {
    if (!(key in parsed)) throw Error('object must have required key');
  });

  return objectToNumber(parsed) as T;
};

export const jsonParseSqsBodyQu = <T extends Record<string, string | number | null>>(
  jsonString: string,
  requireKeys: string[],
): T => {
  const parsed = JSON.parse(jsonString) as T;

  requireKeys.map((key: string) => {
    if (!(key in parsed)) throw Error('object must have required key');
  });

  return objectToObject(parsed) as T;
};

export const objectToObject = <T>(data: T): Record<string, string | number | null> => {
  const entries = Object.entries(data);

  const obj = {} as Record<string, string | number | null>;
  for (const entry of entries) {
    const key = entry[0];
    const value = entry[1] as string;

    obj[key] = value;
  }

  return obj;
};

export const objectToNumber = <T>(data: T): Record<string, string | number | null> => {
  const entries = Object.entries(data);

  const obj = {} as Record<string, string | number | null>;
  for (const entry of entries) {
    const key = entry[0];
    const value = entry[1] as string;
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      obj[key] = Number(value);
      continue;
    }

    obj[key] = value;
  }

  return obj;
};
