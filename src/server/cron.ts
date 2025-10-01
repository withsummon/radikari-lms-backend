import * as Graceful from "$pkg/graceful";
import Logger from "$pkg/logger";

import cron from "node-cron";

export const cronServer = {
    addController: addController,
}


function taskNameToProcessName(taskName: string) {
    return taskName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

export async function addController(
    taskName: string,
    spec: string,
    controller: () => void,
    scheduleOptions?: cron.ScheduleOptions
) {


    const cronSchedule = cron.schedule(
        spec,
        async function () {
            try {
                await controller()
                Logger.info(`Successfully Run : ${taskName}`, {})
            } catch (err) {
                Logger.error(`${taskName} Error :`, { error: err })
            }
        },
        scheduleOptions
    )

    Graceful.registerProcessForShutdown(`cron_${taskNameToProcessName(taskName)}`, () => {
        cronSchedule.stop()
    })

    return cronSchedule
}

