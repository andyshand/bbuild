import S3 from "aws-sdk/clients/s3";
import { IEntityManager } from "modules/entities/IEntityManager";

type CompletedParts = any

export type BeginMultipartUploadParams = {
    reference: string,
    contentType: string,
    r2?: S3,
    s3Bucket: string,
}

export type MultipartUploadParams = {
    part: string,
    partId: number
    uploadId: string,
    reference: string,
    r2?: S3,
    s3Bucket: string,
}

export type CompleteMultipartUploadParams = {
    parts: CompletedParts,
    uploadId: string,
    key: string,
    reference: string,
    r2?: S3,
    s3Bucket: string,
    entityManager?: IEntityManager
}

export type CancelMultipartUploadParams = {
    uploadId: string,
    key: string,
    reference: string,
    r2?: S3,
    s3Bucket: string,
    entityManager?: IEntityManager
}