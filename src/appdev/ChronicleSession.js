// @flow
import { config, S3 } from 'aws-sdk';
import { ParquetSchema, ParquetTransformer } from 'parquetjs';
import stream from 'stream';

const BUCKET_NAME = 'appdev-register';

class ChronicleSession {
    appName: string;

    uploadQueueMaxSize: number;

    logQueuesMap: Map<string, Object[]>;

    s3: S3;

    constructor(
        accessKey: string = process.env.CHRONICLE_ACCESS_KEY,
        secretKey: string = process.env.CHRONICLE_SECRET_KEY,
        app: string,
        cacheSize: number = 10,
    ) {
        this.appName = app;
        this.logQueuesMap = new Map();
        this.uploadQueueMaxSize = cacheSize;

        if (!accessKey || !secretKey) {
            throw new Error(`Undefined Chronicle key(s)! accessKey: ${accessKey} secretKey: ${secretKey}`);
        }

        config.update({
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        });
        this.s3 = new S3();
    }

    readableStreamFromArray(array) {
        const readable = new stream.Readable({ objectMode: true });
        let index = 0;
        // eslint-disable-next-line no-underscore-dangle
        readable._read = () => {
            if (array && index < array.length) {
                readable.push(array[index]);
                index += 1;
            } else {
                readable.push(null);
            }
        };
        return readable;
    }

    async writeLogsRemote(eventName: string, parquetSchema: ParquetSchema) {
        let logsData = this.logQueuesMap.get(eventName);

        if (logsData === undefined) { // sanity check
            logsData = [];
        }

        const rs = this.readableStreamFromArray(logsData);

        // create new transform
        const parquetTransformStream = new ParquetTransformer(parquetSchema, { compression: 'BROTLI' });
        this.logQueuesMap.delete(eventName);

        const filename = `${Date.now()}.parquet`;
        const params = {
            Bucket: BUCKET_NAME,
            Body: rs.pipe(parquetTransformStream),
            Key: `${this.appName}/${eventName}/${filename}`,
        };

        await this.s3.upload(params)
            .promise();

        console.log('....DONE LOGGING');
    }

    async log(eventName: string, parquetSchema: ParquetSchema, event: Object, disableQueue: ?boolean = false) {
        let logs = this.logQueuesMap.get(eventName);
        if (logs === undefined) {
            logs = [event];
        } else {
            logs.push(event);
        }
        this.logQueuesMap.set(eventName, logs);

        if (disableQueue || logs.length >= this.uploadQueueMaxSize) {
            console.log('awaiting writelogs');
            await this.writeLogsRemote(eventName, parquetSchema);
        }
        return true;
    }
}

export default ChronicleSession;
