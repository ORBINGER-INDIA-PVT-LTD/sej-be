import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3 } from "../config/awsS3.js"
import { v4 as uuid } from "uuid"

export const uploadToS3 = async (file, folder = "general") => {
    try {
        const key = `${folder}/${uuid()}-${file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        })

        await s3.send(command);

        return {
            status: true,
            key,
            url: `https://${process.env.S3}.s3.amazonaws.com/${key}`
        };
    } catch (error) {
        console.log("upload error:", error);
        return {
            status: false
        }
    }
}