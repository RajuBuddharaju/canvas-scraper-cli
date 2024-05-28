import fs from "fs";
import helpers from "../helpers.js";

const exported = {
  async getModules(page) {
    return await page.evaluate(() => {
      let moduleSections = Array.from(
        document.querySelectorAll("#context_modules > .item-group-condensed")
      );

      moduleSections = moduleSections.map((section) => {
        let name = section.querySelector(".ig-header .name").innerText;
        let modules = Array.from(section.querySelectorAll(".content .ig-row"));

        modules = modules.map((module) => {
          let url = module.querySelector("a").href;
          let name = module.querySelector("a").innerText;

          return { url, name };
        });

        return { name, modules };
      });

      return moduleSections;
    });
  },

  async printSummary(modulesections, problematic) {
    console.log("--- MODULES SCRAPING SUMMARY ---");
    console.log(`TOTAL MODULE SECTIONS: ${modulesections.length}`);
    let moduleCount = modulesections.map((section) => {
      return section.modules.length;
    });
    console.log(`TOTAL MODULES: ${moduleCount.reduce((a, b) => a + b, 0)}`);

    if (Object.keys(problematic).length > 0) {
      console.log("WARNING: Some files could not be downloaded");
      for (let section in problematic) {
        console.log(`${section}`);
        for (let module in problematic[section]) {
          console.log(`  ${module}`);
          for (let file of problematic[section][module]) {
            console.log(`    ${file}`);
          }
        }
      }
    }
  },
};
export default exported;
