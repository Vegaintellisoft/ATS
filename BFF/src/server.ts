import app from "./app.js";
import { env } from "./config/env.js";
import { minio } from "./config/minio.js";

const port = env.port;
const bucket = process.env.MINIO_BUCKET || "ats-resumes";

async function bootstrap() {
  try {
    const exists = await minio.bucketExists(bucket);
    if (!exists) {
      await minio.makeBucket(bucket, "us-east-1");
      console.log(`Created MinIO bucket: ${bucket}`);
    } else {
      console.log(`MinIO bucket already exists: ${bucket}`);
    }
  } catch (err) {
    console.error("Error initializing MinIO bucket:", err);
  }

  app.listen(port, () => {
    console.log(`BFF server listening on port ${port}`);
  });
}

bootstrap();
