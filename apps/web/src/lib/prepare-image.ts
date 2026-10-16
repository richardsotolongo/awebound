/**
 * Gets an image file ready for a Storage bucket that takes PNG and JPEG only, in the browser:
 * those go as they are; anything else the browser can open (WebP, HEIC in Safari, AVIF, GIF) is
 * redrawn as a PNG, or as a JPEG when the PNG would be over `maxBytes`.
 */

export interface PreparedImage {
  blob: Blob;
  type: "image/png" | "image/jpeg";
  name: string;
  width: number;
  height: number;
  /** The file's own format when it was converted in the browser. */
  convertedFrom: string | null;
}

export const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** PNG or JPEG by the file's first bytes, whatever its name or reported type says. */
async function sniff(file: Blob): Promise<"image/png" | "image/jpeg" | null> {
  const b = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((v, i) => b[i] === v)) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

/** Decodes any image the browser can read (an <img> reads more formats than createImageBitmap in Safari). */
function decode(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

export async function prepareImage(
  file: File,
  { fallbackName, maxBytes }: { fallbackName: string; maxBytes: number },
): Promise<PreparedImage> {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-") || fallbackName;
  const type = await sniff(file);
  const img = await decode(file).catch(() => null);
  if (type) {
    return {
      blob: file,
      type,
      name: `${base}.${type === "image/png" ? "png" : "jpg"}`,
      width: img?.naturalWidth ?? 0,
      height: img?.naturalHeight ?? 0,
      convertedFrom: null,
    };
  }
  const from = (file.type.split("/")[1] || file.name.split(".").pop() || "image").toUpperCase();
  if (!img) {
    throw new Error(
      `This browser can’t open ${from} files. Save the image as a PNG or JPEG first.`,
    );
  }
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")?.drawImage(img, 0, 0);
  const encode = (t: "image/png" | "image/jpeg") =>
    new Promise<Blob | null>((r) => canvas.toBlob(r, t, 0.92));
  let out: "image/png" | "image/jpeg" = "image/png";
  let blob = await encode(out);
  if (blob && blob.size > maxBytes) {
    out = "image/jpeg";
    blob = await encode(out);
  }
  if (!blob) throw new Error("That image couldn’t be converted. Save it as a PNG and try again.");
  return {
    blob,
    type: out,
    name: `${base}.${out === "image/png" ? "png" : "jpg"}`,
    width: img.naturalWidth,
    height: img.naturalHeight,
    convertedFrom: from,
  };
}
