import { S3Client } from "@aws-sdk/client-s3"

export const s3 = new S3Client({
    region: process.env.AWS_RE,
    credentials: {
        accessKeyId: process.env.AWS_ACC,
        secretAccessKey: process.env.AWS_S_KEY
    }
})