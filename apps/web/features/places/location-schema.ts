import { z } from "zod";

const coordinate = z
  .union([z.number(), z.string().trim().min(1).transform(Number)])
  .pipe(z.number().finite());
export const coordinatesSchema = z.object({
  latitude: coordinate.pipe(z.number().min(-90).max(90)),
  longitude: coordinate.pipe(z.number().min(-180).max(180)),
});
export type PlaceCoordinates = z.infer<typeof coordinatesSchema>;
