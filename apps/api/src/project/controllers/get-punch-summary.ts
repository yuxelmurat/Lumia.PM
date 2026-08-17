import countOpenPunchItems from "./count-open-punch-items";

async function getPunchSummary(projectId: string) {
  const openCount = await countOpenPunchItems(projectId);
  return { openCount };
}

export default getPunchSummary;
