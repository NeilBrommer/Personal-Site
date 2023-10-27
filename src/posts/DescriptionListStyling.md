---
title: Description List Styling
description: Some styling for `<dl>` elements beyond the basics I usually see
tags: [ Programming, CSS ]
---

The `<dl>` element is useful for displaying metadata or a read only version of a form. The basic way of styling these is to make `<dt>` elements bold and make `<dt>` and `<dd>` block elements. These styles allow some more complex ways of displaying a description list.

## Default Basic Styles

These are some basic styles to use by default:

![Basic Description List Styles](/img/BasicDescriptionList_2x.png)

```html
<dl>
	<dt>Term 1</dt>
	<dd>Term 1 description</dd>

	<dt>Term 2</dt>
	<dd>Term 2 description 1</dd>
	<dd>Term 2 description 2</dd>
</dl>
```

```scss
dl {
	margin-block-start: 0;
	margin-block-end: 0;
	margin-bottom: 1em;
}

dt {
	font-weight: bold;
	line-height: 1.75;
}

dd {
	margin-inline-start: 0;
	margin-left: 1em;
	line-height: 1.75;
}

// Add spacing between dd elements
dd + dd {
	margin-top: 0.5em;
}
```

## Side-By-Side Columns

This styling will put the `<dt>` elements in one column and the `<dd>` elements into another. This can cause issues on small screens, so it supports breakpoints where it will fall back to the default style.

![Side-By-Side Columns Description List Styles](/img/ColumnsDescriptionList_2x.png)

```html
<dl class="dl-columns-tablet">
	<dt>Term 1</dt>
	<dd>Term 1 description</dd>

	<dt>Term 2</dt>
	<dd>Term 2 description 1</dd>
	<dd>Term 2 description 2</dd>

	<dt>Term 3</dt>
	<dd>Term 3 description 1</dd>
	<dd>Term 3 description 2</dd>
</dl>
```

```scss
$columns-base-name: dl-columns;
$wsu-breakpoint-map: (
	"phone-small": 450px,
	"phone": 576px,
	"tablet": 768px,
	"tablet-medium": 860px,
	"tablet-large": 992px,
	"desktop": 1260px,
	"ultrawide": 1600px,
	"xultrawide": 1900px,
	"xxultrawide": 2400px
);

@each $name, $value in $wsu-breakpoint-map {
	@media (min-width: #{$value}) {
		dl.#{$columns-base-name}-#{$name} {
			display: grid;
			grid-template-columns: auto 1fr;
			gap: 0 1rem;

			& > dt {
				grid-column: 1;
			}

			& > dd {
				grid-column: 2;
				margin-left: 0;
				margin-top: 0;
			}

			// Allow going back to the default stacked style
			div.escape-columns {
				grid-column: span 2;

				dt {
					margin-top: 0.5em;
				}

				dd {
					margin-left: 1em;
				}

				dt,
				dd {
					display: block;
				}
			}
		}
	}
}
```

You can also mix this with the default stacked style:

![Mixed Description List Styles](/img/MixedDescriptionList_2x.png)

```html
<dl class="dl-columns-phone">
	<dt>Term 1</dt>
	<dd>Term 1 description</dd>

	<dt>Term 2</dt>
	<dd>Term 2 description 1</dd>
	<dd>Term 2 description 2</dd>

	<div class="escape-columns">
		<dt>Term 3</dt>
		<dd>
			<pre><code>Here's a block of code</code></pre>
		</dd>
	</div>
</dl>
```

## Index List

This styling is for a list of links with a description. This is particularly useful for index pages that have an actual list of pages:

![Index Description List](/img/IndexDescriptionList_2x.png)

```html
<dl class="index-list">
	<dt><a href="#">Page 1</a></dt>
	<dd>A description of page 1</dd>

	<dt><a href="#">Page 2</a></dt>
	<dd>A description of page 2</dd>

	<dt><a href="#">Page 3</a></dt>
	<dd>A description of page 3</dd>
</dl>
```

```scss
dl.index-list {
	dt {
		display: inline;

		&:after {
			content: " - ";
		}
	}

	dd {
		display: inline;
		margin-left: 0;

		&:not(:last-child):after {
			// Display each dt/dd pair on separate lines
			content: "";
			display: block;
			margin-bottom: 1em;
		}
	}
}
```
