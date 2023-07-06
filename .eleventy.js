const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const eleventySass = require("eleventy-sass");
const mdDefList = require("markdown-it-deflist");

module.exports = function (eleventyConfig) {
	eleventyConfig.setBrowserSyncConfig({
		files: "./_site/css/**/*.css",
	});
	eleventyConfig.addPassthroughCopy({
		"node_modules/bootstrap-icons/bootstrap-icons.svg":
			"images/bootstrap-icons.svg",
		"node_modules/@fortawesome/fontawesome-free/sprites":
			"images/fontawesome",
		"src/js/site.js": "js/site.js"
	});
	eleventyConfig.addPlugin(eleventyNavigationPlugin);
	eleventyConfig.addPlugin(eleventySass, {
		sass: {
			loadPaths: ["node_modules"],
		},
	});
	eleventyConfig.amendLibrary("md", mdLib => mdLib.use(mdDefList));

	eleventyConfig.addFilter("IsNotPage", (collection, url) =>
		collection.filter(item => item.url != url));
	eleventyConfig.addFilter("IsMainPageSection", (collection) => {
		return collection.filter(item => !item.url || item.url.startsWith("/_sections"));
	});
	eleventyConfig.addFilter("IsNotMainPageSection", (collection) => {
		return collection.filter(item => item.url != null && (item.data.tags == null || !item.data.tags.includes("MainPage")));
	});
	eleventyConfig.addFilter("orderBySectionOrder", (collection) =>
		collection.sort((a, b) => a.data.sectionOrder - b.data.sectionOrder)
	);
	eleventyConfig.addFilter("filterDrafts", collection => {
		if (process.env.BUILD_DRAFTS === true) {
			console.log("Skipping filtering drafts");

			return collection;
		}

		return collection.filter(item => {
			console.log(item);

			if (item.data.draft != null) {
				return !item.data.draft;
			}

			return true;
		});
	});
	eleventyConfig.addFilter("log", (value) => console.log(value));

	console.log("BUILD_DRAFTS: " + process.env.BUILD_DRAFTS);

	return {
		dir: {
			input: "src",
		},
	};
};