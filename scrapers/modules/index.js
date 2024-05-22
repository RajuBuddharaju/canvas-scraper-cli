import fs from "fs";
import helpers from "../helpers.js";
import mHelpers from "./helpers.js";

async function scrapeModule(browser, cookies, dir, sectionName, module) {
  console.log(`  MODULE: ${module.name}`);
  let moduleName = helpers.stripInvalid(module.name);
  fs.mkdirSync(`${dir}/MODULES/${sectionName}/${moduleName}`);

  const modulePage = await helpers.newPage(browser, cookies, module.url);
  await modulePage.pdf({
    path: `${dir}/MODULES/${sectionName}/${moduleName}/.MODULE.pdf`,
    format: "Letter",
  });
  let dLinks = await modulePage.evaluate(() => {
    return Array.from(document.querySelectorAll("span > a"))
      .map((a) => a.href)
      .filter((url) => url.includes("download?download"));
  });

  for (let link of dLinks) {
    await helpers.downloadFile(
      link,
      cookies,
      `${dir}/MODULES/${sectionName}/${moduleName}`,
      "fileDownload"
    );
  }
  modulePage.close();
}

async function scrapeModuleSection(browser, cookies, dir, section) {
  console.log(`MODULE SECTION: ${section.name}`);
  let sectionName = helpers.stripInvalid(section.name);
  fs.mkdirSync(`${dir}/MODULES/${sectionName}`);
  for (let module of section.modules) {
    await scrapeModule(browser, cookies, dir, sectionName, module);
  }
}

async function scrapeModules(browser, cookies, url, dir) {
  console.log("=== SCRAPING MODULES ===");
  fs.mkdirSync(`${dir}/MODULES`);
  const page = await helpers.newPage(browser, cookies, `${url}/modules`);
  await page.pdf({ path: `${dir}/MODULES/.MODULES.pdf`, format: "Letter" });

  const moduleSections = await mHelpers.getModules(page);
  for (let section of moduleSections) {
    try {
      await scrapeModuleSection(browser, cookies, dir, section);
    } catch (e) {
      console.log(`ERROR: MODULE SECTION ${section.name} | COULD NOT SCRAPE`);
      console.log(e);
    }
  }

  page.close();
}

export default scrapeModules;
