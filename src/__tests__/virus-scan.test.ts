import { scanFile } from "@/lib/virus-scan";

function makePdf(): ArrayBuffer {
  const header = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
  return header.buffer;
}

function makeJpeg(): ArrayBuffer {
  const header = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  return header.buffer;
}

function makePng(): ArrayBuffer {
  const header = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return header.buffer;
}

function makeExe(): ArrayBuffer {
  // DOS MZ header — not a valid image/document
  const header = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
  return header.buffer;
}

describe("scanFile — magic byte layer", () => {
  it("accepts a real PDF buffer for application/pdf", async () => {
    const result = await scanFile(makePdf(), "test.pdf", "application/pdf");
    expect(result.status).toBe("clean");
  });

  it("accepts a real JPEG buffer for image/jpeg", async () => {
    const result = await scanFile(makeJpeg(), "test.jpg", "image/jpeg");
    expect(result.status).toBe("clean");
  });

  it("accepts a real PNG buffer for image/png", async () => {
    const result = await scanFile(makePng(), "test.png", "image/png");
    expect(result.status).toBe("clean");
  });

  it("rejects an EXE header disguised as application/pdf", async () => {
    const result = await scanFile(makeExe(), "evil.pdf", "application/pdf");
    expect(result.status).toBe("threat");
    expect(result.threat).toBe("file_content_mismatch");
  });

  it("rejects a PDF header disguised as image/jpeg", async () => {
    const result = await scanFile(makePdf(), "sneaky.jpg", "image/jpeg");
    expect(result.status).toBe("threat");
  });
});
