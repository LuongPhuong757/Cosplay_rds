export type WhereInput = {
  [Key in string]?: { [Key in string]?: number[] | Date | WhereInput } | boolean | number;
};

export type IncludeInput = {
  [key: string]: boolean | { select: { [key: string]: boolean } };
};

export type PagingOptionsQuery = {
  skip?: number;
  take?: number;
};

export type DataInput = {
  [key: string]: { connect: { id: number } } | { disconnect: { id: number } };
};
