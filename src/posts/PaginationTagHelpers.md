---
title: Pagination Tag Helpers
description: A couple of tag helpers to automate creating common pagination components
tags: [ Programming, C#, ASP.NET Core ]
---

These tag helpers work with [`PaginatedResults`](/posts/CsPaginationTools) to automatically create things like a results header (e.g. "Showing results 1-20 of 123" and "Page 1 of 7") as well as pagination links.

## How to use

```csharp
<pager-details results="this.Model.MyResults.ToObjectPaginatedResults()" />

@foreach (var result in this.Model.MyResults.Results)
{
	...
}

<pager results="@this.Model.Accounts.ToObjectPaginatedResults()"
	page-number-key="@nameof(this.Model.PageNumber)" />
```

The query parameter given as `page-number-key` will be changed or added to each the pagination link. The `page-number-key` query parameter will be left off for links to page 1.

## Code

The `pager-details` tag helper:

```csharp
using ASIS.Shared;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Text.Encodings.Web;

namespace ASIS.Shared.TagHelpers;

/// <summary>
/// Displays details about pagination in the form "Showing results x - y of z" on the left and
/// "Page x of y" on the right
/// </summary>
public class PaginationDetailsTagHelper : TagHelper
{
	public required IPaginatedResults Results { get; set; }

	/// <summary>
	/// The name for the item to be displayed, e.g. <c>results</c>. This will be used in the format
	/// "Showing <c>results</c> 1-10 of 100".
	/// </summary>
	public string ResultName { get; set; } = "results";

	public override void Process(TagHelperContext context, TagHelperOutput output)
	{
		output.TagName = "div";
		output.TagMode = TagMode.StartTagAndEndTag;
		output.AddClass("pagination-details", HtmlEncoder.Default);

		TagBuilder resultsNumDetails = new("span");
		resultsNumDetails.InnerHtml.Append($"Showing {this.ResultName} "
			+ $"{this.Results.FirstResultNumber} - {this.Results.LastResultNumber} "
			+ $"of {this.Results.TotalResultsCount}");
		output.Content.AppendHtml(resultsNumDetails);

		TagBuilder pageNumDetails = new("span");
		pageNumDetails.InnerHtml.Append(
			$"Page {this.Results.PageNumber} of {this.Results.LastPageNumber}");
		output.Content.AppendHtml(pageNumDetails);
	}
}
```

And the `pager` tag helper:

```csharp
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Primitives;
using System.Collections.Immutable;

namespace ASIS.Shared.TagHelpers;

/// <summary>
/// Creates a list of links to pages for the current list of data. This will replace the page number
/// parameter in the query string using the <see cref="PageNumberKey"/>.
/// </summary>
/// <remarks>
/// Page 1 is assumed to be the default and the page number parameter will be excluded
/// </remarks>
public class PaginationTagHelper : TagHelper
{
	public required IPaginatedResults Results { get; set; }

	/// <summary>The name of the page number parameter in the query string</summary>
	public required string PageNumberKey { get; set; }

	[ViewContext, HtmlAttributeNotBound]
	public required ViewContext ViewContext { get; set; }

	private string CurrentPagePath
	{
		get => this.ViewContext.HttpContext.Request.PathBase
			+ this.ViewContext.HttpContext.Request.Path;
	}
	private ImmutableDictionary<string, StringValues> QueryStringValues { get; set; }
		= ImmutableDictionary.Create<string, StringValues>();

	public override void Process(TagHelperContext context, TagHelperOutput output)
	{
		output.TagName = "nav";
		output.TagMode = TagMode.StartTagAndEndTag;
		output.AddClass("wsu-pagination", HtmlEncoder.Default);
		output.Attributes.Add("aria-label", "pagination");

		TagBuilder paginationList = new("ul");
		paginationList.AddCssClass("wsu-pagination__menu");

		this.QueryStringValues = QueryHelpers
			.ParseQuery(this.ViewContext.HttpContext.Request.QueryString.Value)
			.ToImmutableDictionary()
			.Remove(this.PageNumberKey);

		foreach (int i in Enumerable.Range(1, this.Results.LastPageNumber))
		{
			paginationList.InnerHtml.AppendHtml(this.CreatePageItem(i, i.ToString()));
		}

		output.Content.AppendHtml(this.CreatePreviousPageItem());
		output.Content.AppendHtml(paginationList);
		output.Content.AppendHtml(this.CreateNextPageItem());
	}

	private TagBuilder CreatePageItem(int pageNumber, string linkText)
	{
		TagBuilder listItem = new("li");
		listItem.AddCssClass("wsu-pagination__menu-page");

		TagBuilder link = new("a");
		link.Attributes.Add("aria-label", $"Goto Page {pageNumber}");

		if (pageNumber == this.Results.PageNumber)
			link.Attributes.Add("aria-current", "true");

		link.InnerHtml.AppendHtml(linkText);

		// Leave off the number for page 1
		ImmutableDictionary<string, StringValues> queryStringWithPageNumber = pageNumber == 1
			? this.QueryStringValues
			: this.QueryStringValues.Add(this.PageNumberKey, pageNumber.ToString());

		link.Attributes.Add("href", QueryHelpers.AddQueryString(
			this.CurrentPagePath, queryStringWithPageNumber));

		listItem.InnerHtml.AppendHtml(link);
		return listItem;
	}

	private TagBuilder CreatePreviousPageItem()
	{
		TagBuilder link = new("a");
		link.AddCssClass("wsu-pagination__previous");
		link.AddCssClass("wsu-button");
		link.AddCssClass("wsu-button--style-outline");
		link.Attributes.Add("aria-label", "Goto Previous Page");

		if (this.Results.IsFirstPage)
			link.Attributes.Add("disabled", "disabled");

		// Leave off the number for page 1
		ImmutableDictionary<string, StringValues> queryStringWithPageNumber =
			this.Results.PreviousPageNumber == 1
				? this.QueryStringValues
				: this.QueryStringValues
					.Add(this.PageNumberKey, this.Results.PreviousPageNumber.ToString());

		link.Attributes.Add("href", QueryHelpers.AddQueryString(
			this.CurrentPagePath, queryStringWithPageNumber));

		link.InnerHtml.AppendHtml("Previous");

		return link;
	}

	private TagBuilder CreateNextPageItem()
	{
		TagBuilder link = new("a");
		link.AddCssClass("wsu-pagination__next");
		link.AddCssClass("wsu-button");
		link.AddCssClass("wsu-button--style-outline");
		link.Attributes.Add("aria-label", "Goto Next Page");

		if (this.Results.IsLastPage)
			link.Attributes.Add("disabled", "disabled");

		// Leave off the number for page 1
		ImmutableDictionary<string, StringValues> queryStringWithPageNumber =
			this.Results.NextPageNumber == 1
				? this.QueryStringValues
				: this.QueryStringValues
					.Add(this.PageNumberKey, this.Results.NextPageNumber.ToString());

		link.Attributes.Add("href", QueryHelpers
			.AddQueryString(this.CurrentPagePath, queryStringWithPageNumber));

		link.InnerHtml.AppendHtml("Next");

		return link;
	}
}
```

And some CSS for the `pager-details`:

```css
.paginationDetails {
	display: flex;
	flex-wrap: wrap;
	row-gap: 0.25em;
	column-gap: 1em;
	margin-bottom: 1em;
}

.paginationDetails:first-child {
	margin-right: auto;
}
```
