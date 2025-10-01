import server from "$server/instance"


export async function startCronApp() {
    const cronServer = server.cronServer

    cronServer.addController("Some Scheduled Task", "*/30 * * * * *", () => {
        console.log("Some Scheduled Task")
    })

    // Example Usages : 
    // cronServer.addController("Some Scheduled Task", "*/30 * * * * *", TaskController.someTask)

}