import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const s3 = new S3Client({
  region: process.env.AWS_RE,
  credentials: {
    accessKeyId: process.env.AWS_ACC_KEY,
    secretAccessKey: process.env.AWS_S_KEY,
  },
});

async function testUpload() {
  console.log("Testing S3 upload with configuration:");
  console.log("Bucket:", process.env.S3);
  console.log("Region:", process.env.AWS_RE);
  console.log("Access Key ID:", process.env.AWS_ACC_KEY);

  const command = new PutObjectCommand({
    Bucket: process.env.S3,
    Key: "test-file.txt",
    Body: "Hello from local test script!",
    ContentType: "text/plain",
  });

  try {
    const res = await s3.send(command);
    console.log("✅ S3 Upload Succeeded!", res);
  } catch (err) {
    console.error("❌ S3 Upload Failed!");
    console.error(err);
  }
}

testUpload();
