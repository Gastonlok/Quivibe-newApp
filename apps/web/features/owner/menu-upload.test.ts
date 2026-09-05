import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  access: vi.fn(),
  place: vi.fn(),
  upload: vi.fn(),
  config: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("./access", () => ({ getPlaceAccess: mocks.access }));
vi.mock("@/lib/prisma", () => ({
  prisma: { place: { findUnique: mocks.place } },
}));
vi.mock("cloudinary", () => ({
  v2: { config: mocks.config, uploader: { upload_stream: mocks.upload } },
}));
import { POST } from "@/app/api/uploads/menu/route";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner" } });
  mocks.access.mockResolvedValue("OWNER");
  mocks.place.mockResolvedValue({ id: "place1" });
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
  vi.stubEnv("CLOUDINARY_API_KEY", "mock");
  vi.stubEnv("CLOUDINARY_API_SECRET", "mock");
});
afterEach(() => vi.unstubAllEnvs());
function request(bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])) {
  const form = new FormData();
  form.set("image", new File([bytes], "photo.png", { type: "image/png" }));
  return new Request("https://example.test/api/uploads/menu?placeId=place1", {
    method: "POST",
    body: form,
  });
}
it("rejects anonymous requests and access to another owner's establishment before upload", async () => {
  mocks.auth.mockResolvedValueOnce(null);
  expect((await POST(request())).status).toBe(401);
  mocks.access.mockResolvedValueOnce(null);
  expect((await POST(request())).status).toBe(403);
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("rejects oversized requests, cross-origin calls and disguised non-image content", async () => {
  const large = request();
  large.headers.set("Content-Length", "5000000");
  expect((await POST(large)).status).toBe(413);
  const foreign = request();
  foreign.headers.set("Origin", "https://evil.test");
  expect((await POST(foreign)).status).toBe(403);
  expect(
    (await POST(request(new TextEncoder().encode("<svg>not a png</svg>"))))
      .status,
  ).toBe(400);
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("returns a scoped image URL after transcoding and never exposes credentials", async () => {
  mocks.upload.mockImplementation((options, callback) => ({
    end: () =>
      callback(null, {
        secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v123/${options.folder}/${options.public_id}.webp`,
      }),
  }));
  const response = await POST(request());
  expect(response.status).toBe(201);
  const data = await response.json();
  expect(Object.keys(data)).toEqual(["url"]);
  expect(data.url).toContain("/quivibe/menus/place1/");
  expect(mocks.upload.mock.calls[0][0]).toMatchObject({
    resource_type: "image",
    format: "webp",
    overwrite: false,
  });
});
