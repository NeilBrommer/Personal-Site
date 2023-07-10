const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const eleventySyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const eleventySass = require("eleventy-sass");
const mdDefList = require("markdown-it-deflist");
const eleventyRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
	eleventyConfig.setBrowserSyncConfig({
		files: "./_site/css/**/*.css",
	});
	eleventyConfig.addPassthroughCopy({
		"node_modules/prism-themes/themes/prism-material-light.min.css":
			"css/prism-material-light.min.css",
		"node_modules/prism-themes/themes/prism-material-oceanic.min.css":
			"css/prism-material-oceanic.min.css",
		"node_modules/feather-icons/dist/feather-sprite.svg": "images/feather-sprite.svg",
		"src/js/site.js": "js/site.js"
	});
	eleventyConfig.addPlugin(eleventyNavigationPlugin);
	eleventyConfig.addPlugin(eleventySyntaxHighlight);
	eleventyConfig.addPlugin(eleventyRss);
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
		return collection.filter(item => {
			if (item.url == null || item.url == false)
				return false;

			if (item.data.tags == null)
				return true;

			if (item.data.tags.includes("MainPage"))
				return false;

			return true;
		});
	});
	eleventyConfig.addFilter("orderBySectionOrder", (collection) =>
		collection.sort((a, b) => a.data.sectionOrder - b.data.sectionOrder)
	);
	eleventyConfig.addFilter("filterDrafts", collection => {
		if (process.env.BUILD_DRAFTS) {
			return collection;
		}

		return collection.filter(item => {
			if (item.data.draft != null) {
				return !item.data.draft;
			}

			return true;
		});
	});
	eleventyConfig.addFilter("log", (value) => console.log(value));

	return {
		dir: {
			input: "src",
		},
	};
};
