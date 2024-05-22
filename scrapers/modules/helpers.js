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
};
export default exported;
