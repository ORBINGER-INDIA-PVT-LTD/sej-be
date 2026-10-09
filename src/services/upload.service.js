import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3, S3_BUCKET, buildS3Url } from "../config/awsS3.js"
import { v4 as uuid } from "uuid"

export const uploadToS3 = async (file, folder = "general") => {
    try {
        const key = `${folder}/${uuid()}-${file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        })

        await s3.send(command);

        return {
            status: true,
            key,
            url: buildS3Url(key)
        };
    } catch (error) {
        console.log("upload error:", error);
        return {
            status: false
        }
    }
}