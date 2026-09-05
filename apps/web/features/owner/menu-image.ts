export const MENU_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const MENU_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isMenuImageContent(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte,
    );
  if (type === "image/webp")
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}

export function isMenuImageForPlace(value: string, placeId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "res.cloudinary.com" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return false;
    const base = `/${cloudName}/image/upload/`;
    if (!url.pathname.startsWith(base)) return false;
    const path = url.pathname.slice(base.length).replace(/^v\d+\//, "");
    const prefix = `quivibe/menus/${placeId}/`;
    return (
      path.startsWith(prefix) &&
      /^[a-zA-Z0-9_-]+\.webp$/.test(path.slice(prefix.length))
    );
  } catch {
    return false;
  }
}
