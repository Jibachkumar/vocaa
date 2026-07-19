import osUtils from "os-utils";
import fs from "fs";

// to pull all of the system reources so CPU usage RAM usage and storage usage from our mechine
// to inform the UI that there were changes to the resources so that it can updated
const POLLING_INTERVAL = 500;
export function pollResources() {
  setInterval(async () => {
    const cpuUsage = await getCpuUsage();
    const ramUsage = getRamUsage();
    const storageData = getStorageData();
    // console.log({ cpuUsage, ramUsage, storageUsage: storageData.usage });
  }, POLLING_INTERVAL);
}

function getCpuUsage() {
  return new Promise((resolve) => {
    osUtils.cpuUsage(resolve);
  });
}

function getRamUsage() {
  return 1 - osUtils.freememPercentage();
}

function getStorageData() {
  const stats = fs.statfsSync(process.platform === "win32" ? "c://" : "/");
  // total disk storage used
  const total = stats.bsize * stats.blocks;
  // how much storage is free
  const free = stats.bsize * stats.bfree;

  return {
    total: Math.floor(total / 1_000_000_000), //gigabyte
    usage: 1 - free / total,
  };
}
