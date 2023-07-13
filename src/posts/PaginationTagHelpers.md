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
using ASIS.SecretsManagement.Shared;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Text.Encodings.Web;

/// <summary>
/// Displays details about pagination in the form "Showing results x - y of z" on the left and
/// "Page x of y" on the right
/// </summary>
public class PagerDetailsTagHelper : TagHelper
{
	public PaginatedResults<object> Results { get; set; }

	public override void Process(TagHelperContext context, TagHelperOutput output)
	{
		output.TagName = "div";
		output.TagMode = TagMode.StartTagAndEndTag;
		output.AddClass("paginationDetails", HtmlEncoder.Default);

		TagBuilder resultsNumDetails = new("span");
		resultsNumDetails.InnerHtml.Append("Showing results "
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
using ASIS.SecretsManagement.Shared;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Primitives;
using System.Collections.Immutable;

/// <summary>
/// Creates a list of links to pages for the current list of data. This will replace the page number
/// parameter in the query string using the <see cref="PageNumberKey"/>.
/// </summary>
/// <remarks>
/// Page 1 is assumed to be the default and the page number parameter will be excluded
/// </remarks>
public class PagerTagHelper : TagHelper
{
	/// <summary>The name of the page number parameter in the query string</summary>
	public string PageNumberKey { get; set; }
	public PaginatedResults<object> Results { get; set; }

	[ViewContext, HtmlAttributeNotBound]
	public ViewContext ViewContext { get; set; }

	private string CurrentPagePath { get => this.ViewContext.HttpContext.Request.Path; }
	private ImmutableDictionary<string, StringValues> QueryStringValues { get; set; }

	public override void Process(TagHelperContext context, TagHelperOutput output)
	{
		output.TagName = "nav";
		output.TagMode = TagMode.StartTagAndEndTag;
		output.Attributes.Add("aria-label", "pagination");

		var paginationList = new TagBuilder("ul");
		paginationList.AddCssClass("pagination");

		this.QueryStringValues = QueryHelpers
			.ParseQuery(this.ViewContext.HttpContext.Request.QueryString.Value)
			.ToImmutableDictionary()
			.Remove(this.PageNumberKey);

		paginationList.InnerHtml.AppendHtml(this.CreatePreviousPageItem());

		foreach (int i in Enumerable.Range(1, this.Results.LastPageNumber))
		{
			paginationList.InnerHtml.AppendHtml(this.CreatePageItem(i, i.ToString()));
		}

		paginationList.InnerHtml.AppendHtml(this.CreateNextPageItem());

		output.Content.AppendHtml(paginationList);
	}

	private TagBuilder CreatePageItem(int pageNumber, string linkText)
	{
		var listItem = new TagBuilder("li");
		var link = new TagBuilder("a");

		if (pageNumber == this.Results.PageNumber)
			link.AddCssClass("currentPage");

		link.InnerHtml.AppendHtml(linkText);

		// Leave off the number for page 1
		var queryStringWithPageNumber = pageNumber == 1
			? this.QueryStringValues
			: this.QueryStringValues.Add(this.PageNumberKey, pageNumber.ToString());

		link.Attributes.Add("href", QueryHelpers.AddQueryString(
			this.CurrentPagePath, queryStringWithPageNumber));

		listItem.InnerHtml.AppendHtml(link);
		return listItem;
	}

	private TagBuilder CreatePreviousPageItem()
	{
		var listItem = new TagBuilder("li");
		var link = new TagBuilder("a");

		if (this.Results.IsFirstPage)
			link.AddCssClass("disabled");

		// Leave off the number for page 1
		var queryStringWithPageNumber = this.Results.PreviousPageNumber == 1
			? this.QueryStringValues
			: this.QueryStringValues
				.Add(this.PageNumberKey, this.Results.PreviousPageNumber.ToString());

		link.Attributes.Add("href", QueryHelpers.AddQueryString(
			this.CurrentPagePath, queryStringWithPageNumber));

		link.InnerHtml.AppendHtml("«");

		listItem.InnerHtml.AppendHtml(link);
		return listItem;
	}

	private TagBuilder CreateNextPageItem()
	{
		var listItem = new TagBuilder("li");
		var link = new TagBuilder("a");

		if (this.Results.IsLastPage)
			link.AddCssClass("disabled");

		// Leave off the number for page 1
		var queryStringWithPageNumber = this.Results.NextPageNumber == 1
			? this.QueryStringValues
			: this.QueryStringValues.Add(this.PageNumberKey, this.Results.NextPageNumber.ToString());

		link.Attributes.Add("href", QueryHelpers.AddQueryString(
			this.CurrentPagePath, queryStringWithPageNumber));

		link.InnerHtml.AppendHtml("»");

		listItem.InnerHtml.AppendHtml(link);
		return listItem;
	}
}

public static class PaginatedResultsExtensions
{
	/// <summary>Razor doesn't like casting, so use this instead</summary>
	public static PaginatedResults<object> ToObjectPaginatedResults<T>(
		this PaginatedResults<T> paginatedResults) where T : class
	{
		return new PaginatedResults<object>(paginatedResults.PageNumber,
			paginatedResults.ResultsPerPage, paginatedResults.Results,
			paginatedResults.TotalResultsCount);
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
