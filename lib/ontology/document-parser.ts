/**
 * Parse document metadata and extract basic information
 */

import * as fs from "fs";
import * as path from "path";

export interface DocumentInfo {
  filename: string;
  filepath: string;
  relativePath: string;
  extension: string;
  size: number;
  type: string;
  content?: string; // For text-based files
  metadata?: {
    wordCount?: number;
    lineCount?: number;
    hasDates?: boolean;
    hasNumbers?: boolean;
  };
}

/**
 * Parse a document file and extract metadata
 */
export async function parseDocument(filepath: string, baseDir?: string): Promise<DocumentInfo> {
  const stats = await fs.promises.stat(filepath);
  const filename = path.basename(filepath);
  const extension = path.extname(filename).toLowerCase().slice(1);
  const relativePath = baseDir ? path.relative(baseDir, filepath) : filepath;

  const info: DocumentInfo = {
    filename,
    filepath,
    relativePath,
    extension,
    size: stats.size,
    type: getFileType(extension),
  };

  // Extract text content for text-based files
  if (isTextFile(extension)) {
    try {
      const content = await fs.promises.readFile(filepath, "utf-8");
      info.content = content;
      info.metadata = {
        wordCount: content.split(/\s+/).length,
        lineCount: content.split("\n").length,
        hasDates: /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(content),
        hasNumbers: /\d+/.test(content),
      };
    } catch (error) {
      console.warn(`Could not read text content from ${filepath}:`, error);
    }
  }

  return info;
}

/**
 * Check if file extension is a text-based file
 */
function isTextFile(extension: string): boolean {
  const textExtensions = ["txt", "md", "csv", "json", "xml", "yaml", "yml"];
  return textExtensions.includes(extension);
}

/**
 * Get file type category
 */
function getFileType(extension: string): string {
  const types: Record<string, string> = {
    docx: "document",
    pdf: "document",
    xlsx: "spreadsheet",
    txt: "text",
    md: "text",
    csv: "data",
    json: "data",
    xml: "data",
    kmz: "geospatial",
    mpkx: "geospatial",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
  };
  return types[extension] || "unknown";
}

/**
 * Find all documents in a directory (excluding images, audio, video)
 */
export async function findDocuments(
  dir: string,
  options: { recursive?: boolean; excludePatterns?: string[] } = {}
): Promise<DocumentInfo[]> {
  const { recursive = true, excludePatterns = [] } = options;
  const documents: DocumentInfo[] = [];

  const shouldExclude = (filepath: string): boolean => {
    return excludePatterns.some((pattern) => filepath.includes(pattern));
  };

  async function scanDirectory(currentDir: string): Promise<void> {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (shouldExclude(fullPath)) {
        continue;
      }

      if (entry.isDirectory() && recursive) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase().slice(1);
        
        // Skip images, audio, video
        const skipExtensions = [
          "jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp", // images
          "mp4", "avi", "mov", "wmv", // video
          "mp3", "m4a", "wav", "aac", // audio
        ];

        if (!skipExtensions.includes(ext)) {
          try {
            const docInfo = await parseDocument(fullPath, dir);
            documents.push(docInfo);
          } catch (error) {
            console.warn(`Could not parse ${fullPath}:`, error);
          }
        }
      }
    }
  }

  await scanDirectory(dir);
  return documents;
}

