// @flow
import { config, S3 } from 'aws-sdk';
import { ParquetSchema, ParquetWriter } from 'parquetjs';
import { createReadStream } from 'fs';

const PATH = '/tmp';
const BUCKET = 'appdev-register';

class ChronicleSession {
    app: string;

    cacheSize: number;

    logMap: Map<string, Object[]>;

    s3: S3;

    constructor(
        accessKey: string = process.env.CHRONICLE_ACCESS_KEY,
        secretKey: string = process.env.CHRONICLE_SECRET_KEY,
        app: string,
        cacheSize: number = 10,
    ) {
        this.app = app;
        this.logMap = new Map();
        this.cacheSize = cacheSize;

        if (!accessKey || !secretKey) {
            throw new Error(`Undefined Chronicle key(s)! accessKey: ${accessKey} secretKey: ${secretKey}`);
        }

        config.update({
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        });
        this.s3 = new S3();
    }

    async writeLogs(eventName: string, eventType: ParquetSchema) {
        const filename = `${Date.now()}.parquet`;
        const schema = new ParquetSchema(eventType);
        const writer = await ParquetWriter.openFile(schema, `${PATH}/${filename}`);

        let logs = this.logMap.get(eventName);
        if (logs === undefined) { // sanity check
            logs = [];
        }

        logs.forEach(log => writer.appendRow(log));
        writer.close();
        this.logMap.delete(eventName);

        const params = {
            Bucket: BUCKET,
            Body: createReadStream(`${PATH}/${filename}`),
            Key: `${this.app}/${eventName}/${filename}`,
        };
        await this.s3.upload(params)
            .promise();
    }

    async log(eventName: string, eventType: ParquetSchema, event: Object) {
        let logs = this.logMap.get(eventName);
        if (logs === undefined) {
            this.logMap.set(eventName, [event]);
            logs = [];
        }

        logs.push(event);
        this.logMap.set(eventName, logs);
        if (logs.length >= this.cacheSize) {
            await this.writeLogs(eventName, eventType);
        }
    }
}

export default ChronicleSession;
