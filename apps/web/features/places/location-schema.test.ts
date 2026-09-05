import { expect, it } from "vitest";
import { coordinatesSchema } from "./location-schema";
it.each([
  {},
  { latitude: "", longitude: "" },
  { latitude: null, longitude: 15 },
  { latitude: -91, longitude: 15 },
  { latitude: -4, longitude: 181 },
  { latitude: "NaN", longitude: 15 },
])("rejects missing or invalid coordinates %j", (value) =>
  expect(coordinatesSchema.safeParse(value).success).toBe(false),
);
it("accepts a selected location and real zero coordinates without inventing a default", () => {
  expect(
    coordinatesSchema.parse({ latitude: "-4.31", longitude: "15.28" }),
  ).toEqual({ latitude: -4.31, longitude: 15.28 });
  expect(coordinatesSchema.parse({ latitude: 0, longitude: 0 })).toEqual({
    latitude: 0,
    longitude: 0,
  });
});
