import * as Graceful from "$pkg/graceful";
import Logger from "$pkg/logger";
import client, { Channel, ChannelModel } from "amqplib";
import { ulid } from "ulid";

type HandlerCB = (msg: string) => any;

export class RabbitMQConnection {
    connection!: ChannelModel;
    channel!: Channel;
    private connected!: Boolean;

    async connect() {
        if (this.connected && this.channel) return;
        else this.connected = true;

        const maxRetries = 5;
        const baseDelay = 1000;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                Logger.info(`⌛️ Connecting to Rabbit-MQ Server (attempt ${retryCount + 1}/${maxRetries})`, {});
                this.connection = await client.connect(
                    process.env.AMQP_CONN_URL || "",
                );

                Logger.info(`✅ Rabbit MQ Connection is ready`, {});

                this.channel = await this.connection.createChannel();
                Logger.info(`🛸 Created RabbitMQ Channel successfully`, {});
                Graceful.registerProcessForShutdown(`pubsub-connection-${ulid()}`, () => {
                    this.channel.close()
                })

                return;

            } catch (error) {
                retryCount++;
                console.error(`Connection attempt ${retryCount} failed:`, error);

                if (retryCount >= maxRetries) {
                    console.error(`Failed to connect after ${maxRetries} attempts. Giving up.`);
                    this.connected = false;
                    throw error;
                }

                // Exponential backoff delay
                const delay = baseDelay * Math.pow(2, retryCount - 1);
                Logger.info(`⏳ Retrying in ${delay}ms...`, {});

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async disconnect() {
        await this.channel.close()
        await this.connection.close()
    }

    async sendToQueue(queue: string, message: any) {
        try {
            if (!this.channel) {
                await this.connect();
            }

            this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        } catch (error) {
            Logger.error(`[PUBLISHER] Error while sending message to queue`, error)
            throw error;
        }
    }

    async consume(queue: string, consumerHandler: HandlerCB) {
        await this.channel.assertQueue(queue, {
            durable: true
        });

        this.channel.consume(
            queue,
            async (msg: any) => {
                {
                    if (!msg) {
                        return Logger.error(`[CONSUMER] Invalid incoming message`, {});
                    }
                    Logger.info(`[CONSUMER] Received message from queue: ${queue}`, {});

                    let retries = 0;
                    const maxRetries = 5;

                    while (retries < maxRetries) {
                        try {
                            await consumerHandler(msg?.content?.toString());
                            this.channel.ack(msg);
                            return;
                        } catch (error) {
                            retries++;
                            Logger.error(`[CONSUMER] Error processing message (attempt ${retries}/${maxRetries}):`, error);

                            if (retries === maxRetries) {
                                // After max retries, either:
                                // 1. Acknowledge the message (remove from queue)
                                this.channel.ack(msg);
                                // 2. Or reject and requeue the message
                                // this.channel.reject(msg, true);

                                Logger.error(`[CONSUMER] Max retries reached, message acknowledged and removed from queue`, {
                                    error: error
                                });
                            } else {
                                // Wait before retrying (exponential backoff)
                                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
                            }
                        }
                    }
                }
            },
            {
                noAck: false,
            }
        );
    }

    async setPrefetchCount(prefetchCount: number) {
        await this.channel.prefetch(prefetchCount)
    }


    async getChannel() {
        return this.channel
    }
}


export class GlobalPubSub {
    private static instance: GlobalPubSub;
    private pubsub: RabbitMQConnection;
    private constructor() {
        this.pubsub = new RabbitMQConnection();
    }

    public static getInstance(): GlobalPubSub {
        if (!GlobalPubSub.instance) {
            GlobalPubSub.instance = new GlobalPubSub();
        }
        return GlobalPubSub.instance;
    }

    public getPubSub(): RabbitMQConnection {
        return this.pubsub;
    }
}

export default GlobalPubSub.getInstance().getPubSub();