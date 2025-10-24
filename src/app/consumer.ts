import { RabbitMQConnection } from "$pkg/pubsub"
// import { PUBSUB_TOPICS } from "$entities/PubSub"
// import { KnowledgeQueueDTO } from "$entities/Knowledge"

export async function startConsumerApp() {
    const commonChannel = new RabbitMQConnection()
    await commonChannel.connect()
    await commonChannel.setPrefetchCount(1)

    // Consume Messages Here
    // await commonChannel.consume(PUBSUB_TOPICS.KNOWLEDGE_UPDATE, async (message) => {
    //     const knowledgeQueueDTO = JSON.parse(message) as KnowledgeQueueDTO
    //     console.log("KNOWLEDGE_UPDATE")
    //     console.log(knowledgeQueueDTO)
    // })

    // await commonChannel.consume(PUBSUB_TOPICS.KNOWLEDGE_CREATE, async (message) => {
    //     const knowledgeQueueDTO = JSON.parse(message) as KnowledgeQueueDTO
    //     console.log("KNOWLEDGE_CREATE")
    //     console.log(knowledgeQueueDTO)
    // })
    // await commonChannel.consume(PUBSUB_TOPICS.KNOWLEDGE_DELETE, async (message) => {
    //     const knowledgeQueueDTO = JSON.parse(message) as KnowledgeQueueDTO
    //     console.log("KNOWLEDGE_DELETE")
    //     console.log(knowledgeQueueDTO)
    // })
    // For each use case , will need different channel to consume event separately
}
