import { ObjectStorageService } from "./objectStorage";

const objectStorageService = new ObjectStorageService();

async function downloadBuffer(objectPath: string): Promise<Buffer> {
  const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
  const response = await objectStorageService.downloadObject(objectFile);
  if (!response.body) throw new Error("Empty file response");
  const chunks: Uint8Array[] = [];
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function extractTextFromManual(objectPath: string, fileType: string): Promise<string> {
  const buffer = await downloadBuffer(objectPath);

  if (fileType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const data = await parser.getText();
      return data.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword" ||
    fileType.includes("word")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error(`지원하지 않는 파일 형식입니다: ${fileType}`);
}
