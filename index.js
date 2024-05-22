import fs from "fs";
import { Command } from "commander";
import puppeteer from "puppeteer";
import helpers from "./scrapers/helpers.js";

import scrapers from "./scrapers/index.js";
import * as cookies from "./cookies.json" assert { type: "json" };

const program = new Command();
program.name("canvas-scraper").description("Scrape data from a canvas course");

program
  .command("scrape")
  .description("Scrape data from a canvas course")
  .argument(
    "<url>",
    "Course Homepage URL (e.g. https://<school_domain>/courses/<course_id>)"
  )
  .option("-o, --output <dir_name>", "output directory name", "course")
  .option("-a", "scrape assignments", false)
  .option("-m", "scrape modules", false)
  .action(async (url, options) => {
    console.log(`*** SCRAPING COURSE FROM ${url} ***`);
    console.log(`FLAGS: ${JSON.stringify(options)}`);

    // create output directory
    const dir = options.output;
    if (fs.existsSync(dir))
      fs.rmSync(dir, { directory: true, recursive: true });
    fs.mkdirSync(dir);

    // scrape course
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await helpers.newPage(browser, cookies.default, url);
    await page.pdf({ path: `${dir}/.HOMEPAGE.pdf`, format: "Letter" });
    page.close();

    if (options.a)
      await scrapers.scrapeAssignments(browser, cookies.default, url, dir);
    if (options.m)
      await scrapers.scrapeModules(browser, cookies.default, url, dir);

    browser.close();
    console.log("*** SCRAPING COMPLETE ***");
  });

program.parse();
