import fs from "fs";
import { Command } from "commander";
import puppeteer from "puppeteer";

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
  .option("-a", "scrape assignments", true)
  .option("-m", "scrape modules", false)
  .action(async (url, options) => {
    console.log(`*** SCRAPING COURSE FROM ${url} ***`);
    console.log(`FLAGS: ${JSON.stringify(options)}`);

    const dir = options.output;
    if (fs.existsSync(dir))
      fs.rmSync(dir, { directory: true, recursive: true });
    fs.mkdirSync(dir);

    const browser = await puppeteer.launch({ headless: "new" });
    if (options.a) await scrapers.scrapeAssignments(browser, cookies, url, dir);

    browser.close();
    console.log("*** SCRAPING COMPLETE ***");
  });

program.parse();
