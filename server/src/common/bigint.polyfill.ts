// BigInt → string for JSON.stringify (Express + Nest use JSON.stringify under the hood).
// This is imported once from main.ts before the app boots.

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

export {};
