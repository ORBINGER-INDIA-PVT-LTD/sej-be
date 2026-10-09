import { S3Client } from "@aws-sdk/client-s3"

const region = process.env.AWS_REGION || process.env.AWS_RE;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACC_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_S_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
        "Missing AWS config: set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env"
    );
}

export const S3_BUCKET = process.env.S3_BUCKET || process.env.S3;
export const S3_REGION = region;

if (!S3_BUCKET) {
    throw new Error("Missing AWS config: set S3_BUCKET in .env");
}

export const buildS3Url = (key) =>
    `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

export const s3 = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
})
