import urls from "../urls";
import { callPostApi } from "../callApi";

export type OCRFileType = "image" | "pdf";

export interface OCROptions {
  file_type: OCRFileType;            // required: "image" | "pdf"
  model?: string;                    // e.g. "gpt-4o-mini", "tesseract"
  provider?: string;                 // e.g. "openai", "gemini", "pytesseract"
  // if you support additional flags, add here
  // e.g. pages?: number[]; language?: string;
}

/**
 * NOTE: OCR endpoint uses multipart/form-data. Build FormData:
 * const fd = new FormData();
 * fd.append("file", fileInput.files[0]);
 * fd.append("file_type", "pdf");
 * fd.append("model", "gpt-4o-mini");
 * fd.append("provider", "openai");
 */
const ocrService = {
  extractText: (formData: FormData) => callPostApi(urls.OCR, formData), // pass `true` to tell callPostApi to send multipart/form-data
};

export default ocrService;
