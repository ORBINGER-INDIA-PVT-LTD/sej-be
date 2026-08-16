import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, "../../.env") });

const bucket = process.env.S3;
const region = process.env.AWS_RE;
const accessKey = process.env.AWS_ACC_KEY;
const secretKey = process.env.AWS_S_KEY;

async function runDiagnostics() {
  console.log("==================================================");
  console.log("🔍 STARTING S3 BUCKET CONNECTION DIAGNOSTICS");
  console.log("==================================================");
  console.log(`📂 Target Bucket:   ${bucket}`);
  console.log(`🌐 AWS Region:     ${region}`);
  console.log(`🔑 Access Key ID:   ${accessKey ? accessKey.substring(0, 6) + "..." : "MISSING"}`);
  console.log("==================================================");

  if (!bucket || !region || !accessKey || !secretKey) {
    console.error("❌ Diagnostic aborted: One or more S3 parameters are missing from your .env file!");
    return;
  }

  const s3 = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  const testKey = `logos/test-diagnostics-${Date.now()}.txt`;
  
  // 1. TEST WRITE ACCESS (PutObject)
  console.log("\n1. Testing WRITE access (Uploading test file)...");
  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: "S3 Connection Diagnostics Test File",
      ContentType: "text/plain",
    });
    await s3.send(putCommand);
    console.log("   ✅ Upload succeeded!");
  } catch (err) {
    console.error("   ❌ Upload failed!");
    handleS3Error(err);
    return;
  }

  // 2. TEST READ ACCESS (GetObject)
  console.log("\n2. Testing READ access (Downloading test file)...");
  try {
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: testKey,
    });
    const response = await s3.send(getCommand);
    const data = await response.Body.transformToString();
    if (data === "S3 Connection Diagnostics Test File") {
      console.log("   ✅ Read verification succeeded!");
    } else {
      console.warn("   ⚠️ Read completed, but the file content was altered!");
    }
  } catch (err) {
    console.error("   ❌ Read failed!");
    handleS3Error(err);
  }

  // 3. TEST DELETE ACCESS (DeleteObject)
  console.log("\n3. Testing DELETE access (Cleaning up test file)...");
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: testKey,
    });
    await s3.send(deleteCommand);
    console.log("   ✅ File cleanup succeeded!");
  } catch (err) {
    console.error("   ❌ Cleanup failed!");
    handleS3Error(err);
  }

  console.log("\n==================================================");
  console.log("🎉 DIAGNOSTICS COMPLETED: Your S3 bucket is fully connected!");
  console.log("==================================================");
}

function handleS3Error(err) {
  console.error(`\n   Detailed Error: [${err.name || "Error"}] ${err.message}`);
  
  if (err.name === "AccessDenied") {
    console.log("\n💡 RECOMMENDATION:");
    console.log("This is an IAM Permissions issue.");
    console.log(`Please go to AWS IAM, locate user keys matching your Access Key ID, and attach a policy allowing 's3:PutObject', 's3:GetObject', and 's3:DeleteObject' actions for S3 Bucket Resource: "arn:aws:s3:::${bucket}/*".`);
  } else if (err.name === "PermanentRedirect" || err.$metadata?.httpStatusCode === 301) {
    console.log("\n💡 RECOMMENDATION:");
    console.log("This is an AWS Region mismatch.");
    console.log(`Check your .env and set 'AWS_RE' to the correct bucket region (e.g. Stockholm is 'eu-north-1', Mumbai is 'ap-south-1').`);
    if (err.Endpoint) {
      console.log(`Suggested Endpoint from AWS: ${err.Endpoint}`);
    }
  } else if (err.name === "InvalidAccessKeyId") {
    console.log("\n💡 RECOMMENDATION:");
    console.log("The Access Key ID in your .env is invalid. Please double check AWS IAM Console to ensure it is active.");
  } else if (err.name === "SignatureDoesNotMatch") {
    console.log("\n💡 RECOMMENDATION:");
    console.log("The Secret Access Key does not match the Access Key ID. Please copy-paste it carefully again from AWS IAM Console.");
  } else if (err.name === "NoSuchBucket") {
    console.log("\n💡 RECOMMENDATION:");
    console.log(`The bucket name "${bucket}" does not exist. Double check your S3 Console for the exact bucket name (case-sensitive).`);
  } else {
    console.log("\n💡 RECOMMENDATION:");
    console.log("Please check your internet connection or AWS console status page.");
  }
}

runDiagnostics();
