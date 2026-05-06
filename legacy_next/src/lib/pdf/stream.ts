import { Writable } from "stream";

export async function streamToBuffer(
  write: (dest: Writable) => void,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const dest = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
  });

  return await new Promise<Buffer>((resolve, reject) => {
    dest.on("finish", () => resolve(Buffer.concat(chunks)));
    dest.on("error", reject);
    try {
      write(dest);
    } catch (e) {
      reject(e);
    }
  });
}

