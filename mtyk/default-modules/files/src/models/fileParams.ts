import S3 from 'aws-sdk/clients/s3';
import { IEntityManager } from "modules/entities/IEntityManager"

export type StorageParams = {
    r2: S3,
    entityManager: IEntityManager
}

export type CreateFileClientParams = {
    filename: string,
    size: number,
    contentType: string,
    author: string,
    s3Bucket: string,
}

export type ReadFileClientParams = {
    key: string,
    s3Bucket: string,
}

export type DeleteFileClientParams = {
    key: string,
    s3Bucket: string,
}

export type CreateFileParams = CreateFileClientParams & StorageParams
export type ReadFileParams = ReadFileClientParams & StorageParams
export type DeleteFileParams = DeleteFileClientParams & StorageParams