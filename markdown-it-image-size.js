const imageSize = require("image-size");
const markdownIt = require("markdown-it");
const fetch = require("sync-fetch");

function markdownItImageSize(md) {
	md.renderer.rules.image = (tokens, index, options, env) => {
		const token = tokens[index];
		const srcIndex = token.attrIndex("src");
		const imageUrl = token.attrs[srcIndex][1];
		const caption = md.utils.escapeHtml(token.content);
		const otherAttributes = generateAttributes(md, token);

		const isExternalImage =
			imageUrl.startsWith("http://") ||
			imageUrl.startsWith("https://") ||
			imageUrl.startsWith("//");

		const isLocalAbsoluteUrl = imageUrl.startsWith("/");

		let { width, height } = isExternalImage
			? getImageDimensionsFromExternalImage(imageUrl)
			: getImageDimensions(`${isLocalAbsoluteUrl ? "./src" : ""}${imageUrl}`);

		let imageFileName = imageUrl
			.replaceAll("\\", "/")
			.split("/")
			.pop();

		let scaleMatches = Array.from(imageFileName.matchAll(/_([0-9])x/g));

		if (scaleMatches.length > 0){
			let scale = scaleMatches.pop()[1];

			width = width / scale;
			height = height / scale;
		}

		const dimensionsAttributes = width && height
			? ` width="${width}" height="${height}"`
			: "";

		return `<img src="${imageUrl}" alt="${caption}"${dimensionsAttributes}${
			otherAttributes ? " " + otherAttributes : ""
		}>`;
	};
}

function generateAttributes(md, token) {
	const ignore = ["src", "alt"];
	const escape = ["title"];

	return token.attrs
		.filter(([key]) => !ignore.includes(key))
		.map(([key, value]) => {
			const escapeAttributeValue = escape.includes(key);
			const finalValue = escapeAttributeValue
				? md.utils.escapeHtml(value)
				: value;

		return `${key}="${finalValue}"`;
	})
	.join(" ");
}

const customPluginDefaults = {
	getAbsPathFromEnv: (env) => {
		const markdownPath = env?.page?.inputPath; // 11ty

		if (markdownPath) {
			return markdownPath
				.substring(0, markdownPath.lastIndexOf("/"))
				.replace(/\/\.\//g, "/");
		}

		return undefined;
	},
};

function getImageDimensions(imageUrl, env) {
	try {
		const { width, height } = imageSize(imageUrl);
		return { width, height };
	} catch (error) {
		const isRelativePath = !imageUrl.startsWith("/");
		const inputPath = customPluginDefaults.getAbsPathFromEnv(env);

		if (isRelativePath && inputPath) {
			return getImageDimensions(`${inputPath}/${imageUrl}`);
		}

		console.error(
			`markdown-it-image-size: Could not get dimensions of image with url ${imageUrl}.\n\n`,
			error,
		);

		return { width: undefined, height: undefined };
	}
}

function getImageDimensionsFromExternalImage(imageUrl) {
	const isMissingProtocol = imageUrl.startsWith("//");

	const response = fetch(isMissingProtocol ? `https:${imageUrl}` : imageUrl);
	const buffer = response.buffer();
	const { width, height } = imageSize(buffer);

	return { width, height };
}

exports.markdownItImageSize = markdownItImageSize;
