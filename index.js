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
    console.log(url);
    console.log(options);
    const dir = options.output;

    if (fs.existsSync(dir))
      fs.rmSync(dir, { directory: true, recursive: true });
    fs.mkdirSync(dir);

    if (process.env.COOKIE_SESSION_VALUE === "VALUE")
      throw new Error("COOKIE_SESSION_VALUE not set");

    const browser = await puppeteer.launch({ headless: "new" });

    if (options.a) await scrapers.scrapeAssignments(browser, cookies, url, dir);

    browser.close();
    console.log("DONE!");
  });

program.parse();
